import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { colors, spacing } from "@/theme";
import useSettingsStore, { VideoQuality } from "@/store/settings.store";

const QUALITY_OPTIONS: { label: string; value: VideoQuality }[] = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
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
  const saveToGallery = useSettingsStore((s) => s.saveToGallery);
  const setSaveToGallery = useSettingsStore((s) => s.setSaveToGallery);
  const videoQuality = useSettingsStore((s) => s.videoQuality);
  const setVideoQuality = useSettingsStore((s) => s.setVideoQuality);
  const useNativeCamera = useSettingsStore((s) => s.useNativeCamera);
  const setUseNativeCamera = useSettingsStore((s) => s.setUseNativeCamera);
  const recordingTimeLimit = useSettingsStore((s) => s.recordingTimeLimit);
  const setRecordingTimeLimit = useSettingsStore((s) => s.setRecordingTimeLimit);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.heading}>Settings</Text>

      <Text style={s.sectionLabel}>Camera</Text>
      <View style={s.section}>
        <View style={s.settingBlock}>
          <Text style={s.rowTitle}>Video quality</Text>
          <Text style={s.rowDesc}>Affects file size of captured photos and videos.</Text>
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
            <Text style={s.rowTitle}>Use native camera</Text>
            <Text style={s.rowDesc}>
              Opens your phone's built-in camera app instead of the in-app one.
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
          <Text style={s.rowTitle}>Recording time limit</Text>
          <Text style={s.rowDesc}>Automatically stops video recording after the chosen duration.</Text>
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

      <Text style={s.sectionLabel}>Storage</Text>
      <View style={s.section}>
        <View style={s.row}>
          <View style={s.rowText}>
            <Text style={s.rowTitle}>Save to gallery</Text>
            <Text style={s.rowDesc}>
              Photos and videos will also be saved to your device gallery.
            </Text>
          </View>
          <Switch
            value={saveToGallery}
            onValueChange={setSaveToGallery}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.bgSurface}
          />
        </View>
        <Text style={s.note}>Turning this on will use more storage space on your device.</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
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
  note: {
    marginTop: 10,
    fontSize: 12,
    fontStyle: "italic",
    color: colors.textMuted,
    lineHeight: 17,
  },
});
