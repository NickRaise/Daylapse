import { useEffect } from "react";
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { fontSize, makeStyles, spacing, useColors, useTheme } from "../theme";

type Props = {
  message?: string;
};

const DOTS = [0, 1, 2, 3, 4];

// One dot per day, filling in turn — the app's whole idea in the time it takes to open.
function DayDot({ index, color }: { index: number; color: string }) {
  const glow = useSharedValue(0.25);

  useEffect(() => {
    glow.value = withDelay(
      index * 150,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 430 }),
          withTiming(0.25, { duration: 430 }),
        ),
        -1,
        false,
      ),
    );
  }, [index]);

  const style = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.8 + glow.value * 0.3 }],
  }));

  return <Animated.View style={[{ backgroundColor: color }, dot, style]} />;
}

const dot = { width: 7, height: 7, borderRadius: 4 } as const;

export function LoadingScreen({ message }: Props) {
  const s = useStyles();
  const colors = useColors();
  const { isDark } = useTheme();

  return (
    <View style={s.root}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Animated.View style={s.stack} entering={FadeIn.duration(420)}>
        <View style={[s.card, s.cardBack]} />
        <View style={[s.card, s.cardMid]} />
        <View style={[s.card, s.cardFront]} />
      </Animated.View>

      <Animated.View style={s.words} entering={FadeInDown.duration(460).delay(120)}>
        <Text style={s.title}>Daylapse</Text>
        <Text style={s.tagline}>Your days, one frame at a time.</Text>
      </Animated.View>

      <Animated.View style={s.dots} entering={FadeIn.duration(400).delay(320)}>
        {DOTS.map((i) => (
          <DayDot key={i} index={i} color={colors.primary} />
        ))}
      </Animated.View>

      {message && <Text style={s.message}>{message}</Text>}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  stack: {
    width: 96,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[6],
  },
  card: {
    position: "absolute",
    width: 58,
    height: 76,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Fanned like a handful of photos set down on a table.
  cardBack: {
    backgroundColor: colors.bgSubtle,
    transform: [{ rotate: "-12deg" }, { translateX: -12 }],
  },
  cardMid: {
    backgroundColor: colors.bgElevated,
    transform: [{ rotate: "6deg" }, { translateX: 10 }],
  },
  cardFront: {
    backgroundColor: colors.primary,
    transform: [{ rotate: "-2deg" }],
    borderColor: colors.primary,
  },
  words: {
    alignItems: "center",
    gap: 2,
  },
  title: {
    fontSize: 44,
    lineHeight: 50,
    color: colors.textPrimary,
    fontFamily: "Caveat",
  },
  tagline: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  dots: {
    flexDirection: "row",
    gap: 7,
    marginTop: spacing[6],
  },
  message: {
    marginTop: spacing[4],
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
}));
