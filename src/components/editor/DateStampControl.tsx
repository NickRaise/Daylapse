import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/theme";
import type { DateStampFormat, DateStampPosition } from "@/types";

type Props = {
  enabled: boolean;
  position: DateStampPosition;
  format: DateStampFormat;
  onToggle: (v: boolean) => void;
  onPositionChange: (pos: DateStampPosition) => void;
  onFormatChange: (fmt: DateStampFormat) => void;
};

const POSITIONS: { label: string; value: DateStampPosition; icon: string }[] = [
  { label: "Top Left", value: "top-left", icon: "↖" },
  { label: "Top Right", value: "top-right", icon: "↗" },
  { label: "Bottom Left", value: "bottom-left", icon: "↙" },
  { label: "Bottom Right", value: "bottom-right", icon: "↘" },
];

const FORMATS: { label: string; value: DateStampFormat }[] = [
  { label: "16 Jul", value: "DD MMM" },
  { label: "16 Jul 2026", value: "DD MMM YYYY" },
  { label: "Jul 16, 2026", value: "MMM DD, YYYY" },
];

export function DateStampControl({
  enabled,
  position,
  format,
  onToggle,
  onPositionChange,
  onFormatChange,
}: Props) {
  return (
    <View style={s.root}>
      {/* Toggle row */}
      <View style={s.toggleRow}>
        <View style={s.toggleText}>
          <Text style={s.label}>Stamp date on media</Text>
          <Text style={s.desc}>Shows on the frame when saved.</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.bgSurface}
        />
      </View>

      {enabled && (
        <>
          <View style={s.divider} />

          {/* Corner position picker */}
          <Text style={s.subLabel}>Position</Text>
          <View style={s.cornerGrid}>
            {POSITIONS.map(({ label, value, icon }) => (
              <Pressable
                key={value}
                style={[s.cornerBtn, position === value && s.cornerBtnActive]}
                onPress={() => onPositionChange(value)}
              >
                <Text style={[s.cornerIcon, position === value && s.cornerIconActive]}>
                  {icon}
                </Text>
                <Text style={[s.cornerLabel, position === value && s.cornerLabelActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={s.divider} />

          {/* Format picker */}
          <Text style={s.subLabel}>Format</Text>
          <View style={s.pills}>
            {FORMATS.map(({ label, value }) => (
              <Pressable
                key={value}
                style={[s.pill, format === value && s.pillActive]}
                onPress={() => onFormatChange(value)}
              >
                <Text style={[s.pillText, format === value && s.pillTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing[3],
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleText: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  desc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  subLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  cornerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  cornerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  cornerBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cornerIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  cornerIconActive: {
    color: colors.textOnAccent,
  },
  cornerLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  cornerLabelActive: {
    color: colors.textOnAccent,
    fontWeight: "600",
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  pill: {
    paddingHorizontal: 12,
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
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.textOnAccent,
    fontWeight: "600",
  },
});
