const { withAppBuildGradle, withGradleProperties } = require("@expo/config-plugins");

// x86/x86_64 only run on emulators and a few Chromebooks, yet cost ~50 MB; real phones are all ARM.
const ARCHS = ["armeabi-v7a", "arm64-v8a"];
const X86_EXCLUDES = "lib/x86/**,lib/x86_64/**";

// Per-ABI APKs plus a universal ARM one, so most people download only the arm64 build.
const SPLITS_BLOCK = `    splits {
        abi {
            enable true
            reset()
            include ${ARCHS.map((a) => `"${a}"`).join(", ")}
            universalApk true
        }
    }
`;

function setProperty(props, key, value) {
  const existing = props.find((p) => p.type === "property" && p.key === key);
  if (existing) existing.value = value;
  else props.push({ type: "property", key, value });
}

module.exports = function withAbiSplits(config) {
  config = withGradleProperties(config, (config) => {
    setProperty(config.modResults, "reactNativeArchitectures", ARCHS.join(","));
    // Prebuilt native libraries from dependencies (e.g. FFmpeg) ship x86 too; this strips them from every APK.
    setProperty(config.modResults, "android.packagingOptions.excludes", X86_EXCLUDES);
    return config;
  });

  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") return config;
    if (config.modResults.contents.includes("universalApk")) return config;
    config.modResults.contents = config.modResults.contents.replace(
      /(\n    androidResources \{)/,
      `\n${SPLITS_BLOCK}$1`,
    );
    return config;
  });
};
