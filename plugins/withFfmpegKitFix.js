const { withProjectBuildGradle } = require("@expo/config-plugins");

// react-native-video-trim and @mtd1410/react-native-ffmpegkit each bundle their own
// io.github.maitrungduc1410:ffmpeg-kit-<package> native dependency. Left at their
// independent defaults they'd pull two DIFFERENT modules (video-trim defaults to
// "min", the ffmpegkit wrapper to "https") that both define the same
// com.arthenica.ffmpegkit.* Java classes — a Gradle duplicate-class failure.
// Pinning both to the identical package + version makes Gradle resolve one shared
// dependency instead.
const FFMPEG_PACKAGE = "https";
const FFMPEG_VERSION = "8.1.2";

const EXT_BLOCK = `
ext {
  VideoTrim_ffmpeg_package = '${FFMPEG_PACKAGE}'
  VideoTrim_ffmpeg_version = '${FFMPEG_VERSION}'
  ffmpegKitPackage = '${FFMPEG_PACKAGE}'
  ffmpegKitVersion = '${FFMPEG_VERSION}'
}

allprojects {`;

module.exports = function withFfmpegKitFix(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") return config;
    if (config.modResults.contents.includes("VideoTrim_ffmpeg_package")) return config;
    config.modResults.contents = config.modResults.contents.replace(
      "allprojects {",
      EXT_BLOCK,
    );
    return config;
  });
};
