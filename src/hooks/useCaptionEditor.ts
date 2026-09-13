import { useState } from "react";
import type { CaptionStyle } from "@/types";

type Options = {
  lastCaptionStyle: CaptionStyle;
  lastDateStampEnabled: boolean;
};

// Bundles the caption text/style overlay state so editor.tsx doesn't own it all directly.
export function useCaptionEditor({ lastCaptionStyle, lastDateStampEnabled }: Options) {
  const [captionText, setCaptionText] = useState("");
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(lastCaptionStyle);
  const [dateStampEnabled, setDateStampEnabled] = useState(lastDateStampEnabled);
  const [captionResetToken, setCaptionResetToken] = useState(0);

  function resetCaptionPosition() {
    setCaptionResetToken((n) => n + 1);
  }

  return {
    captionText,
    setCaptionText,
    captionStyle,
    setCaptionStyle,
    dateStampEnabled,
    setDateStampEnabled,
    captionResetToken,
    resetCaptionPosition,
  };
}
