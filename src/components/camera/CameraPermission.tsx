import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing, fontSize } from "../../theme";

type Props = {
  onRequest: () => void;
};

export function CameraPermission({ onRequest }: Props) {
  return (
    <View style={s.root}>
      <View style={s.content}>
        <View style={s.iconRing}>
          <Text style={s.iconText}>◎</Text>
        </View>

        <Text style={s.title}>Allow access to continue</Text>
        <Text style={s.subtitle}>
          Daylapse needs access to your camera, microphone, and photo library to
          capture and save your moments.
        </Text>
      </View>

      <View style={s.footer}>
        <TouchableOpacity style={s.btn} onPress={onRequest} activeOpacity={0.8}>
          <Text style={s.btnText}>Grant permissions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "space-between",
    paddingTop: spacing[16],
    paddingBottom: spacing[10],
    paddingHorizontal: spacing[6],
  },
  content: {
    alignItems: "center",
    gap: spacing[4],
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  iconText: {
    fontSize: fontSize["3xl"],
    color: colors.primary,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.base,
    fontWeight: "400",
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    gap: spacing[3],
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    alignItems: "center",
  },
  btnText: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.textOnAccent,
  },
});
