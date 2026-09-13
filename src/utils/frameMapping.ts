// Maps the on-screen editor frame into the pixel space of the file that gets exported, so a saved
// video is framed exactly like the preview — "cover" crops the source, "contain" pads around it.
export type FitMode = "cover" | "contain";

// Keeps padded exports from demanding a canvas the hardware encoder would refuse.
const MAX_EXPORT_DIM = 1920;

export type ExportFrame = {
  /** The exported canvas — always the editor frame's aspect ratio. */
  width: number;
  height: number;
  /** The source scaled to this size before being placed on the canvas. */
  mediaWidth: number;
  mediaHeight: number;
  /** Where the scaled source's top-left sits on the canvas — negative when "cover" crops it away. */
  offsetX: number;
  offsetY: number;
  /** On-screen frame units per exported pixel; overlay sizes divide by this to scale up. */
  scale: number;
};

function fitScale(frameW: number, frameH: number, mediaW: number, mediaH: number, fit: FitMode): number {
  const coverScale = Math.max(frameW / mediaW, frameH / mediaH);
  const containScale = Math.min(frameW / mediaW, frameH / mediaH);
  return fit === "cover" ? coverScale : containScale;
}

// h264 rejects odd dimensions, and even offsets keep the chroma planes aligned.
function evenRound(n: number): number {
  return Math.round(n / 2) * 2;
}

export function mediaExportFrame(
  frameW: number,
  frameH: number,
  mediaW: number,
  mediaH: number,
  fit: FitMode,
): ExportFrame {
  const fitted = fitScale(frameW, frameH, mediaW, mediaH, fit);
  // Exported pixels per frame unit: enough to keep the source's own detail, but never past the encoder cap.
  const density = Math.min(1 / fitted, MAX_EXPORT_DIM / Math.max(frameW, frameH));

  const width = Math.max(2, evenRound(frameW * density));
  const height = Math.max(2, evenRound(frameH * density));
  let mediaWidth = Math.max(2, evenRound(mediaW * fitted * density));
  let mediaHeight = Math.max(2, evenRound(mediaH * fitted * density));
  let offsetX = evenRound(((frameW - mediaW * fitted) / 2) * density);
  let offsetY = evenRound(((frameH - mediaH * fitted) / 2) * density);

  // Rounding must not push the crop window past the scaled source, nor leave it overhanging the pad.
  if (offsetX <= 0) {
    mediaWidth = Math.max(mediaWidth, width);
    offsetX = Math.max(offsetX, width - mediaWidth);
  } else {
    mediaWidth = Math.min(mediaWidth, width);
    offsetX = Math.min(offsetX, width - mediaWidth);
  }
  if (offsetY <= 0) {
    mediaHeight = Math.max(mediaHeight, height);
    offsetY = Math.max(offsetY, height - mediaHeight);
  } else {
    mediaHeight = Math.min(mediaHeight, height);
    offsetY = Math.min(offsetY, height - mediaHeight);
  }

  return { width, height, mediaWidth, mediaHeight, offsetX, offsetY, scale: 1 / density };
}

// True when the source already fills the frame exactly, so the export can skip re-encoding it.
export function isExportFrameNoop(frame: ExportFrame, mediaW: number, mediaH: number): boolean {
  return (
    frame.offsetX === 0 &&
    frame.offsetY === 0 &&
    frame.width === mediaW &&
    frame.height === mediaH &&
    frame.mediaWidth === mediaW &&
    frame.mediaHeight === mediaH
  );
}
