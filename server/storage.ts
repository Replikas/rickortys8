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
        title: "How Poopy Got His Poop Back",
        description: "In this episode, Poopy returns and gets his poop back in classic Rick and Morty fashion.",
        episodeNumber: 1,
      },
      {
        code: "S08E02", 
        title: "The Jerrick Trap",
        description: "Jerry and Rick get caught in a complex situation that challenges their relationship.",
        episodeNumber: 2,
      },
      {
        code: "S08E03",
        title: "Air Force Wong", 
        description: "Dr. Wong makes a return as the family deals with more psychological challenges.",
        episodeNumber: 3,
      },
      {
        code: "S08E04",
        title: "That's Amorte",
        description: "The family discovers something disturbing about their favorite new food.",
        episodeNumber: 4,
      },
      {
        code: "S08E05",
        title: "Final DeSmithation",
        description: "The Smith family faces their ultimate destiny in this intense episode.",
        episodeNumber: 5,
      },
      {
        code: "S08E06",
        title: "Juricksic Mort",
        description: "Rick and Morty encounter prehistoric creatures in a Jurassic adventure.",
        episodeNumber: 6,
      },
      {
        code: "S08E07",
        title: "Wet Kuat Amortican Summer",
        description: "A summer camp adventure turns into chaos for the family.",
        episodeNumber: 7,
      },
      {
        code: "S08E08",
        title: "Rise of the Numbericons: The Movie",
        description: "Mathematical entities threaten reality in this movie-length adventure.",
        episodeNumber: 8,
      },
      {
        code: "S08E09",
        title: "Mort: Ragnarick",
        description: "An apocalyptic event threatens multiple dimensions.",
        episodeNumber: 9,
      },
      {
        code: "S08E10",
        title: "Fear No Mort",
        description: "The season finale brings together all the storylines in an epic conclusion.",
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
