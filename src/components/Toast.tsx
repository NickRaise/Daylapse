import { useEffect } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import FontAwesomeFreeSolid, {
  type FontAwesomeFreeSolidIconName,
} from "@react-native-vector-icons/fontawesome-free-solid";
import { fontSize, makeStyles, radius, spacing, useColors } from "@/theme";
import useToastStore from "@/store/toast.store";

const VISIBLE_MS = 2800;

const VARIANT_ICON: Record<string, FontAwesomeFreeSolidIconName> = {
  default: "circle-info",
  success: "check",
  error: "triangle-exclamation",
};

// Mounted once at the app root so any screen or service can call showToast() without needing its
// own local UI — replaces every native Alert.alert in the app with something that matches the theme.
export function ToastHost() {
  const s = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const toast = useToastStore((state) => state.toast);
  const hide = useToastStore((state) => state.hide);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hide, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, hide]);

  if (!toast) return null;

  const iconColor =
    toast.variant === "success" ? colors.success : toast.variant === "error" ? colors.error : colors.primary;

  return (
    <Animated.View
      key={toast.id}
      pointerEvents="none"
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(150)}
      style={[s.wrap, { bottom: insets.bottom + spacing[6] }]}
    >
      <View style={s.pill}>
        <FontAwesomeFreeSolid name={VARIANT_ICON[toast.variant]} size={14} color={iconColor} />
        <Text style={s.text} numberOfLines={2}>
          {toast.message}
        </Text>
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: spacing[6],
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    maxWidth: "100%",
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: 12,
    paddingHorizontal: spacing[4],
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  text: {
    flexShrink: 1,
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textPrimary,
  },
}));
