import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerRoutes } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/", apiLimiter);
app.use("/api/tokens", authLimiter);
app.use("/api/cli/skills/*/publish", publishLimiter);

async function main() {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerRoutes(app);

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../public")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "../public/index.html"));
    });
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
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
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Development server running on http://0.0.0.0:${PORT}`);
    });
  }
}

main().catch(console.error);
