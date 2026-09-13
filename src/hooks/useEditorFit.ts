import { useEffect, useRef, useState } from "react";
import type { AspectRatio } from "@/types";

export type Fit = "landscape" | "portrait";

type Options = {
  isVideo: boolean;
  mediaWidth?: number;
  mediaHeight?: number;
  videoSize: { width: number; height: number } | null;
  defaultAspectRatio: AspectRatio;
};

// Prefers the actual captured orientation over the aspect-ratio setting, so a landscape photo/video opens in Landscape fit regardless of the frame shape last selected.
export function useEditorFit({
  isVideo,
  mediaWidth,
  mediaHeight,
  videoSize,
  defaultAspectRatio,
}: Options) {
  const capturedFit: Fit | null =
    mediaWidth && mediaHeight
      ? mediaWidth > mediaHeight
        ? "landscape"
        : "portrait"
      : null;
  const initFit: Fit =
    capturedFit ?? (defaultAspectRatio === "9:16" ? "portrait" : "landscape");

  const [fit, setFit] = useState<Fit>(initFit);
  const userToggledFitRef = useRef(false);

  // An in-app recording has no known dimensions up front, so this corrects the guess once the real size resolves, unless the user already toggled it manually.
  useEffect(() => {
    if (!isVideo || !videoSize || capturedFit || userToggledFitRef.current) return;
    setFit(videoSize.width > videoSize.height ? "landscape" : "portrait");
  }, [isVideo, videoSize, capturedFit]);

  function toggleFit() {
    userToggledFitRef.current = true;
    setFit((f) => (f === "landscape" ? "portrait" : "landscape"));
  }

  return { fit, toggleFit };
}
