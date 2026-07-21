import { moods } from "@/db/schema";

export type Mood = (typeof moods)[number];

export type DateStampPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type DateStampFormat = "DD MMM" | "DD MMM YYYY" | "MMM DD, YYYY";

export type CaptionSize = "sm" | "md" | "lg";
export type CaptionPosition =
  | "top-left"    | "top-center"    | "top-right"
  | "center-left" | "center"        | "center-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export type CaptionStyle = {
  textColor: string;
  bgColor: string;
  size: CaptionSize;
  position: CaptionPosition;
};

export type DateStampStyle = {
  textColor: string;
  bgColor: string;
};

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
