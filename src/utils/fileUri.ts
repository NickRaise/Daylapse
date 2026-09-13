// Native tools (react-native-video-trim, ffmpeg-kit) return/expect plain filesystem paths, not file:// URIs like expo-file-system.
export function toFileUri(path: string): string {
  return /^[a-z]+:\/\//i.test(path) ? path : `file://${path}`;
}

export function toFsPath(uri: string): string {
  return uri.replace(/^file:\/\//i, "");
}
