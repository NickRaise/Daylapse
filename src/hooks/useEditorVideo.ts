import { useCallback, useEffect, useRef, useState } from "react";
import { useVideoPlayer } from "expo-video";
import type { VideoPlayer } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";
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
      p.loop = false; // native loop would race our own clip-end pause
      p.muted = false;
    },
  );

  const [videoDuration, setVideoDuration] = useState(0);
  const [videoSize, setVideoSize] = useState<{ width: number; height: number } | null>(null);
  const playheadSV = useSharedValue(0);
  const trimRangeRef = useRef<TrimRange>({ start: 0, end: 0 });
  const autoPausedRef = useRef(false);

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

  // videoTrack.size ignores rotation metadata on Android (reports the raw encoded buffer, not the display orientation), so a thumbnail — which must render rotation-correct to look right — is used instead.
  useEffect(() => {
    if (!isVideo || !mediaUri) return;
    let cancelled = false;
    VideoThumbnails.getThumbnailAsync(mediaUri, { time: 0 })
      .then(({ width, height }) => {
        if (!cancelled) setVideoSize({ width, height });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isVideo, mediaUri]);

  // Playhead sweeps start → end of the trim box, not the full video.
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
        // Eased catch-up (not an instant jump) absorbs drift between the sweep and the real playback clock.
        if (autoPausedRef.current) {
          autoPausedRef.current = false;
          playheadSV.value = withTiming(trimRangeRef.current.end, { duration: 100, easing: Easing.out(Easing.quad) });
        } else {
          playheadSV.value = videoPlayer.currentTime;
        }
      }
    });
    return () => sub.remove();
  }, [isVideo, videoPlayer, videoDuration]);

  // Pauses at the clip end; TrimPanel resets currentTime to the start on Play.
  useEffect(() => {
    if (!isVideo || !videoDuration) return;
    videoPlayer.timeUpdateEventInterval = 0.05;
    const sub = videoPlayer.addListener("timeUpdate", ({ currentTime }) => {
      const { end } = trimRangeRef.current;
      if (currentTime >= end - 0.05) {
        autoPausedRef.current = true;
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
