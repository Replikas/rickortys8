export interface Episode {
  id: number;
  code: string;
  title: string;
  description: string;
  airDate: string;
  duration: number;
}

export interface StreamingLink {
  id: number;
  episodeId: number;
  platform: string;
  url: string;
  quality: string;
}

export interface EpisodeWithLinks extends Episode {
  links: StreamingLink[];
}

export interface InsertStreamingLink {
  episodeId: number;
  platform: string;
  url: string;
  quality: string;
}