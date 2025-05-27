import { episodes, streamingLinks, type Episode, type InsertEpisode, type StreamingLink, type InsertStreamingLink, type EpisodeWithLinks } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Episodes
  getAllEpisodes(): Promise<Episode[]>;
  getEpisode(id: number): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  deleteEpisode(id: number): Promise<void>;
  
  // Streaming Links
  getStreamingLinksForEpisode(episodeId: number): Promise<StreamingLink[]>;
  createStreamingLink(link: InsertStreamingLink): Promise<StreamingLink>;
  deleteStreamingLinksForEpisode(episodeId: number): Promise<void>;
  
  // Combined
  getEpisodesWithLinks(): Promise<EpisodeWithLinks[]>;
  searchEpisodes(query: string): Promise<EpisodeWithLinks[]>;
}

export class MemStorage implements IStorage {
  private episodes: Map<number, Episode>;
  private streamingLinks: Map<number, StreamingLink>;
  private currentEpisodeId: number;
  private currentLinkId: number;

  constructor() {
    this.episodes = new Map();
    this.streamingLinks = new Map();
    this.currentEpisodeId = 1;
    this.currentLinkId = 1;
    
    // Initialize with some Season 8 episodes
    this.initializeData();
  }

  private async initializeData() {
    const episodesData = [
      {
        code: "S08E01",
        title: "Summer of All Fears",
        description: "To punish Morty and Summer, Rick puts them in a simulation.",
        episodeNumber: 1,
      },
      {
        code: "S08E02", 
        title: "Valkyrick",
        description: "Space Beth calls her dad for a ride, broh.",
        episodeNumber: 2,
      },
      {
        code: "S08E03",
        title: "The Rick, The Mort & The Ugly", 
        description: "Some guys wanna rebuild the citadel, broh. Seems like a bad idea, broh. Yeehaw stuff, broh.",
        episodeNumber: 3,
      },
      {
        code: "S08E04",
        title: "The Last Temptation of Jerry",
        description: "Broh is risen. The Smiths learn the true meaning of Easter. Kind of. Broh.",
        episodeNumber: 4,
      },
      {
        code: "S08E05",
        title: "Cryo Mort a Rickver",
        description: "Rick and Morty wanna rob a ship in cryosleep, but people are light sleepers.",
        episodeNumber: 5,
      },
      {
        code: "S08E06",
        title: "The Curicksous Case of Bethjamin Button",
        description: "The brohs goes to a theme park Rick loves. Beth and Space Beth stay behind and regress or something.",
        episodeNumber: 6,
      },
      {
        code: "S08E07",
        title: "Ricker than Fiction",
        description: "Rick and Morty write the next installment of their favorite movie franchise.",
        episodeNumber: 7,
      },
      {
        code: "S08E08",
        title: "Nomortland",
        description: "Jerry makes a friend just as jobless as he is.",
        episodeNumber: 8,
      },
      {
        code: "S08E09",
        title: "Morty Daddy",
        description: "Summer and Rick dine out. Morty reconnects with someone from his past.",
        episodeNumber: 9,
      },
      {
        code: "S08E10",
        title: "Hot Rick",
        description: "Sometimes we try weird stuff to let go of the past.",
        episodeNumber: 10,
      },
    ];

    for (const episodeData of episodesData) {
      await this.createEpisode(episodeData);
    }
  }

  async getAllEpisodes(): Promise<Episode[]> {
    return Array.from(this.episodes.values()).sort((a, b) => a.episodeNumber - b.episodeNumber);
  }

  async getEpisode(id: number): Promise<Episode | undefined> {
    return this.episodes.get(id);
  }

  async createEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    const id = this.currentEpisodeId++;
    const episode: Episode = { ...insertEpisode, id };
    this.episodes.set(id, episode);
    return episode;
  }

  async getStreamingLinksForEpisode(episodeId: number): Promise<StreamingLink[]> {
    return Array.from(this.streamingLinks.values()).filter(
      (link) => link.episodeId === episodeId
    );
  }

  async createStreamingLink(insertLink: InsertStreamingLink): Promise<StreamingLink> {
    const id = this.currentLinkId++;
    const link: StreamingLink = { ...insertLink, id };
    this.streamingLinks.set(id, link);
    return link;
  }

  async getEpisodesWithLinks(): Promise<EpisodeWithLinks[]> {
    const episodes = await this.getAllEpisodes();
    const episodesWithLinks: EpisodeWithLinks[] = [];

    for (const episode of episodes) {
      const links = await this.getStreamingLinksForEpisode(episode.id);
      episodesWithLinks.push({ ...episode, links });
    }

    return episodesWithLinks;
  }

  async searchEpisodes(query: string): Promise<EpisodeWithLinks[]> {
    const allEpisodes = await this.getEpisodesWithLinks();
    
    if (!query.trim()) {
      return allEpisodes;
    }

    const lowerQuery = query.toLowerCase();
    return allEpisodes.filter(episode => 
      episode.title.toLowerCase().includes(lowerQuery) ||
      episode.code.toLowerCase().includes(lowerQuery) ||
      episode.description.toLowerCase().includes(lowerQuery)
    );
  }

  async deleteEpisode(id: number): Promise<void> {
    this.episodes.delete(id);
  }

  async deleteStreamingLinksForEpisode(episodeId: number): Promise<void> {
    this.streamingLinks.clear();
  }
}

export class DatabaseStorage implements IStorage {
  async getAllEpisodes(): Promise<Episode[]> {
    return await db.select().from(episodes);
  }

  async getEpisode(id: number): Promise<Episode | undefined> {
    const [episode] = await db.select().from(episodes).where(eq(episodes.id, id));
    return episode || undefined;
  }

  async createEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    const [episode] = await db
      .insert(episodes)
      .values(insertEpisode)
      .returning();
    return episode;
  }

  async deleteEpisode(id: number): Promise<void> {
    await db.delete(episodes).where(eq(episodes.id, id));
  }

  async getStreamingLinksForEpisode(episodeId: number): Promise<StreamingLink[]> {
    return await db.select().from(streamingLinks).where(eq(streamingLinks.episodeId, episodeId));
  }

  async createStreamingLink(link: InsertStreamingLink): Promise<StreamingLink> {
    const [streamingLink] = await db
      .insert(streamingLinks)
      .values(link)
      .returning();
    return streamingLink;
  }

  async deleteStreamingLinksForEpisode(episodeId: number): Promise<void> {
    await db.delete(streamingLinks).where(eq(streamingLinks.episodeId, episodeId));
  }

  async getEpisodesWithLinks(): Promise<EpisodeWithLinks[]> {
    const allEpisodes = await this.getAllEpisodes();
    const episodesWithLinks: EpisodeWithLinks[] = [];

    for (const episode of allEpisodes) {
      const links = await this.getStreamingLinksForEpisode(episode.id);
      episodesWithLinks.push({
        ...episode,
        links
      });
    }

    return episodesWithLinks;
  }

  async searchEpisodes(query: string): Promise<EpisodeWithLinks[]> {
    // For now, get all episodes and filter - can be optimized later with SQL search
    const allEpisodes = await this.getEpisodesWithLinks();
    const searchQuery = query.toLowerCase();
    
    return allEpisodes.filter(episode => 
      episode.title.toLowerCase().includes(searchQuery) ||
      episode.description.toLowerCase().includes(searchQuery) ||
      episode.code.toLowerCase().includes(searchQuery)
    );
  }
}

export const storage = new DatabaseStorage();
