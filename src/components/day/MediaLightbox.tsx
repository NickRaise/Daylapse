import { useEffect, useState } from "react";
import { Image, Modal, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { useVideoPlayer, VideoView } from "expo-video";
import { fontSize, makeStyles, radius, spacing, useColors } from "@/theme";
import { formatDuration } from "@/utils/time";

type Selected = { uri: string; type: "image" | "video" } | null;

type Props = {
  selected: Selected;
  onClose: () => void;
};

function VideoLightbox({ uri }: { uri: string }) {
  const s = useStyles();
  const { width, height } = useWindowDimensions();
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    const sub = player.addListener("statusChange", () => {
      if (player.duration > 0) setDuration(player.duration);
    });
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    player.timeUpdateEventInterval = 0.25;
    const sub = player.addListener("timeUpdate", (e) => setCurrentTime(e.currentTime));
    return () => sub.remove();
  }, [player]);

  return (
    <View style={{ width, height }}>
      <VideoView
        style={{ width, height }}
        player={player}
        nativeControls={false}
        contentFit="contain"
      />

      <Pressable style={s.muteBtn} onPress={() => setMuted((m) => !m)} hitSlop={10}>
        <FontAwesomeFreeSolid
          name={muted ? "volume-xmark" : "volume-high"}
          size={16}
          color="#fff"
        />
      </Pressable>

      <View style={s.timestampPill}>
        <Text style={s.timestampText}>
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </Text>
      </View>
    </View>
  );
}

export function MediaLightbox({ selected, onClose }: Props) {
  const s = useStyles();
  const { width, height } = useWindowDimensions();
  return (
    <Modal
      visible={selected !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={s.lightbox}>
        {selected?.type === "image" ? (
          <Image source={{ uri: selected.uri }} style={{ width, height }} resizeMode="contain" />
        ) : selected?.type === "video" ? (
          <VideoLightbox uri={selected.uri} />
        ) : null}
        <Pressable style={s.closeBtn} onPress={onClose}>
          <FontAwesomeFreeSolid name="xmark" size={18} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  lightbox: {
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
  muteBtn: {
    position: "absolute",
    bottom: 48,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  timestampPill: {
    position: "absolute",
    bottom: 58,
    alignSelf: "center",
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
    borderRadius: radius.md,
  },
  timestampText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.bg,
    fontVariant: ["tabular-nums"],
  },
}));
