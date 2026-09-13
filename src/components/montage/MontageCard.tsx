import { memo, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { colors, fontSize, radius, spacing } from "@/theme";
import type { Montage } from "@/db/schema";
import { formatDuration } from "@/utils/time";
import { MediaThumbnail, getVideoPoster } from "@/components/media/MediaThumbnail";

type Props = {
  montage: Montage;
  width: number;
  onPress: (montage: Montage) => void;
  onLongPress?: (montage: Montage) => void;
};

function formatDateRange(start: string, end: string): string {
  if (start === end) return start.slice(5);
  return `${start.slice(5)} – ${end.slice(5)}`;
}

export const MontageCard = memo(function MontageCard({ montage, width, onPress, onLongPress }: Props) {
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

  const height = Math.round((width * 4) / 3);
  // Belt-and-suspenders numeric sizing — width/height/minWidth/minHeight/flexBasis all pinned to the
  // same explicit values, so nothing (flex shrink, content-based auto-sizing, a missing flex-basis) can collapse it.
  const outerSize: ViewStyle = { width, height, minWidth: width, minHeight: height, flexBasis: width };

  return (
    <View style={[s.outer, outerSize]}>
      <Pressable
        style={({ pressed }) => [StyleSheet.absoluteFill, s.clip, pressed && s.cardPressed]}
        onPress={() => onPress(montage)}
        onLongPress={onLongPress ? () => onLongPress(montage) : undefined}
      >
        <MediaThumbnail uri={montage.outputUri} type="video" />
        {posterReady && (
          <View style={s.playBadge}>
            <FontAwesomeFreeSolid name="circle-play" size={30} color="#fff" />
          </View>
        )}

        {montage.duration != null && (
          <View style={s.durationBadge}>
            <Text style={s.durationText}>{formatDuration(montage.duration)}</Text>
          </View>
        )}

        <View style={s.infoBar}>
          <Text style={s.titleText} numberOfLines={1}>
            {montage.title ?? formatDateRange(montage.dateRangeStart, montage.dateRangeEnd)}
          </Text>
          {montage.title && (
            <Text style={s.subtitleText} numberOfLines={1}>
              {formatDateRange(montage.dateRangeStart, montage.dateRangeEnd)}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
});

const s = StyleSheet.create({
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
  cardPressed: { opacity: 0.85 },
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
  titleText: { fontSize: fontSize.xs, fontWeight: "700", color: "#fff" },
  subtitleText: { fontSize: 10, fontWeight: "500", color: "rgba(255,255,255,0.8)" },
});
