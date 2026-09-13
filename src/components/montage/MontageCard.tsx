import { memo, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { makeStyles, radius, spacing, useColors } from "@/theme";
import type { Montage } from "@/db/schema";
import { formatDuration } from "@/utils/time";
import { MediaThumbnail, getVideoPoster } from "@/components/media/MediaThumbnail";
import { montageLabel } from "@/components/montage/montageLabel";

type Props = {
  montage: Montage;
  width: number;
  selectionMode?: boolean;
  selected?: boolean;
  onPress: (montage: Montage) => void;
  onLongPress?: (montage: Montage) => void;
};

export const MontageCard = memo(function MontageCard({
  montage,
  width,
  selectionMode = false,
  selected = false,
  onPress,
  onLongPress,
}: Props) {
  const s = useStyles();
  const colors = useColors();
  const [posterReady, setPosterReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getVideoPoster(montage.outputUri).then((p) => {
      if (!cancelled) setPosterReady(!!p);
    });
    return () => {
      cancelled = true;
    };
  }, [montage.outputUri]);

  const label = montageLabel(montage.dateRangeStart, montage.dateRangeEnd);
  const height = Math.round((width * 4) / 3);

  // Selected tiles pull back slightly, the way a picked-up card recedes, so the choice reads without a colour change alone.
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(selected ? 0.92 : 1, { mass: 0.5, damping: 18, stiffness: 420 }) },
    ],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(selected ? 1 : 0.85, { mass: 0.4, damping: 15, stiffness: 500 }) },
    ],
    backgroundColor: withTiming(selected ? colors.primary : "rgba(0,0,0,0.35)", { duration: 90 }),
    borderColor: withTiming(selected ? colors.primary : "#ffffff", { duration: 90 }),
  }));
  // Belt-and-suspenders numeric sizing — width/height/minWidth/minHeight/flexBasis all pinned to the
  // same explicit values, so nothing (flex shrink, content-based auto-sizing, a missing flex-basis) can collapse it.
  const outerSize: ViewStyle = { width, height, minWidth: width, minHeight: height, flexBasis: width };

  return (
    <Animated.View style={[s.outer, outerSize, cardStyle]}>
      <Pressable
        style={({ pressed }) => [
          StyleSheet.absoluteFill,
          s.clip,
          selected && s.clipSelected,
          pressed && s.cardPressed,
        ]}
        onPress={() => onPress(montage)}
        onLongPress={onLongPress ? () => onLongPress(montage) : undefined}
        // The default 500ms hold makes entering selection mode feel unresponsive.
        delayLongPress={200}
      >
        <MediaThumbnail uri={montage.outputUri} type="video" />
        {posterReady && !selectionMode && (
          <Animated.View style={s.playBadge} entering={FadeIn.duration(100)} exiting={FadeOut.duration(70)}>
            <FontAwesomeFreeSolid name="circle-play" size={30} color="#fff" />
          </Animated.View>
        )}

        {selectionMode && (
          <Animated.View
            style={[s.selectBadge, badgeStyle]}
            entering={FadeIn.duration(100)}
            exiting={FadeOut.duration(70)}
          >
            {selected && (
              <Animated.View entering={FadeIn.duration(70)}>
                <FontAwesomeFreeSolid name="check" size={10} color={colors.textOnAccent} />
              </Animated.View>
            )}
          </Animated.View>
        )}

        {montage.duration != null && (
          <View style={s.durationBadge}>
            <Text style={s.durationText}>{formatDuration(montage.duration)}</Text>
          </View>
        )}

        <View style={s.infoBar}>
          <Text style={s.titleText} numberOfLines={1}>
            {label.primary}
          </Text>
          {label.secondary && (
            <Text style={s.subtitleText} numberOfLines={1}>
              {label.secondary}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

const useStyles = makeStyles((colors) => ({
  outer: {
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: "flex-start",
    borderRadius: radius.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clip: {
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clipSelected: { borderWidth: 2, borderColor: colors.primary },
  cardPressed: { opacity: 0.85 },
  selectBadge: {
    position: "absolute",
    top: spacing[2],
    left: spacing[2],
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  playBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -15,
    marginLeft: -15,
    opacity: 0.9,
  },
  durationBadge: {
    position: "absolute",
    top: spacing[2],
    right: spacing[2],
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: { fontSize: 10, fontWeight: "700", color: "#fff", fontVariant: ["tabular-nums"] },
  infoBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    gap: 1,
  },
  // Caveat ships in a single weight — setting fontWeight here would drop Android back to the system font.
  titleText: { fontFamily: "Caveat", fontSize: 19, lineHeight: 21, color: "#fff" },
  subtitleText: { fontFamily: "Caveat", fontSize: 15, lineHeight: 16, color: "rgba(255,255,255,0.85)" },
}));
