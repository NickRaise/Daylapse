export const PHOTO_QUALITY = { low: 0.5, medium: 0.75, high: 0.9 } as const;
export const VIDEO_RESOLUTION = {
  low: { width: 640, height: 480 },
  medium: { width: 1280, height: 720 },
  high: { width: 1920, height: 1080 },
} as const;
export const TARGET_VIDEO_FPS = 60;
