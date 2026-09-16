const { withAndroidManifest } = require("@expo/config-plugins");

// Android's Auto Backup silently backs up all app-private storage (the SQLite db, montages, everything)
// to the user's Google account and restores it on reinstall — clearing storage or uninstalling never
// touches that cloud copy, so "wiped" data quietly comes right back. Opting out entirely.
module.exports = function withDisableBackup(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];
    application.$["android:allowBackup"] = "false";
    return config;
  });
};
