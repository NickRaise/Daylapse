import { useRef } from "react";

export function useCameraReady() {
  const resolverRef = useRef<(() => void) | null>(null);

  function waitForCameraReady(): Promise<void> {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }

  function handleCameraReady() {
    resolverRef.current?.();
    resolverRef.current = null;
  }

  return { waitForCameraReady, handleCameraReady };
}
