import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
  useAnimatedProps,
  type SharedValue,
} from "react-native-reanimated";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { fontSize, makeStyles, spacing, useColors } from "@/theme";
import { fmt } from "@/utils/time";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// Worklet copy of fmt() so the clock can format on the UI thread.
function fmtClock(s: number) {
  "worklet";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toFixed(1).padStart(4, "0")}`;
}

const HOLD_DELAY = 350; // ms held before continuous stepping kicks in
const HOLD_INTERVAL = 70; // ms between steps while held

// A tap fires one small nudge; holding past HOLD_DELAY repeats it smoothly
// until release, so the user can dial in a precise trim start/end.
function useHoldToRepeat(callback: () => void) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stop() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }

  function start() {
    callback();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(callback, HOLD_INTERVAL);
    }, HOLD_DELAY);
  }

  useEffect(() => stop, []);

  return { start, stop };
}

type Props = {
  isPlaying: boolean;
  playheadSV: SharedValue<number>;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
};

export function TrimControls({
  isPlaying,
  playheadSV,
  duration,
  onPlay,
  onPause,
  onStepBack,
  onStepForward,
}: Props) {
  const s = useStyles();
  const colors = useColors();
  const stepBack = useHoldToRepeat(onStepBack);
  const stepForward = useHoldToRepeat(onStepForward);

  // Clock updates on the UI thread from the shared value — scrubbing and
  // playback drive it with zero React re-renders of the editor tree.
  const clockProps = useAnimatedProps(
    () => ({ text: fmtClock(playheadSV.value) }) as any,
  );

  return (
    <View style={s.controls}>
      <View style={s.controlsSide} />

      <View style={s.btnGroup}>
        <Pressable
          style={s.stepBtn}
          hitSlop={12}
          onPressIn={stepBack.start}
          onPressOut={stepBack.stop}
        >
          <FontAwesomeFreeSolid name="backward-step" size={13} color={colors.textSecondary} />
        </Pressable>

        <Pressable style={s.playBtn} hitSlop={8} onPress={isPlaying ? onPause : onPlay}>
          <FontAwesomeFreeSolid
            name={isPlaying ? "pause" : "play"}
            size={15}
            color={colors.textOnAccent}
          />
        </Pressable>

        <Pressable
          style={s.stepBtn}
          hitSlop={12}
          onPressIn={stepForward.start}
          onPressOut={stepForward.stop}
        >
          <FontAwesomeFreeSolid name="forward-step" size={13} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={s.controlsSide}>
        <View style={s.timeRow}>
          <AnimatedTextInput
            style={[s.timeDisplay, s.timeInput]}
            editable={false}
            underlineColorAndroid="transparent"
            scrollEnabled={false}
            defaultValue={fmt(0)}
            animatedProps={clockProps}
          />
          <Text style={[s.timeDisplay, s.timeSep]}> / {fmt(duration)}</Text>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  controls: { flexDirection: "row", alignItems: "center" },
  controlsSide: { flex: 1, justifyContent: "center", alignItems: "flex-end" },
  btnGroup: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  timeRow: { flexDirection: "row", alignItems: "center" },
  timeDisplay: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  timeInput: {
    padding: 0,
    margin: 0,
    minWidth: 46,
    textAlign: "right",
    includeFontPadding: false,
  },
  timeSep: { color: colors.textMuted },
}));
