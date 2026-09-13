import { memo, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { useVideoPlayer } from "expo-video";
import { colors } from "@/theme";
import type { Media } from "@/db/schema";
import { formatDuration } from "@/utils/time";
import { ActionsBar } from "./ActionsBar";

type Props = {
  item: Media;
  optionsOpen: boolean;
  onPress: (item: Media) => void;
  onToggleOptions: (id: number) => void;
  onReorder: () => void;
  onDelete: (id: number) => void;
};

export const VideoCard = memo(function VideoCard({
  item,
  optionsOpen,
  onPress,
  onToggleOptions,
  onReorder,
  onDelete,
}: Props) {
  const [duration, setDuration] = useState<number | null>(item.duration ?? null);

  // Only spins up a real (off-screen) decoder when the duration isn't already known.
  const player = useVideoPlayer(duration == null ? item.uri : null, (p) => {
    p.muted = true;
  });

  useEffect(() => {
    if (duration != null) return;
    const sub = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay" && player.duration > 0) {
        setDuration(Math.round(player.duration));
      }
    });
    return () => sub.remove();
  }, [player, duration]);

  return (
    <Pressable style={[s.card, s.videoCard]} onPress={() => onPress(item)}>
      <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {duration != null && !optionsOpen && (
        <View style={s.durationBadge}>
          <Text style={s.durationText}>{formatDuration(duration)}</Text>
        </View>
      )}
      <Pressable style={s.optionsBtn} hitSlop={12} onPress={() => onToggleOptions(item.id)}>
        <FontAwesomeFreeSolid name="sliders" size={22} color={colors.textOnAccent} />
      </Pressable>
      {optionsOpen && <ActionsBar onOpenReorder={onReorder} onDelete={() => onDelete(item.id)} />}
    </Pressable>
  );
});

const s = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  videoCard: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    justifyContent: "center",
    alignItems: "center",
  },
  durationBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: colors.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.bg,
    letterSpacing: 0.3,
  },
  optionsBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 6,
  },
});
