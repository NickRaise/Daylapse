import { Directory, File, Paths } from "expo-file-system";
import { loadFFmpegKit } from "@/service/ffmpeg";
import { MediaRepository } from "@/repositories/media.repository";
import { MontageRepository } from "@/repositories/montage.repository";
import { toFileUri, toFsPath } from "@/utils/fileUri";
import { EXPORT_VIDEO_BITRATE, VIDEO_RESOLUTION } from "@/constants/media";
import useSettingsStore from "@/store/settings.store";

const montageDir = new Directory(Paths.document, "montages");
const DEFAULT_PHOTO_SECONDS = 2;

export type CompileProgress = {
  current: number;
  total: number;
  stage: "converting" | "merging";
};

export type CompileResult = {
  outputUri: string;
  duration: number;
};

type Dims = { width: number; height: number };

async function probeVideoDimensions(uri: string): Promise<Dims | null> {
  const { FFprobeKit } = await loadFFmpegKit();
  const session = await FFprobeKit.getMediaInformation(toFsPath(uri));
  const info = session.getMediaInformation();
  const stream = info?.getStreams().find((s) => s.getType() === "video");
  return stream ? { width: stream.getWidth(), height: stream.getHeight() } : null;
}

// Every clip must share one pixel size before merge(), or clips show up at different sizes mid-playback.
async function resolveTargetDims(items: { type: string; uri: string }[]): Promise<Dims> {
  for (const item of items) {
    if (item.type !== "video") continue;
    const dims = await probeVideoDimensions(item.uri);
    if (dims) return dims;
  }
  const { width, height } = VIDEO_RESOLUTION[useSettingsStore.getState().videoQuality];
  return { width: Math.min(width, height), height: Math.max(width, height) };
}

// Turns a still photo into a short silent clip so it can sit in the same timeline as real video clips.
async function photoToClip(uri: string, seconds: number, target: Dims, bitrate: string): Promise<string> {
  const { FFmpegKit, ReturnCode } = await loadFFmpegKit();
  const outPath = `${toFsPath(montageDir.uri)}/clip-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`;
  const command =
    // h264_mediacodec is the OS's hardware encoder; a silent track is added since merge() needs audio on every clip.
    `-y -loop 1 -i "${toFsPath(uri)}" -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=48000" ` +
    `-map 0:v:0 -map 1:a:0 -c:v h264_mediacodec -b:v ${bitrate} -c:a aac -t ${seconds} -pix_fmt yuv420p -r 30 ` +
    `-vf "scale=${target.width}:${target.height}:force_original_aspect_ratio=decrease,pad=${target.width}:${target.height}:(ow-iw)/2:(oh-ih)/2:color=black" ` +
    `-shortest ` +
    `"${outPath}"`;
  const session = await FFmpegKit.execute(command);
  const rc = await session.getReturnCode();
  if (!ReturnCode.isSuccess(rc)) {
    const logs = await session.getAllLogsAsString();
    throw new Error(`photo-to-video failed for ${uri} (rc=${rc}): ${logs.slice(-800)}`);
  }
  return outPath;
}

// Re-frames a real video clip to the montage's shared target dimensions when it doesn't already match.
async function normalizeVideoClip(uri: string, target: Dims, bitrate: string): Promise<string> {
  const { FFmpegKit, ReturnCode } = await loadFFmpegKit();
  const outPath = `${toFsPath(montageDir.uri)}/clip-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`;
  const command =
    `-y -i "${toFsPath(uri)}" ` +
    `-vf "scale=${target.width}:${target.height}:force_original_aspect_ratio=decrease,pad=${target.width}:${target.height}:(ow-iw)/2:(oh-ih)/2:color=black" ` +
    `-c:v h264_mediacodec -b:v ${bitrate} -c:a aac -pix_fmt yuv420p ` +
    `"${outPath}"`;
  const session = await FFmpegKit.execute(command);
  const rc = await session.getReturnCode();
  if (!ReturnCode.isSuccess(rc)) {
    const logs = await session.getAllLogsAsString();
    throw new Error(`video normalize failed for ${uri} (rc=${rc}): ${logs.slice(-800)}`);
  }
  return outPath;
}

// Compiles every media item in a date range into a single output video, saved as a Montage record.
export async function compileMontage(
  startDate: string,
  endDate: string,
  title: string | undefined,
  onProgress?: (p: CompileProgress) => void,
): Promise<CompileResult | null> {
  const items = await MediaRepository.getMediaByDateRange(startDate, endDate);
  if (items.length === 0) return null;

  montageDir.create({ intermediates: true, idempotent: true });

  const bitrate = EXPORT_VIDEO_BITRATE[useSettingsStore.getState().videoQuality];
  const target = await resolveTargetDims(items);

  const clipPaths: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    onProgress?.({ current: i + 1, total: items.length, stage: "converting" });
    try {
      if (item.type === "video") {
        const dims = await probeVideoDimensions(item.uri);
        const alreadyMatches = dims && dims.width === target.width && dims.height === target.height;
        clipPaths.push(
          alreadyMatches ? toFsPath(item.uri) : await normalizeVideoClip(item.uri, target, bitrate),
        );
      } else {
        clipPaths.push(await photoToClip(item.uri, item.duration ?? DEFAULT_PHOTO_SECONDS, target, bitrate));
      }
    } catch (error) {
      // Skip whatever fails to convert rather than losing the whole compile over one bad item.
      console.error("[montage] skipping item that failed to prepare:", item.uri, error);
    }
  }

  if (clipPaths.length === 0) return null;

  onProgress?.({ current: items.length, total: items.length, stage: "merging" });
  const { merge } = require("react-native-video-trim") as typeof import("react-native-video-trim");
  const result = await merge(clipPaths, { outputExt: "mp4" });

  const finalFile = new File(montageDir, `montage-${Date.now()}.mp4`);
  await new File(toFileUri(result.outputPath)).copy(finalFile);

  const durationSeconds = Math.round(result.duration / 1000);
  await MontageRepository.addMontage({
    title,
    dateRangeStart: startDate,
    dateRangeEnd: endDate,
    outputUri: finalFile.uri,
    duration: durationSeconds,
  });

  return { outputUri: finalFile.uri, duration: durationSeconds };
}
