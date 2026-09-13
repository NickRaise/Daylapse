type FFmpegKitModule = typeof import("@mtd1410/react-native-ffmpegkit");

let loading: Promise<FFmpegKitModule> | null = null;

// FFmpegKit streams every log and progress line to JS over the native event emitter, which segfaults
// the app on the New Architecture. Nothing surfaces those lines, and turning the emission off still
// leaves the native per-session logs that getAllLogsAsString() reads for failure diagnostics.
export function loadFFmpegKit(): Promise<FFmpegKitModule> {
  if (!loading) {
    loading = (async () => {
      // Required lazily — a static import crashes at module-load time until the native module is linked via a dev-client rebuild.
      const mod = require("@mtd1410/react-native-ffmpegkit") as FFmpegKitModule;
      await mod.FFmpegKitConfig.disableLogs();
      await mod.FFmpegKitConfig.disableStatistics();
      return mod;
    })();
  }
  return loading;
}
