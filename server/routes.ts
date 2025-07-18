import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./index.js"; // Import storage from index.ts
import { insertStreamingLinkSchema, insertEpisodeSchema, type InsertEpisode } from "../shared/schema.js";
import { z } from "zod";
import type { Session } from "express-session";
import { Router } from "express";
// import { pool } from "./db"; // Removed - pool is now in index.ts and not needed here
import { log } from "./vite.js";

// Extend Express Request type to include session
interface RequestWithSession extends Request {
  session: Session & {
    isAdmin?: boolean;
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all episodes with their streaming links
  app.get("/api/episodes", async (req, res) => {
    try {
      console.log('Fetching all episodes with links...');
      const episodes = await storage.getEpisodesWithLinks();
      console.log(`Found ${episodes.length} episodes`);
      res.json(episodes);
    } catch (error) {
      console.error("Error fetching episodes:", error);
      res.status(500).json({ message: "Failed to fetch episodes" });
    }
  });

  // Search episodes
  app.get("/api/episodes/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const episodes = await storage.searchEpisodes(query);
      res.json(episodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to search episodes" });
    }
  });

  // Get specific episode with links
  app.get("/api/episodes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const episode = await storage.getEpisode(id);
      
      if (!episode) {
        return res.status(404).json({ message: "Episode not found" });
      }

      const links = await storage.getStreamingLinksForEpisode(id);
      res.json({ ...episode, links });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch episode" });
    }
  });

  // Create new episode
  app.post("/api/episodes", async (req: RequestWithSession, res) => {
    const validation = insertEpisodeSchema.safeParse(req.body);
    if (!validation.success) {
      log("Episode validation failed:", JSON.stringify(validation.error.errors));
      return res.status(400).json({ message: "Invalid episode data" });
    }

    const episode: InsertEpisode = validation.data; // Add type annotation here

    try {
      const createdEpisode = await storage.createEpisode(episode);
      res.status(201).json(createdEpisode);
    } catch (error) {
      log("Error creating episode:", String(error));
      res.status(500).json({ message: "Error creating episode" });
    }
  });

  // Add streaming link to episode
  app.post("/api/streaming-links", async (req, res) => {
    try {
      const linkData = insertStreamingLinkSchema.parse(req.body);
      
      // Verify episode exists
      const episode = await storage.getEpisode(linkData.episodeId);
      if (!episode) {
        return res.status(404).json({ message: "Episode not found" });
      }

      const link = await storage.createStreamingLink(linkData);
      res.status(201).json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid link data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create streaming link" });
    }
  });

  // Get stats
  app.get("/api/stats", async (req, res) => {
    try {
      const episodes = await storage.getAllEpisodes();
      const allLinks = await Promise.all(
        episodes.map(episode => storage.getStreamingLinksForEpisode(episode.id))
      );
      const totalLinks = allLinks.flat().length;

      res.json({
        totalEpisodes: episodes.length,
        totalLinks,
        lastUpdated: "2 hours ago" // This could be dynamic based on actual data
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Delete episode
  app.delete("/api/episodes/:id", async (req: RequestWithSession, res) => {
    try {
      // Check if user is admin
      if (!req.session?.isAdmin) {
        return res.status(403).json({ message: "Only admins can delete episodes" });
      }

      const id = parseInt(req.params.id);
      const episode = await storage.getEpisode(id);
      
      if (!episode) {
        return res.status(404).json({ message: "Episode not found" });
      }

      // First delete all streaming links for this episode
      await storage.deleteStreamingLinksForEpisode(id);
      // Then delete the episode
      await storage.deleteEpisode(id);
      
      res.status(200).json({ message: "Episode deleted successfully" });
    } catch (error) {
      console.error("Error deleting episode:", error);
      res.status(500).json({ message: "Failed to delete episode" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
