import { memo, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as VideoThumbnails from "expo-video-thumbnails";
import { colors, fontSize, radius } from "@/theme";
import type { Montage } from "@/db/schema";
import { formatDuration } from "@/utils/time";

type Props = {
  montage: Montage;
  onPress: (montage: Montage) => void;
};

export const MontageCard = memo(function MontageCard({ montage, onPress }: Props) {
  const [posterUri, setPosterUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    VideoThumbnails.getThumbnailAsync(montage.outputUri, { time: 0 })
      .then(({ uri }) => {
        if (!cancelled) setPosterUri(uri);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [montage.outputUri]);

  return (
    <Pressable style={s.card} onPress={() => onPress(montage)}>
      {posterUri && (
        <Image source={{ uri: posterUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}
      {montage.duration != null && (
        <View style={s.durationBadge}>
          <Text style={s.durationText}>{formatDuration(montage.duration)}</Text>
        </View>
      )}
      <View style={s.infoBar}>
        <Text style={s.titleText} numberOfLines={1}>
          {montage.title ?? `${montage.dateRangeStart} – ${montage.dateRangeEnd}`}
        </Text>
      </View>
    </Pressable>
  );
});

const s = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationBadge: {
    position: "absolute",
    bottom: 32,
    left: 8,
    backgroundColor: colors.textPrimary,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: { fontSize: 10, fontWeight: "600", color: colors.bg },
  infoBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  titleText: { fontSize: fontSize.xs, fontWeight: "600", color: "#fff" },
});
