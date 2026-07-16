import { StyleSheet, Switch, Text, View } from "react-native";
import { colors, spacing } from "@/theme";
import useSettingsStore from "@/store/settings.store";

export default function Settings() {
  const saveToGallery = useSettingsStore((s) => s.saveToGallery);
  const setSaveToGallery = useSettingsStore((s) => s.setSaveToGallery);

  return (
    <View style={s.root}>
      <Text style={s.heading}>Settings</Text>

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
        <Text style={s.note}>
          Turning this on will use more storage space on your device.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing[6],
  },
  section: {
    backgroundColor: colors.bgSubtle,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  note: {
    marginTop: 10,
    fontSize: 12,
    fontStyle: "italic",
    color: colors.textMuted,
    lineHeight: 17,
  },
});
