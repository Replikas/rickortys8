import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStreamingLinkSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all episodes with their streaming links
  app.get("/api/episodes", async (req, res) => {
    try {
      const episodes = await storage.getEpisodesWithLinks();
      res.json(episodes);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
