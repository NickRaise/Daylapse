import { useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import type { Zoom } from "@/utils/frameMapping";

export type EditorZoom = {
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  savedScale: SharedValue<number>;
  savedX: SharedValue<number>;
  savedY: SharedValue<number>;
};

// Owned by the editor screen so the save step can read exactly what was framed on screen.
export function useEditorZoom() {
  const zoom: EditorZoom = {
    scale: useSharedValue(1),
    translateX: useSharedValue(0),
    translateY: useSharedValue(0),
    savedScale: useSharedValue(1),
    savedX: useSharedValue(0),
    savedY: useSharedValue(0),
  };

  function reset() {
    zoom.scale.value = withTiming(1);
    zoom.translateX.value = withTiming(0);
    zoom.translateY.value = withTiming(0);
    zoom.savedScale.value = 1;
    zoom.savedX.value = 0;
    zoom.savedY.value = 0;
  }

  // Reads the gesture's resting values, not a mid-animation frame.
  function snapshot(): Zoom {
    return {
      scale: zoom.savedScale.value,
      translateX: zoom.savedX.value,
      translateY: zoom.savedY.value,
    };
  }

  return { zoom, reset, snapshot };
}
