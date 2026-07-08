import { moods } from "@/db/schema";

export type Mood = (typeof moods)[number];

export interface IEntry {
  dateKey: string;
  journal: string;
  content: string;
  mood: Mood;
  coverMedia?: number; // Optional cover media ID
}

export interface IMedia {
  entryId: number;
  type: "image" | "video";
  uri: string;
  caption: string;
  thumbnailUri?: string; // Optional thumbnail URI for videos
  duration?: number; // Optional duration for videos
  order: number;
}
