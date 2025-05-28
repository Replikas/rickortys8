import dotenv from 'dotenv';
import { log } from './vite.js';
import path from 'path';
import { fileURLToPath } from 'url';
// Database connection (moved from db.ts)
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from "../shared/schema.js";
import { DatabaseStorage } from "./storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

log(`Current working directory: ${process.cwd()}`);
log(`Server directory: ${__dirname}`);

const envPath = path.resolve(__dirname, '.env');

log(`Attempting to load .env from: ${envPath}`);
const dotenvConfig = dotenv.config({ path: envPath });

if (dotenvConfig.error) {
  log(`dotenv error: ${dotenvConfig.error}`);
} else if (dotenvConfig.parsed) {
  log(`dotenv loaded variables: ${JSON.stringify(dotenvConfig.parsed)}`);
} else {
    log('dotenv.config() returned no parsed variables or error.');
}

log(`DATABASE_URL after dotenv config: ${process.env.DATABASE_URL}`);
export const storage = new DatabaseStorage(); // Import and export the storage instance

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ? `${process.env.DATABASE_URL}?sslmode=require&use_web_sockets=false` : undefined,
});

export const db = drizzle(pool, { schema }); // Pass the schema here

// Logging to check if DATABASE_URL is loaded here
console.log(`DATABASE_URL inside index.ts after dotenv: ${process.env.DATABASE_URL}`);

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic } from "./vite.js";
import { setupPingService } from "./ping.js";
import { auth } from "express-oauth2-jwt-bearer";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Auth0 configuration
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
});

// Protected route middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  checkJwt(req, res, (err) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  });
};

// Admin routes
app.post("/api/admin/login", (req, res) => {
  res.status(400).json({ message: "Please use Auth0 login" });
});

app.get("/api/admin/status", requireAuth, (req, res) => {
  res.json({ isAdmin: true });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Make sure db is initialized before registering routes
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error('Error:', err);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
      // Start ping service in production
      setupPingService();
    }

    // Use Render's PORT or fallback to 3001
    const port = parseInt(process.env.PORT || '3001', 10);
    server.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${app.get("env")}`);
      console.log(`Database URL: ${process.env.DATABASE_URL ? "Configured" : "Not configured"}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();