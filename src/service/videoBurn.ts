import { loadFFmpegKit } from "@/service/ffmpeg";
import { toFsPath } from "@/utils/fileUri";
import type { CropPlan } from "@/utils/frameMapping";

// Re-frames a video the way the editor preview showed it (zoom, pan, cover/contain) and burns the
// caption/date overlay on permanently, so the exported file matches what was on screen.
export async function exportVideo(
  videoUri: string,
  overlayUri: string | null,
  plan: CropPlan | null,
  outputPath: string,
  fillColor: string,
  bitrate: string,
): Promise<void> {
  const { FFmpegKit, ReturnCode } = await loadFFmpegKit();

  const steps: string[] = [];
  let label = "0:v";
  if (plan) {
    const { cropW, cropH, cropX, cropY, outW, outH, width, height, padX, padY } = plan;
    steps.push(
      `[${label}]crop=${cropW}:${cropH}:${cropX}:${cropY},scale=${outW}:${outH},` +
        `pad=${width}:${height}:${padX}:${padY}:color=${fillColor}[framed]`,
    );
    label = "framed";
  }
  if (overlayUri) {
    steps.push(`[${label}][1:v]overlay=0:0[burned]`);
    label = "burned";
  }

  const overlayInput = overlayUri ? ` -i "${toFsPath(overlayUri)}"` : "";
  const command =
    // h264_mediacodec is the OS's hardware encoder; it has no sane default bitrate, so one is always given.
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
