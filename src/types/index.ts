import { moods } from "@/db/schema";

export type Mood = (typeof moods)[number];

export interface IEntry {
  dateKey: string;
  journal?: string;
  mood?: Mood;
  coverMediaId?: number; // Optional cover media ID
}

export interface IMedia {
  entryId: number;
  type: "image" | "video";
  uri: string;
  caption?: string;
  duration?: number; // Optional duration for videos
  order: number;
}
