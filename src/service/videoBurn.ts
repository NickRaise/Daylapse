import { toFsPath } from "@/utils/fileUri";

// Composites a transparent overlay PNG onto every frame of a video, burning captions/date stamp in permanently.
export async function burnOverlayOntoVideo(
  videoUri: string,
  overlayUri: string,
  outputPath: string,
): Promise<void> {
  const { FFmpegKit, ReturnCode } = require("@mtd1410/react-native-ffmpegkit") as typeof import("@mtd1410/react-native-ffmpegkit");
  const command =
    // libx264 is GPL-only and absent from the "https" FFmpegKit package this app ships — h264_mediacodec is the OS's own hardware encoder, available regardless of package variant.
    `-y -i "${toFsPath(videoUri)}" -i "${toFsPath(overlayUri)}" ` +
    `-filter_complex "overlay=0:0" ` +
    `-c:a copy -c:v h264_mediacodec -pix_fmt yuv420p ` +
    `"${toFsPath(outputPath)}"`;
  const session = await FFmpegKit.execute(command);
  const rc = await session.getReturnCode();
  if (!ReturnCode.isSuccess(rc)) {
    const logs = await session.getAllLogsAsString();
    throw new Error(`video burn failed (rc=${rc}): ${logs.slice(-800)}`);
  }
}
