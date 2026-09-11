import { useCallback, useEffect, useRef, useState } from "react";
import { useVideoPlayer } from "expo-video";
import type { VideoPlayer } from "expo-video";
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
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
  videoSize: { width: number; height: number } | null;
  playheadSV: SharedValue<number>;
  trimRangeRef: React.MutableRefObject<TrimRange>;
  setTrimRange: (r: TrimRange) => void;
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
  const [videoSize, setVideoSize] = useState<{ width: number; height: number } | null>(null);
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

  // recordAsync only returns a uri, so dimensions resolve after the player loads it.
  // `sourceLoad` can fire before this subscribes, so also read videoTrack directly.
  useEffect(() => {
    if (!isVideo) return;
    const readSize = () => {
      const size = videoPlayer.videoTrack?.size;
      if (size) setVideoSize(size);
    };
    readSize();
    const subs = [
      videoPlayer.addListener("sourceLoad", readSize),
      videoPlayer.addListener("statusChange", readSize),
    ];
    return () => subs.forEach((sub) => sub.remove());
  }, [isVideo, videoPlayer]);

  // Playhead sweeps start → end of the trim box (not the full video, and not
  // per-frame currentTime — expo-video's jitter there made it shake).
  useEffect(() => {
    if (!isVideo || !videoDuration) return;
    const sub = videoPlayer.addListener("playingChange", ({ isPlaying }) => {
      if (isPlaying) {
        const { start, end } = trimRangeRef.current;
        const span = Math.max(0, end - start);
        playheadSV.value = start;
        if (span > 0) {
          playheadSV.value = withTiming(end, { duration: span * 1000, easing: Easing.linear });
        }
      } else {
        cancelAnimation(playheadSV);
        playheadSV.value = videoPlayer.currentTime;
      }
    });
    return () => sub.remove();
  }, [isVideo, videoPlayer, videoDuration]);

  // Pauses at the clip end instead of continuing into the discarded footage;
  // TrimPanel resets currentTime to the clip start before Play resumes it.
  useEffect(() => {
    if (!isVideo || !videoDuration) return;
    videoPlayer.timeUpdateEventInterval = 0.05;
    const sub = videoPlayer.addListener("timeUpdate", ({ currentTime }) => {
      const { end } = trimRangeRef.current;
      if (currentTime >= end - 0.05) {
        videoPlayer.pause();
        videoPlayer.currentTime = end;
      }
    });
    return () => sub.remove();
  }, [isVideo, videoPlayer, videoDuration]);

  return {
    videoPlayer,
    videoDuration,
    videoSize,
    playheadSV,
    trimRangeRef,
    setTrimRange,
  };
}
