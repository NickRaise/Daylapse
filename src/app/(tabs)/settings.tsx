import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { DEFAULT_THEME, makeStyles, spacing, THEME_ORDER, useColors, type ThemeName } from "@/theme";
import { themes } from "@/themes";
import useSettingsStore, { VideoQuality } from "@/store/settings.store";
import type { AspectRatio } from "@/types";

const QUALITY_OPTIONS: { label: string; value: VideoQuality }[] = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const ASPECT_RATIO_OPTIONS: { label: string; value: AspectRatio; desc: string }[] = [
  { label: "4:3", value: "4:3", desc: "Standard wide" },
  { label: "1:1", value: "1:1", desc: "Square" },
  { label: "9:16", value: "9:16", desc: "Tall portrait" },
];

const TIME_LIMIT_OPTIONS: { label: string; value: number | null }[] = [
  { label: "None", value: null },
  { label: "5s", value: 5 },
  { label: "10s", value: 10 },
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
];

export default function Settings() {
  const s = useStyles();
  const colors = useColors();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const [pendingTheme, setPendingTheme] = useState<ThemeName | null>(null);

  // Repainting every screen blocks the JS thread, so the spinner has to reach the screen first.
  function pickTheme(key: ThemeName) {
    if (pendingTheme || key === theme) return;
    setPendingTheme(key);
    requestAnimationFrame(() => {
      setTimeout(() => {
        setTheme(key);
        setPendingTheme(null);
      }, 0);
    });
  }
  const saveToGallery = useSettingsStore((s) => s.saveToGallery);
  const setSaveToGallery = useSettingsStore((s) => s.setSaveToGallery);
  const videoQuality = useSettingsStore((s) => s.videoQuality);
  const setVideoQuality = useSettingsStore((s) => s.setVideoQuality);
  const useNativeCamera = useSettingsStore((s) => s.useNativeCamera);
  const setUseNativeCamera = useSettingsStore((s) => s.setUseNativeCamera);
  const recordingTimeLimit = useSettingsStore((s) => s.recordingTimeLimit);
  const setRecordingTimeLimit = useSettingsStore((s) => s.setRecordingTimeLimit);
  const defaultAspectRatio = useSettingsStore((s) => s.defaultAspectRatio);
  const setDefaultAspectRatio = useSettingsStore((s) => s.setDefaultAspectRatio);
  const keepOriginalMedia = useSettingsStore((s) => s.keepOriginalMedia);
  const setKeepOriginalMedia = useSettingsStore((s) => s.setKeepOriginalMedia);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.heading}>Settings</Text>

      <Text style={s.sectionLabel}>The mood</Text>
      <View style={s.section}>
        <View style={s.settingBlock}>
          <View style={s.titleRow}>
            <Text style={s.rowTitle}>Colours of your days</Text>
            <View style={s.badge}>
              <Text style={s.badgeText}>Experimental</Text>
            </View>
          </View>
          <Text style={s.rowDesc}>Pick the palette Daylapse wears while you keep your days.</Text>

          <View style={s.themeRow}>
            {THEME_ORDER.map((key: ThemeName) => {
              const preview = themes[key];
              const active = theme === key;
              const waiting = pendingTheme === key;
              return (
                <Pressable
                  key={key}
                  style={[
                    s.themeCard,
                    active && s.themeCardActive,
                    pendingTheme !== null && !waiting && s.themeCardDimmed,
                  ]}
                  onPress={() => pickTheme(key)}
                  disabled={pendingTheme !== null}
                >
                  <View style={[s.swatch, { backgroundColor: preview.colors.bg }]}>
                    {waiting ? (
                      <ActivityIndicator size="small" color={preview.colors.primary} />
                    ) : (
                      <>
                        <View style={[s.swatchInk, { backgroundColor: preview.colors.primary }]} />
                        <View style={[s.swatchInkSmall, { backgroundColor: preview.colors.textPrimary }]} />
                      </>
                    )}
                  </View>
                  <Text style={[s.themeName, active && s.themeNameActive]} numberOfLines={1}>
                    {preview.name}
                  </Text>
                  {key === DEFAULT_THEME && <Text style={s.themeTag}>Default</Text>}
                </Pressable>
              );
            })}
          </View>

          <Text style={s.note}>
            {pendingTheme
              ? "Repainting every corner…"
              : "The whole app changes as you tap. This one is still finding its feet, so tell us if a corner somewhere still wears the old colours."}
          </Text>
        </View>
      </View>

      <Text style={s.sectionLabel}>Capturing</Text>
      <View style={s.section}>
        <View style={s.settingBlock}>
          <Text style={s.rowTitle}>How richly to capture</Text>
          <Text style={s.rowDesc}>Richer moments hold more detail, and take more room on your phone.</Text>
          <View style={s.pills}>
            {QUALITY_OPTIONS.map(({ label, value }) => (
              <Pressable
                key={value}
                style={[s.pill, videoQuality === value && s.pillActive]}
                onPress={() => setVideoQuality(value)}
              >
                <Text style={[s.pillText, videoQuality === value && s.pillTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.row}>
          <View style={s.rowText}>
            <Text style={s.rowTitle}>Use your phone's camera</Text>
            <Text style={s.rowDesc}>
              Opens the camera app you already know, instead of the one in here.
            </Text>
          </View>
          <Switch
            value={useNativeCamera}
            onValueChange={setUseNativeCamera}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.bgSurface}
          />
        </View>

        <View style={s.divider} />

        <View style={s.settingBlock}>
          <Text style={s.rowTitle}>Stop recording after</Text>
          <Text style={s.rowDesc}>Long enough to catch the moment, then it stops on its own.</Text>
          <View style={s.pills}>
            {TIME_LIMIT_OPTIONS.map(({ label, value }) => (
              <Pressable
                key={label}
                style={[s.pill, recordingTimeLimit === value && s.pillActive]}
                onPress={() => setRecordingTimeLimit(value)}
              >
                <Text style={[s.pillText, recordingTimeLimit === value && s.pillTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Text style={s.sectionLabel}>Composing</Text>
      <View style={s.section}>
        <View style={s.settingBlock}>
          <Text style={s.rowTitle}>Shape of the frame</Text>
          <Text style={s.rowDesc}>
            How the editor opens. You can still turn any single moment between tall and wide.
          </Text>
          <View style={s.pills}>
            {ASPECT_RATIO_OPTIONS.map(({ label, value, desc }) => (
              <Pressable
                key={value}
                style={[s.pill, defaultAspectRatio === value && s.pillActive]}
                onPress={() => setDefaultAspectRatio(value)}
              >
                <Text style={[s.pillText, defaultAspectRatio === value && s.pillTextActive]}>
                  {label}
                </Text>
                <Text style={[s.pillDesc, defaultAspectRatio === value && s.pillDescActive]}>
                  {desc}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Text style={s.sectionLabel}>Keeping</Text>
      <View style={s.section}>
        <View style={s.row}>
          <View style={s.rowText}>
            <Text style={s.rowTitle}>Also keep in your gallery</Text>
            <Text style={s.rowDesc}>
              Every moment you save is tucked into your phone's gallery too.
            </Text>
          </View>
          <Switch
            value={saveToGallery}
            onValueChange={setSaveToGallery}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.bgSurface}
          />
        </View>

        <View style={s.divider} />

        <View style={s.row}>
          <View style={s.rowText}>
            <Text style={s.rowTitle}>Keep the untouched version</Text>
            <Text style={s.rowDesc}>
              Your words and the date are woven into whatever you save. Keep the original alongside it
              and you can always come back and tell it differently.
            </Text>
          </View>
          <Switch
            value={keepOriginalMedia}
            onValueChange={setKeepOriginalMedia}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.bgSurface}
          />
        </View>
        <Text style={s.note}>
          {keepOriginalMedia
            ? "The untouched moment is kept too — you can always rework it."
            : "Only the moment as you made it is kept — lighter on space."}
        </Text>
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing[6],
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    backgroundColor: colors.bgSubtle,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: spacing[5],
  },
  settingBlock: {
    gap: 8,
    paddingVertical: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  themeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  themeCard: {
    width: 62,
    alignItems: "center",
    gap: 5,
    padding: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  themeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.bg,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  swatchInk: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  swatchInkSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeCardDimmed: { opacity: 0.4 },
  themeTag: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginTop: -2,
  },
  themeName: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  themeNameActive: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 2,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  rowDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: "center",
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.textOnAccent,
    fontWeight: "600",
  },
  pillDesc: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  pillDescActive: {
    color: colors.textOnAccentDim,
  },
  note: {
    marginTop: 10,
    fontSize: 12,
    fontStyle: "italic",
    color: colors.textMuted,
    lineHeight: 17,
  },
}));
