import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupPingService } from "./ping";
import session from "express-session";

// Extend the session type to include isAdmin
declare module 'express-session' {
  interface SessionData {
    isAdmin?: boolean;
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Add session debugging middleware
app.use((req, res, next) => {
  log(`Request to ${req.path} - Session ID: ${req.sessionID}`);
  log(`Session before request:`, JSON.stringify(req.session));
  next();
});

// Admin login endpoint
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  
  // Check if the password matches the admin password from environment variable
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    log(`Admin login successful - Session ID: ${req.sessionID}`);
    log(`Session after setting isAdmin:`, JSON.stringify(req.session));
    res.json({ message: "Login successful" });
  } else {
    log(`Admin login failed - Session ID: ${req.sessionID}`);
    res.status(401).json({ message: "Invalid password" });
  }
});

// Admin logout endpoint
app.post("/api/admin/logout", (req, res) => {
  log(`Logging out - Session ID: ${req.sessionID}`);
  log(`Session before logout:`, JSON.stringify(req.session));
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

// Check admin status endpoint
app.get("/api/admin/status", (req, res) => {
  log(`Admin status check - Session ID: ${req.sessionID}`);
  log(`Session during status check:`, JSON.stringify(req.session));
  res.json({ isAdmin: !!req.session?.isAdmin });
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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
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

  // Use Render's PORT or fallback to 3000
  const port = process.env.PORT || 3000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
