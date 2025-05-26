import { episodes, streamingLinks, type Episode, type InsertEpisode, type StreamingLink, type InsertStreamingLink, type EpisodeWithLinks } from "@shared/schema";

export interface IStorage {
  // Episodes
  getAllEpisodes(): Promise<Episode[]>;
  getEpisode(id: number): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  
  // Streaming Links
  getStreamingLinksForEpisode(episodeId: number): Promise<StreamingLink[]>;
  createStreamingLink(link: InsertStreamingLink): Promise<StreamingLink>;
  
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
        title: "Solaricks",
        description: "Rick and Morty are stranded on a planet that has achieved a tech level ahead of galactic civilization.",
        episodeNumber: 1,
      },
      {
        code: "S08E02", 
        title: "Rick: A Mort Well Lived",
        description: "Summer and Morty lock into a game console left behind by Rick.",
        episodeNumber: 2,
      },
      {
        code: "S08E03",
        title: "Bethic Twinstinct", 
        description: "Beth and Jerry go to a divorced parents mixer while Rick takes the kids to another dimension.",
        episodeNumber: 3,
      },
      {
        code: "S08E04",
        title: "That's Amorte",
        description: "Rick discovers that someone has been using his technology to make spaghetti.",
        episodeNumber: 4,
      },
      {
        code: "S08E05",
        title: "Final DeSmithation",
        description: "The family attends a fortune telling session that goes horribly wrong.",
        episodeNumber: 5,
      },
      {
        code: "S08E06",
        title: "Juricksic Mort",
        description: "Rick and Morty get stuck in a prehistoric world filled with dinosaurs.",
        episodeNumber: 6,
      },
      {
        code: "S08E07",
        title: "Wet Kuat Amortican Summer",
        description: "The family goes on a summer vacation that turns into a nightmare.",
        episodeNumber: 7,
      },
      {
        code: "S08E08",
        title: "Rise of the Numbericons: The Movie",
        description: "Rick and Morty face off against mathematical entities from another dimension.",
        episodeNumber: 8,
      },
      {
        code: "S08E09",
        title: "Mort: Ragnarick",
        description: "An apocalyptic scenario unfolds across multiple dimensions.",
        episodeNumber: 9,
      },
      {
        code: "S08E10",
        title: "Fear No Mort",
        description: "The season finale brings all storylines together in an epic conclusion.",
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
}

export const storage = new MemStorage();
