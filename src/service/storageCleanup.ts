import { Directory, File, Paths } from "expo-file-system";
import { db } from "@/db";
import { media, montages } from "@/db/schema";
import { toFileUri, toFsPath } from "@/utils/fileUri";

const MEDIA_EXT = /\.(mp4|mov|m4v|3gp|jpe?g|png|webp|heic|gif)$/i;
// react-native-video-trim writes its trim output into the documents root, not the cache.
const TRIM_PREFIX = "trimmedVideo_";
// A saved file and its database row land a moment apart; leave anything this fresh alone.
const ORPHAN_MIN_AGE_MS = 10 * 60 * 1000;

function fsPath(uri: string): string {
  return decodeURIComponent(toFsPath(uri)).replace(/\/+$/, "");
}

function removeFile(file: File) {
  try {
    if (file.exists) file.delete();
  } catch (error) {
    console.warn("[storage] couldn't delete", file.uri, error);
  }
}

// Only scratch files qualify: anything in the app cache, or a trim output in the documents root.
function isScratch(uri: string): boolean {
  const path = fsPath(uri);
  if (path.startsWith(`${fsPath(Paths.cache.uri)}/`)) return true;
  const name = path.split("/").pop() ?? "";
  return name.startsWith(TRIM_PREFIX) && path === `${fsPath(Paths.document.uri)}/${name}`;
}

// Deletes temporary capture/edit files; refuses anything outside the scratch areas, so a saved memory can't be hit by mistake.
export function deleteScratch(...uris: (string | null | undefined)[]) {
  for (const uri of uris) {
    if (uri && isScratch(uri)) removeFile(new File(toFileUri(uri)));
  }
}

// For files the app owns outright (saved media, montages) once their database row is gone.
export function deleteOwnedFile(uri: string | null | undefined) {
  if (uri) removeFile(new File(toFileUri(uri)));
}

function walk(dir: Directory, visit: (file: File) => void) {
  for (const item of dir.list()) {
    if (item instanceof Directory) walk(item, visit);
    else visit(item);
  }
}

// Clears leftovers from earlier sessions: abandoned captures, edit intermediates, and files whose memory or montage was deleted.
export async function sweepStorage(): Promise<void> {
  try {
    walk(Paths.cache, (file) => {
      if (MEDIA_EXT.test(file.name)) removeFile(file);
    });
    for (const item of Paths.document.list()) {
      if (item instanceof File && item.name.startsWith(TRIM_PREFIX)) removeFile(item);
    }
  } catch (error) {
    console.warn("[storage] scratch sweep failed:", error);
  }

  // Queried directly (not via runQuery) so a failed read aborts the sweep instead of returning [] and orphaning every file.
  try {
    const [mediaRows, montageRows] = await Promise.all([
      db.select({ uri: media.uri, rawUri: media.rawUri }).from(media),
      db.select({ uri: montages.outputUri }).from(montages),
    ]);
    const keep = new Set<string>();
    for (const row of mediaRows) {
      keep.add(fsPath(row.uri));
      if (row.rawUri) keep.add(fsPath(row.rawUri));
    }
    for (const row of montageRows) keep.add(fsPath(row.uri));

    const cutoff = Date.now() - ORPHAN_MIN_AGE_MS;
    for (const name of ["media", "montages"]) {
      const dir = new Directory(Paths.document, name);
      if (!dir.exists) continue;
      for (const item of dir.list()) {
        if (!(item instanceof File) || keep.has(fsPath(item.uri))) continue;
        if ((item.lastModified ?? Date.now()) < cutoff) removeFile(item);
      }
    }
  } catch (error) {
    console.warn("[storage] orphan sweep skipped:", error);
  }
}
