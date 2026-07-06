import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { colors, radius, spacing, fontSize, fontWeight } from "../../theme";

type Preview = { uri: string; type: "photo" | "video"; isLoading?: boolean };

type Props = {
  preview: Preview;
  onRetake: () => void;
  onSave: () => void;
};

const THUMB_SIZE = 16;
const TRACK_HIT_HEIGHT = 28;
const TRACK_HEIGHT = 3;

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CameraPreview({ preview, onRetake, onSave }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekRatio, setSeekRatio] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const trackOriginX = useRef(0);

  const player = useVideoPlayer(
    preview.type === "video" && !preview.isLoading && preview.uri
      ? preview.uri
      : null,
    (p) => {
      p.timeUpdateEventInterval = 0.1;
      p.loop = false;
    },
  );

  useEffect(() => {
    const s1 = player.addListener("playingChange", ({ isPlaying: v }) => {
      setIsPlaying(v);
      if (v) setIsEnded(false);
    });
    const s2 = player.addListener("timeUpdate", ({ currentTime: t }) => {
      setCurrentTime(t);
    });
    const s3 = player.addListener("sourceLoad", ({ duration: d }) => {
      setDuration(d);
    });
    const s4 = player.addListener("playToEnd", () => {
      setIsEnded(true);
    });
    return () => {
      s1.remove();
      s2.remove();
      s3.remove();
      s4.remove();
    };
  }, [player]);

  useEffect(() => {
    setIsEnded(false);
  }, [preview.uri]);

  const progress = isSeeking
    ? seekRatio
    : duration > 0
      ? Math.min(currentTime / duration, 1)
      : 0;
  const fillWidth = progress * trackWidth;
  const thumbLeft = fillWidth - THUMB_SIZE / 2;

  function clamp(x: number) {
    return Math.max(0, Math.min(1, x / (trackWidth || 1)));
  }

  return (
    <View style={s.root}>
      <View style={s.viewfinderWrapper}>
        {preview.isLoading ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={t.loadingText}>Processing video…</Text>
          </View>
        ) : preview.type === "photo" ? (
          <Image
            source={{ uri: preview.uri }}
            style={s.image}
            resizeMode="cover"
          />
        ) : (
          <View style={s.videoContainer}>
            <VideoView style={s.video} player={player} nativeControls={false} />

            <View style={s.controlsOverlay}>
              {/* Scrubber */}
              <View style={s.scrubberRow}>
                <Text style={t.timeText}>{formatTime(currentTime)}</Text>

                <View
                  style={s.scrubberHitArea}
                  onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onResponderGrant={(e) => {
                    // Capture the track's left edge in screen coords once so moves stay accurate
                    trackOriginX.current =
                      e.nativeEvent.pageX - e.nativeEvent.locationX;
                    if (player.playing) player.pause();
                    setIsSeeking(true);
                    setSeekRatio(clamp(e.nativeEvent.locationX));
                  }}
                  onResponderMove={(e) => {
                    setSeekRatio(
                      clamp(e.nativeEvent.pageX - trackOriginX.current),
                    );
                  }}
                  onResponderRelease={(e) => {
                    player.currentTime =
                      clamp(e.nativeEvent.pageX - trackOriginX.current) *
                      duration;
                    setIsEnded(false);
                    setIsSeeking(false);
                  }}
                >
                  <View style={s.scrubberRail} />
                  <View
                    style={[s.scrubberFill, { width: Math.max(0, fillWidth) }]}
                  />
                  {trackWidth > 0 && (
                    <View style={[s.scrubberThumb, { left: thumbLeft }]} />
                  )}
                </View>

                <Text style={[t.timeText, t.timeRight]}>
                  {formatTime(duration)}
                </Text>
              </View>

              {/* Play / Pause */}
              <TouchableOpacity
                style={s.playPauseBtn}
                onPress={() => {
                  if (isEnded) {
                    player.currentTime = 0;
                    player.play();
                  } else {
                    isPlaying ? player.pause() : player.play();
                  }
                }}
                activeOpacity={0.8}
              >
                <FontAwesomeFreeSolid
                  name={
                    isEnded ? "arrow-rotate-left" : isPlaying ? "pause" : "play"
                  }
                  size={18}
                  color={colors.textOnAccent}
                  style={!isEnded && !isPlaying ? { marginLeft: 2 } : undefined}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={s.panel}>
        <View style={s.actions}>
          <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={onRetake}>
            <Text style={t.btnTextSecondary}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btn, s.btnPrimary, preview.isLoading && s.btnDisabled]}
            onPress={onSave}
            disabled={preview.isLoading}
          >
            <Text style={t.btnTextPrimary}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  viewfinderWrapper: {
    flex: 1,
    overflow: "hidden",
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  image: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.textPrimary,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing[3],
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  controlsOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[6],
    backgroundColor: "rgba(30, 22, 14, 0.62)",
    gap: spacing[4],
    alignItems: "center",
  },
  scrubberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    width: "100%",
  },
  scrubberHitArea: {
    flex: 1,
    height: TRACK_HIT_HEIGHT,
    justifyContent: "center",
  },
  scrubberRail: {
    position: "absolute",
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  scrubberFill: {
    position: "absolute",
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.primary,
  },
  scrubberThumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#fff",
    top: (TRACK_HIT_HEIGHT - THUMB_SIZE) / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  playPauseBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  panel: {
    backgroundColor: colors.bg,
    paddingTop: spacing[5],
    paddingBottom: spacing[10],
    paddingHorizontal: spacing[6],
  },
  actions: {
    flexDirection: "row",
    gap: spacing[4],
  },
  btn: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    alignItems: "center",
  },
  btnSecondary: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});

type FW = TextStyle["fontWeight"];

// Typed explicitly to avoid StyleSheet inference returning ViewStyle | TextStyle | ImageStyle
const t: Record<string, TextStyle> = {
  loadingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium as FW,
    color: colors.bgSubtle,
  },
  timeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium as FW,
    color: "rgba(255,255,255,0.85)",
    minWidth: 32,
  },
  timeRight: {
    textAlign: "right",
  },
  btnTextSecondary: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold as FW,
    color: colors.textPrimary,
  },
  btnTextPrimary: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold as FW,
    color: colors.textOnAccent,
  },
};
