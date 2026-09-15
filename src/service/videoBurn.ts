import { loadFFmpegKit } from "@/service/ffmpeg";
import { toFsPath } from "@/utils/fileUri";

export type VideoReframe = {
  width: number;
  height: number;
  mediaWidth: number;
  mediaHeight: number;
  offsetX: number;
  offsetY: number;
};

// Re-frames a video the way the editor preview did (cropping for "cover", padding for "contain") and
// burns the caption/date overlay on permanently, so the exported file matches what was on screen.
export async function exportVideo(
  videoUri: string,
  overlayUri: string | null,
  reframe: VideoReframe | null,
  outputPath: string,
  fillColor: string,
  bitrate: string,
): Promise<void> {
  const { FFmpegKit, ReturnCode } = await loadFFmpegKit();

  const steps: string[] = [];
  let label = "0:v";
  if (reframe) {
    const { width, height, mediaWidth, mediaHeight, offsetX, offsetY } = reframe;
    steps.push(`[${label}]scale=${mediaWidth}:${mediaHeight}[scaled]`);
    steps.push(
      offsetX <= 0 && offsetY <= 0
        ? `[scaled]crop=${width}:${height}:${-offsetX}:${-offsetY}[framed]`
        : `[scaled]pad=${width}:${height}:${offsetX}:${offsetY}:color=${fillColor}[framed]`,
    );
    label = "framed";
  }
  if (overlayUri) {
    steps.push(`[${label}][1:v]overlay=0:0[burned]`);
    label = "burned";
  }

  const overlayInput = overlayUri ? ` -i "${toFsPath(overlayUri)}"` : "";
  const command =
    // libx264 is GPL-only and absent from the "https" FFmpegKit package this app ships — h264_mediacodec is the OS's own hardware encoder, available regardless of package variant.
    // mediacodec has no sane bitrate default of its own (it falls back to something far below the source quality), so the target bitrate is always spelled out explicitly.
    `-y -i "${toFsPath(videoUri)}"${overlayInput} ` +
    `-filter_complex "${steps.join(";")}" -map "[${label}]" -map 0:a? ` +
    `-c:a copy -c:v h264_mediacodec -b:v ${bitrate} -pix_fmt yuv420p ` +
    `"${toFsPath(outputPath)}"`;
  const session = await FFmpegKit.execute(command);
  const rc = await session.getReturnCode();
  if (!ReturnCode.isSuccess(rc)) {
    const logs = await session.getAllLogsAsString();
    throw new Error(`video export failed (rc=${rc}): ${logs.slice(-800)}`);
  }
}
