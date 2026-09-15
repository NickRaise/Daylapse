export const PHOTO_QUALITY = { low: 0.5, medium: 0.75, high: 0.9 } as const;
export const VIDEO_RESOLUTION = {
  low: { width: 640, height: 480 },
  medium: { width: 1280, height: 720 },
  high: { width: 1920, height: 1080 },
} as const;
export const TARGET_VIDEO_FPS = 60;

// Passed to <Camera videoBitRate> — without this the recorder always uses the hardware encoder's
// "normal" default regardless of the chosen resolution, which under-delivers at 1080p60.
export const CAMERA_VIDEO_BITRATE = {
  low: "low",
  medium: "normal",
  high: "extra-high",
} as const;

// FFmpeg -b:v target for the burn-in/reframe export and montage photo clips. h264_mediacodec has no
// sensible bitrate default of its own, so every quality tier gets an explicit, generous target —
// storage isn't a constraint, visible quality is what matters.
export const EXPORT_VIDEO_BITRATE = {
  low: "4M",
  medium: "10M",
  high: "20M",
} as const;
