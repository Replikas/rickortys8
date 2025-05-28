import express from 'express';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { episodes, streamingLinks, insertEpisodeSchema, insertStreamingLinkSchema } from '../shared/schema.js';
import { eq, desc, like, or } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ? `${process.env.DATABASE_URL}?sslmode=require` : undefined,
});
const db = drizzle(pool, { schema: { episodes, streamingLinks } });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.static('client/dist'));

// Simple admin authentication (in production, use proper auth)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Helper function to check admin
const isAdmin = (req: any) => {
  const authHeader = req.headers.authorization;
  return authHeader === `Bearer ${ADMIN_PASSWORD}`;
};

// API Routes

// Get all episodes with their streaming links
app.get('/api/episodes', async (req, res) => {
  try {
    const allEpisodes = await db
      .select()
      .from(episodes)
      .orderBy(desc(episodes.episodeNumber));
    
    const episodesWithLinks = await Promise.all(
      allEpisodes.map(async (episode) => {
        const links = await db
          .select()
          .from(streamingLinks)
          .where(eq(streamingLinks.episodeId, episode.id));
        return { ...episode, links };
      })
    );
    
    res.json(episodesWithLinks);
  } catch (error) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({ error: 'Failed to fetch episodes' });
  }
});

// Search episodes
app.get('/api/episodes/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.json([]);
    }
    
    const searchResults = await db
      .select()
      .from(episodes)
      .where(
        or(
          like(episodes.title, `%${query}%`),
          like(episodes.code, `%${query}%`),
          like(episodes.description, `%${query}%`)
        )
      )
      .orderBy(desc(episodes.episodeNumber));
    
    const episodesWithLinks = await Promise.all(
      searchResults.map(async (episode) => {
        const links = await db
          .select()
          .from(streamingLinks)
          .where(eq(streamingLinks.episodeId, episode.id));
        return { ...episode, links };
      })
    );
    
    res.json(episodesWithLinks);
  } catch (error) {
    console.error('Error searching episodes:', error);
    res.status(500).json({ error: 'Failed to search episodes' });
  }
});

// Add new episode (public)
app.post('/api/episodes', async (req, res) => {
  try {
    const episodeData = insertEpisodeSchema.parse(req.body);
    
    const [newEpisode] = await db
      .insert(episodes)
      .values(episodeData)
      .returning();
    
    res.json(newEpisode);
  } catch (error) {
    console.error('Error adding episode:', error);
    res.status(500).json({ error: 'Failed to add episode' });
  }
});

// Add streaming link to episode (public)
app.post('/api/episodes/:id/links', async (req, res) => {
  try {
    const episodeId = parseInt(req.params.id);
    const linkData = insertStreamingLinkSchema.parse({
      ...req.body,
      episodeId
    });
    
    const [newLink] = await db
      .insert(streamingLinks)
      .values(linkData)
      .returning();
    
    res.json(newLink);
  } catch (error) {
    console.error('Error adding streaming link:', error);
    res.status(500).json({ error: 'Failed to add streaming link' });
  }
});

// Admin: Update episode
app.put('/api/admin/episodes/:id', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Admin access required' });
  }
  
  try {
    const episodeId = parseInt(req.params.id);
    const episodeData = insertEpisodeSchema.parse(req.body);
    
    const [updatedEpisode] = await db
      .update(episodes)
      .set(episodeData)
      .where(eq(episodes.id, episodeId))
      .returning();
    
    if (!updatedEpisode) {
      return res.status(404).json({ error: 'Episode not found' });
    }
    
    res.json(updatedEpisode);
  } catch (error) {
    console.error('Error updating episode:', error);
    res.status(500).json({ error: 'Failed to update episode' });
  }
});

// Admin: Delete episode
app.delete('/api/admin/episodes/:id', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Admin access required' });
  }
  
  try {
    const episodeId = parseInt(req.params.id);
    
    // Delete associated streaming links first
    await db
      .delete(streamingLinks)
      .where(eq(streamingLinks.episodeId, episodeId));
    
    // Delete episode
    await db
      .delete(episodes)
      .where(eq(episodes.id, episodeId));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting episode:', error);
    res.status(500).json({ error: 'Failed to delete episode' });
  }
});

// Admin: Delete streaming link
app.delete('/api/admin/links/:id', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Admin access required' });
  }
  
  try {
    const linkId = parseInt(req.params.id);
    
    await db
      .delete(streamingLinks)
      .where(eq(streamingLinks.id, linkId));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting streaming link:', error);
    res.status(500).json({ error: 'Failed to delete streaming link' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});