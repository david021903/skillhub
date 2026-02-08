import http from "http";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

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

  // Basic middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health endpoints (also handled by raw server above, but good to have in Express too)
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Dynamic imports - load heavy modules after server is listening
  const rateLimit = (await import("express-rate-limit")).default;
  const { setupAuth, registerAuthRoutes } = await import("./replit_integrations/auth/index.js");
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
  app.use("/api/tokens", authLimiter);
  app.use("/api/cli/skills/*/publish", publishLimiter);
  app.use("/api/skills/explain", aiLimiter);
  app.use("/api/skills/generate", aiLimiter);
  app.use("/api/skills/chat", aiLimiter);

  // Setup auth and routes
  await setupAuth(app);
  registerAuthRoutes(app);
  registerRoutes(app);

  // Serve skill.md for agents
  app.get("/skill.md", (_req, res) => {
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.sendFile(path.join(__dirname, "../public/skill.md"));
  });

  if (process.env.NODE_ENV === "production") {
    const publicPath = path.join(__dirname, "../public");
    // Serve static files
    app.use(express.static(publicPath));
    // Catch-all for SPA routing
    app.get("*", (_req, res) => {
      res.sendFile(path.join(publicPath, "index.html"));
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
