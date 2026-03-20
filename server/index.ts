import http from "http";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5000;

// Create Express app
const app = express();

// Track if Express app is initialized
let appReady = false;

// Create HTTP server FIRST - handles raw requests before Express is ready
const server = http.createServer((req, res) => {
  const url = req.url || "/";
  const accept = req.headers.accept || "";
  const isHealthCheck = url === "/health" || url.startsWith("/health?");
  const isRootHealthCheck = (url === "/" || url.startsWith("/?")) && !accept.includes("text/html");
  
  // Fast health check response for non-browser requests or /health endpoint
  if (isHealthCheck || (isRootHealthCheck && !appReady)) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }
  
  // Hand off to Express for everything else (including browser requests)
  app(req, res);
});

// Start listening IMMEDIATELY
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  
  // Initialize Express app asynchronously
  initializeApp().catch((err) => {
    console.error("Failed to initialize app:", err);
  });
});

async function initializeApp() {
  // In production, log static files path
  if (process.env.NODE_ENV === "production") {
    const publicPath = path.join(__dirname, "../public");
    console.log("Serving static files from:", publicPath);
  }

  // Trust proxy for rate limiting behind Replit's proxy
  app.set("trust proxy", 1);

  // Docs subdomain rewrite: docs.skillhub.space/foo → /docs/foo
  app.use((req, _res, next) => {
    const host = (req.hostname || "").replace(/:\d+$/, "");
    if (host.startsWith("docs.")) {
      const originalPath = req.path;
      if (
        !originalPath.startsWith("/docs") &&
        !originalPath.startsWith("/api") &&
        !originalPath.startsWith("/assets") &&
        !originalPath.startsWith("/@") &&
        !originalPath.startsWith("/node_modules") &&
        !originalPath.startsWith("/src") &&
        !originalPath.match(/\.(js|css|ico|png|jpg|svg|woff|woff2|ttf|map|json)$/) &&
        originalPath !== "/health"
      ) {
        req.url = "/docs" + (originalPath === "/" ? "" : originalPath);
      }
    }
    next();
  });

  // Basic middleware
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session setup with PostgreSQL store
  const PgSession = connectPgSimple(session);
  const pool = new Pool({
    connectionString: process.env.PROD_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  app.use(session({
    store: new PgSession({
      pool,
      tableName: "sessions",
      createTableIfMissing: true,
    }),
    proxy: true,
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "lax",
    },
  }));

  // Health endpoints (also handled by raw server above, but good to have in Express too)
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Dynamic imports - load heavy modules after server is listening
  const rateLimit = (await import("express-rate-limit")).default;
  const { setupAuthRoutes } = await import("./auth.js");
  const { registerRoutes } = await import("./routes.js");
  
  // Rate limiters
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { message: "Too many authentication attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const publishLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { message: "Too many publish requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30,
    message: { message: "Too many AI requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiters
  app.use("/api/", apiLimiter);
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/forgot-password", authLimiter);
  app.use("/api/auth/reset-password", authLimiter);
  app.use("/api/tokens", authLimiter);
  app.use("/api/cli/skills/*/publish", publishLimiter);
  app.use("/api/skills/explain", aiLimiter);
  app.use("/api/skills/generate", aiLimiter);
  app.use("/api/skills/chat", aiLimiter);

  // Setup auth, routes, admin routes, and SEO
  const { registerAdminRoutes } = await import("./admin-routes.js");
  const { registerSeoRoutes, getSkillMetaTags, injectMetaTags, getBrowsePreRendered, getSkillPreRendered, getUserPreRendered, docsPreRendered } = await import("./seo.js");
  setupAuthRoutes(app);
  registerRoutes(app);
  registerAdminRoutes(app);
  registerSeoRoutes(app);

  // Serve skill.md for agents
  app.get("/skill.md", (_req, res) => {
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    const skillMdPath = process.env.NODE_ENV === "production"
      ? path.join(__dirname, "../public/skill.md")
      : path.join(process.cwd(), "public/skill.md");
    res.sendFile(skillMdPath);
  });

  if (process.env.NODE_ENV === "production") {
    const publicPath = path.join(__dirname, "../public");
    app.use(express.static(publicPath));
    app.get("*", async (req, res) => {
      const indexPath = path.join(publicPath, "index.html");
      const skillMatch = req.path.match(/^\/skills\/([^/]+)\/([^/]+)\/?$/);
      if (skillMatch) {
        try {
          const [, owner, slug] = skillMatch;
          const meta = await getSkillMetaTags(owner, slug);
          if (meta) {
            const html = fs.readFileSync(indexPath, "utf-8");
            const skillContent = await getSkillPreRendered(owner, slug);
            return res.send(injectMetaTags(html, { ...meta, preRenderedContent: skillContent || undefined }));
          }
        } catch {}
      }
      if (req.path === "/browse") {
        try {
          const html = fs.readFileSync(indexPath, "utf-8");
          const browseContent = await getBrowsePreRendered();
          return res.send(injectMetaTags(html, {
            title: "Browse Skills - SkillHub",
            description: "Browse 1000+ OpenClaw agent skills. Search, filter, and discover skills for your AI agents.",
            url: "https://skillhub.space/browse",
            jsonLd: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "name": "Browse Skills",
              "url": "https://skillhub.space/browse",
              "description": "Browse 1000+ OpenClaw agent skills",
            }),
            preRenderedContent: browseContent,
          }));
        } catch (e) {
          console.error("Browse SSR error:", e);
        }
      }
      if (req.path === "/" || req.path === "") {
        try {
          const html = fs.readFileSync(indexPath, "utf-8");
          return res.send(injectMetaTags(html, {
            title: "SkillHub - OpenClaw Skills Registry",
            description: "Discover, share, and install AI agent skills. SkillHub is the registry for OpenClaw skills — browse 1000+ verified skills, publish your own, and supercharge your agents.",
            url: "https://skillhub.space/",
            jsonLd: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "SkillHub",
              "url": "https://skillhub.space",
              "description": "The OpenClaw Skills Registry — discover, share, and install AI agent skills",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://skillhub.space/browse?search={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
            preRenderedContent: `<article>
<h1>SkillHub — The OpenClaw Skills Registry</h1>
<p>Discover, share, and install AI agent skills. SkillHub is the central registry for OpenClaw skills — similar to how npm works for JavaScript or PyPI works for Python, but purpose-built for AI agent skill packages.</p>
<p>Browse over 1,000 verified and community-contributed skills. Each skill extends your AI agent's capabilities with new instructions, tools, and workflows. Skills are published in the open SKILL.md format and can be installed with a single command.</p>
<section>
<h2>What is SkillHub?</h2>
<p>SkillHub is a platform where developers and AI enthusiasts can discover, publish, and manage OpenClaw agent skills. Think of it as GitHub meets npm — you can browse a library of skills, star your favorites, fork and improve community skills, and publish your own creations for others to use.</p>
</section>
<section>
<h2>Getting Started</h2>
<p>Install the shsc command-line tool with <code>npm install -g shsc</code>, then run <code>shsc search</code> to find skills or <code>shsc install owner/skill-name</code> to install one. You can also browse and install skills directly from this website without any setup.</p>
</section>
<section>
<h2>Key Features</h2>
<ul>
<li>Browse and search over 1,000 skills with filtering and sorting</li>
<li>One-command installation via the shsc CLI tool</li>
<li>Automatic validation pipeline for security and quality</li>
<li>Version management with semantic versioning</li>
<li>Issues and pull requests for community collaboration</li>
<li>AI-powered skill explainer, generator, and chat assistant</li>
</ul>
</section>
<nav><a href="/browse">Browse Skills</a> | <a href="/docs">Documentation</a> | <a href="/docs/quick-start">Quick Start Guide</a></nav>
</article>`,
          }));
        } catch {}
      }
      if (req.path.startsWith("/docs")) {
        const docsPage = docsPreRendered[req.path] || docsPreRendered[req.path.replace(/\/$/, "")];
        if (docsPage) {
          try {
            const html = fs.readFileSync(indexPath, "utf-8");
            return res.send(injectMetaTags(html, {
              title: docsPage.title,
              description: docsPage.description,
              url: `https://skillhub.space${req.path}`,
              jsonLd: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": docsPage.title,
                "url": `https://skillhub.space${req.path}`,
              }),
              preRenderedContent: docsPage.content,
            }));
          } catch {}
        }
      }
      const userMatch = req.path.match(/^\/(users|u|skills)\/([^/]+)\/?$/);
      if (userMatch) {
        const handle = userMatch[2];
        try {
          const userData = await getUserPreRendered(handle);
          if (userData) {
            const html = fs.readFileSync(indexPath, "utf-8");
            return res.send(injectMetaTags(html, {
              title: userData.title,
              description: userData.description,
              url: `https://skillhub.space${req.path}`,
              jsonLd: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ProfilePage",
                "name": userData.title,
                "url": `https://skillhub.space${req.path}`,
              }),
              preRenderedContent: userData.content,
            }));
          }
        } catch {}
      }
      res.sendFile(indexPath);
    });
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({
      configFile: path.resolve(__dirname, "../vite.config.ts"),
      server: { 
        middlewareMode: true,
        hmr: { server: undefined },
      },
    });
    app.use(vite.middlewares);
  }

  appReady = true;
  console.log("Application fully initialized");
}
