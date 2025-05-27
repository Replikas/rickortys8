export interface Episode {
  id: number;
  code: string;
  title: string;
  description: string;
  episodeNumber: number;
}

export interface StreamingLink {
  id: number;
  episodeId: number;
  url: string;
  quality: string;
  sourceName: string;
}

export interface EpisodeWithLinks extends Episode {
  links: StreamingLink[];
}

export interface InsertStreamingLink {
  episodeId: number;
  url: string;
  quality: string;
  sourceName: string;
}