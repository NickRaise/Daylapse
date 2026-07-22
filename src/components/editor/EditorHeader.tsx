import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { colors, fontSize, radius, spacing } from "@/theme";

type Fit = "landscape" | "portrait";

type Props = {
  fit: Fit;
  onBack: () => void;
  onToggleFit: () => void;
};

export function EditorHeader({ fit, onBack, onToggleFit }: Props) {
  return (
    <View style={s.header}>
      <Pressable style={s.iconBtn} onPress={onBack} hitSlop={12}>
        <FontAwesomeFreeSolid
          name="arrow-left"
          size={16}
          color={colors.textSecondary}
        />
      </Pressable>

      <Text style={s.title}>Edit</Text>

      <Pressable style={s.orientBtn} onPress={onToggleFit} hitSlop={8}>
        <FontAwesomeFreeSolid
          name={fit === "portrait" ? "mobile-screen" : "mobile-screen-button"}
          size={15}
          color={colors.textSecondary}
        />
        <Text style={s.orientLabel}>
          {fit === "portrait" ? "Portrait" : "Landscape"}
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  orientBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSubtle,
  },
  orientLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.textSecondary,
  },
});
