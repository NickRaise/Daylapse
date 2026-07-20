import { moods } from "@/db/schema";

export type Mood = (typeof moods)[number];

export type DateStampPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type DateStampFormat = "DD MMM" | "DD MMM YYYY" | "MMM DD, YYYY";

/** Base ratio stored in settings; editor can flip portrait ↔ landscape */
export type AspectRatio = "4:3" | "1:1" | "9:16";

export interface IEntry {
  dateKey: string;
  journal?: string;
  mood?: Mood;
  coverMediaId?: number;
}

export interface IMedia {
  entryId: number;
  type: "image" | "video";
  uri: string;
  caption?: string;
  duration?: number;
  order: number;
}
