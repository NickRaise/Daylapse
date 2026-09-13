import { Directory, File, Paths } from "expo-file-system";
import { MediaRepository } from "@/repositories/media.repository";
import { MontageRepository } from "@/repositories/montage.repository";
import { toFileUri, toFsPath } from "@/utils/fileUri";

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

// Turns a still photo into a short silent clip so it can sit in the same timeline as real video clips.
async function photoToClip(uri: string, seconds: number): Promise<string> {
  const { FFmpegKit, ReturnCode } = require("@mtd1410/react-native-ffmpegkit") as typeof import("@mtd1410/react-native-ffmpegkit");
  const outPath = `${toFsPath(montageDir.uri)}/clip-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`;
  const command =
    `-y -loop 1 -t ${seconds} -i "${toFsPath(uri)}" ` +
    `-c:v libx264 -pix_fmt yuv420p -r 30 ` +
    `-vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black" ` +
    `"${outPath}"`;
  const session = await FFmpegKit.execute(command);
  const rc = await session.getReturnCode();
  if (!ReturnCode.isSuccess(rc)) {
    throw new Error(`photo-to-video failed for ${uri}`);
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

  const clipPaths: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    onProgress?.({ current: i + 1, total: items.length, stage: "converting" });
    try {
      if (item.type === "video") {
        clipPaths.push(toFsPath(item.uri));
      } else {
        clipPaths.push(await photoToClip(item.uri, item.duration ?? DEFAULT_PHOTO_SECONDS));
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
