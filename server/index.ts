import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupPingService } from "./ping";
import session from "express-session";
import { Redis } from "@upstash/redis";
import { Store } from "express-session";

// Extend the session type to include isAdmin
declare module 'express-session' {
  interface SessionData {
    isAdmin?: boolean;
  }
}

// Custom Upstash session store
class UpstashStore extends Store {
  private redis: Redis;

  constructor(redisClient: Redis) {
    super();
    this.redis = redisClient;
  }

  // Required by express-session, even if not used by a REST client
  on(event: string, listener: (...args: any[]) => void): this {
    // This store doesn't emit events like a traditional client
    // We can potentially log if we receive unexpected events
    if (event !== 'connect' && event !== 'disconnect') {
      log(`UpstashStore received unexpected event: ${event}`);
    }
    // For the 'disconnect' event, we should call the listener immediately as a REST client is always 'disconnected' in a traditional sense.
    if (event === 'disconnect') {
       listener();
    }
    return this; // Return this for chaining
  }

  async get(sid: string, callback: (err: any, session?: session.SessionData | null) => void): Promise<void> {
    try {
      const data = await this.redis.get(`sess:${sid}`);
      if (!data) {
        return callback(null, null);
      }
      callback(null, JSON.parse(data as string));
    } catch (err) {
      log('UpstashStore get error:', String(err));
      callback(err);
    }
  }

  async set(sid: string, session: session.SessionData, callback: (err?: any) => void): Promise<void> {
    try {
      // Set with expiration - using default session maxAge for now
      // If cookie.maxAge is set, use that, otherwise use a default (e.g., 24 hours in ms) converted to seconds
      const maxAgeSeconds = typeof session.cookie.maxAge === 'number' ? Math.floor(session.cookie.maxAge / 1000) : 24 * 60 * 60;
      await this.redis.set(`sess:${sid}`, JSON.stringify(session), { ex: maxAgeSeconds });
      callback(null);
    } catch (err) {
      log('UpstashStore set error:', String(err));
      callback(err);
    }
  }

  async destroy(sid: string, callback: (err?: any) => void): Promise<void> {
    try {
      await this.redis.del(`sess:${sid}`);
      callback(null);
    } catch (err) {
      log('UpstashStore destroy error:', String(err));
      callback(err);
    }
  }

  // Optionally implement touch, all, length, clear
  // touch method to update the expiration time of a session
  async touch(sid: string, session: session.SessionData, callback: (err?: any) => void): Promise<void> {
     try {
        const maxAgeSeconds = typeof session.cookie.maxAge === 'number' ? Math.floor(session.cookie.maxAge / 1000) : 24 * 60 * 60;
        await this.redis.expire(`sess:${sid}`, maxAgeSeconds);
        callback(null);
     } catch (err) {
        log('UpstashStore touch error:', String(err));
        callback(err);
     }
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: new UpstashStore(redis), // Use the custom store instance
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
