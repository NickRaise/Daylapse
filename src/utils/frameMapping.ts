// Maps a point/length in the on-screen editor frame to the media's own native pixel space,
// accounting for how "contain" (letterboxed) or "cover" (cropped) fit scales the media inside the frame.
export type FitMode = "cover" | "contain";

function fitScale(frameW: number, frameH: number, mediaW: number, mediaH: number, fit: FitMode): number {
  const coverScale = Math.max(frameW / mediaW, frameH / mediaH);
  const containScale = Math.min(frameW / mediaW, frameH / mediaH);
  return fit === "cover" ? coverScale : containScale;
}

export function frameToMediaScale(
  frameW: number,
  frameH: number,
  mediaW: number,
  mediaH: number,
  fit: FitMode,
): number {
  return fitScale(frameW, frameH, mediaW, mediaH, fit);
}

// originX/originY: where the media's top-left corner lands in frame space (negative when "cover" crops it).
export function frameToMediaOrigin(
  frameW: number,
  frameH: number,
  mediaW: number,
  mediaH: number,
  fit: FitMode,
): { originX: number; originY: number; scale: number } {
  const scale = fitScale(frameW, frameH, mediaW, mediaH, fit);
  const originX = (frameW - mediaW * scale) / 2;
  const originY = (frameH - mediaH * scale) / 2;
  return { originX, originY, scale };
}

// Converts a rect measured in on-screen frame pixels into the media's native pixel space, clamped inside it.
export function frameRectToMediaRect(
  rect: { left: number; top: number; width: number; height: number },
  frameW: number,
  frameH: number,
  mediaW: number,
  mediaH: number,
  fit: FitMode,
): { left: number; top: number; width: number; height: number } {
  const { originX, originY, scale } = frameToMediaOrigin(frameW, frameH, mediaW, mediaH, fit);
  const left = (rect.left - originX) / scale;
  const top = (rect.top - originY) / scale;
  const width = rect.width / scale;
  const height = rect.height / scale;
  return {
    left: Math.max(0, Math.min(mediaW - width, left)),
    top: Math.max(0, Math.min(mediaH - height, top)),
    width,
    height,
  };
}
