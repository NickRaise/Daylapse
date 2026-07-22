import { useCallback, useEffect, useRef, useState } from "react";
import { useVideoPlayer } from "expo-video";
import type { VideoPlayer } from "expo-video";
import { useSharedValue, withTiming } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import type { TrimRange } from "@/components/editor/TrimPanel";

type Options = {
  isVideo: boolean;
  mediaUri: string | null;
  volume: number;
};

type Result = {
  videoPlayer: VideoPlayer;
  videoDuration: number;
  playheadTime: number;
  playheadSV: SharedValue<number>;
  trimRangeRef: React.MutableRefObject<TrimRange>;
  setTrimRange: (r: TrimRange) => void;
  handleSeek: (t: number) => void;
};

export function useEditorVideo({ isVideo, mediaUri, volume }: Options): Result {
  const videoPlayer = useVideoPlayer(
    isVideo && mediaUri ? mediaUri : null,
    (p) => {
      p.loop = true;
      p.muted = false;
    },
  );

  const [videoDuration, setVideoDuration] = useState(0);
  const [playheadTime, setPlayheadTime] = useState(0);
  const playheadSV = useSharedValue(0);
  const trimRangeRef = useRef<TrimRange>({ start: 0, end: 0 });

  const setTrimRange = useCallback((r: TrimRange) => {
    trimRangeRef.current = r;
  }, []);

  useEffect(() => {
    if (isVideo) videoPlayer.volume = volume;
  }, [volume, isVideo, videoPlayer]);

  useEffect(() => {
    if (!isVideo) return;
    const sub = videoPlayer.addListener("statusChange", () => {
      const d = videoPlayer.duration;
      if (d > 0) setVideoDuration(d);
    });
    return () => sub.remove();
  }, [isVideo, videoPlayer]);

  // Feeds playhead into the needle (shared value, UI thread) and timestamp
  // display (React state, throttled to ~10 fps to avoid excess re-renders).
  useEffect(() => {
    if (!isVideo || !videoDuration) return;
    videoPlayer.timeUpdateEventInterval = 0.05;
    let lastDisplayT = -1;
    const sub = videoPlayer.addListener("timeUpdate", ({ currentTime }) => {
      playheadSV.value = withTiming(currentTime, { duration: 80 });
      if (Math.abs(currentTime - lastDisplayT) >= 0.1) {
        lastDisplayT = currentTime;
        setPlayheadTime(currentTime);
      }
    });
    return () => sub.remove();
  }, [isVideo, videoPlayer, videoDuration]);

  // Instant seek: bypass withTiming so the needle jumps on drag/tap/step.
  const handleSeek = useCallback((t: number) => {
    playheadSV.value = t;
    setPlayheadTime(t);
  }, []);

  return {
    videoPlayer,
    videoDuration,
    playheadTime,
    playheadSV,
    trimRangeRef,
    setTrimRange,
    handleSeek,
  };
}
