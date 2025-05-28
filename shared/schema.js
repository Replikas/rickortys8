import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const episodes = pgTable("episodes", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(), // e.g., "S08E01"
    title: text("title").notNull(),
    description: text("description").notNull(),
    episodeNumber: integer("episode_number").notNull(),
});
export const streamingLinks = pgTable("streaming_links", {
    id: serial("id").primaryKey(),
    episodeId: integer("episode_id").notNull(),
    url: text("url").notNull(),
    quality: text("quality").notNull(), // e.g., "1080p", "720p", "4K"
    sourceName: text("source_name").notNull(), // e.g., "StreamSite", "VideoHub"
});
export const insertEpisodeSchema = createInsertSchema(episodes).omit({
    id: true,
});
export const insertStreamingLinkSchema = createInsertSchema(streamingLinks).omit({
    id: true,
});
