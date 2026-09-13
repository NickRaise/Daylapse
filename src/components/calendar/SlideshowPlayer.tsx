import { useEffect, useRef, useState } from "react";
import { Image, Modal, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { useVideoPlayer, VideoView } from "expo-video";
import { colors, fontSize, radius, spacing } from "@/theme";
import type { SlideshowMedia } from "@/repositories/media.repository";

// Fallback for media saved before per-photo duration existed (its `duration` column is null).
const DEFAULT_PHOTO_SECONDS = 2;

type Props = {
  media: SlideshowMedia[] | null;
  onClose: () => void;
};

export function SlideshowPlayer({ media, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const photoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items = media ?? [];
  const current = items[index];

  // One long-lived player for the whole sequence — swapping its source (not mounting a new player per item) is what keeps transitions jitter-free.
  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (media) setIndex(0);
  }, [media]);

  function goNext() {
    setIndex((i) => (items.length > 0 ? (i + 1) % items.length : i));
  }

  // Advances when a video clip finishes on its own.
  useEffect(() => {
    const sub = player.addListener("playToEnd", goNext);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, items.length]);

  // Drives the current item: point the player at it (video) or start a hold timer (photo).
  useEffect(() => {
    if (!current) return;
    if (photoTimerRef.current) clearTimeout(photoTimerRef.current);

    if (current.type === "video") {
      player.replaceAsync(current.uri).then(() => player.play());
    } else {
      player.pause();
      const seconds = current.duration ?? DEFAULT_PHOTO_SECONDS;
      photoTimerRef.current = setTimeout(goNext, seconds * 1000);
    }

    // Preload the next photo so its transition-in has no visible load delay.
    const next = items[(index + 1) % items.length];
    if (next && next.type === "image") Image.prefetch(next.uri);

    return () => {
      if (photoTimerRef.current) clearTimeout(photoTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, player]);

  return (
    <Modal
      visible={media !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={s.root}>
        {current?.type === "video" ? (
          <VideoView
            style={{ width, height }}
            player={player}
            nativeControls={false}
            contentFit="contain"
          />
        ) : current ? (
          <Image source={{ uri: current.uri }} style={{ width, height }} resizeMode="contain" />
        ) : null}

        <Pressable style={s.closeBtn} onPress={onClose}>
          <FontAwesomeFreeSolid name="xmark" size={18} color={colors.textOnAccent} />
        </Pressable>

        {current && (
          <Text style={s.dateLabel}>{current.entryDate}</Text>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  dateLabel: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textOnAccent,
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radius.md,
  },
});
