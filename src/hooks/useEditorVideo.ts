import { useCallback, useEffect, useRef, useState } from "react";
import { useVideoPlayer } from "expo-video";
import type { VideoPlayer } from "expo-video";
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withRepeat,
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

  // Playback previews from the clip start through the REST of the video (past
  // the selection box) so the user can see the footage being cut, then loops
  // back to the clip start. The playhead is one continuous linear sweep across
  // that range — it runs on the UI thread and does NOT chase the per-frame
  // currentTime (expo-video reports it with tiny non-monotonic jitter, and
  // re-aiming a timing every tick made the needle shake/step backward).
  useEffect(() => {
    if (!isVideo || !videoDuration) return;
    const sub = videoPlayer.addListener("playingChange", ({ isPlaying }) => {
      if (isPlaying) {
        const { start } = trimRangeRef.current;
        const span = Math.max(0, videoDuration - start);
        playheadSV.value = start;
        if (span > 0) {
          playheadSV.value = withRepeat(
            withTiming(videoDuration, { duration: span * 1000, easing: Easing.linear }),
            -1,
            false,
          );
        }
      } else {
        cancelAnimation(playheadSV);
        playheadSV.value = videoPlayer.currentTime;
      }
    });
    return () => sub.remove();
  }, [isVideo, videoPlayer, videoDuration]);

  // Loops playback back to the clip start when it reaches the end of the video.
  // No shared-value writes here — the needle self-loops via withRepeat above,
  // on the same (start → end-of-video) period.
  useEffect(() => {
    if (!isVideo || !videoDuration) return;
    videoPlayer.timeUpdateEventInterval = 0.05;
    const sub = videoPlayer.addListener("timeUpdate", ({ currentTime }) => {
      if (currentTime >= videoDuration - 0.1) videoPlayer.currentTime = trimRangeRef.current.start;
    });
    return () => sub.remove();
  }, [isVideo, videoPlayer, videoDuration]);

  return {
    videoPlayer,
    videoDuration,
    playheadSV,
    trimRangeRef,
    setTrimRange,
  };
}
