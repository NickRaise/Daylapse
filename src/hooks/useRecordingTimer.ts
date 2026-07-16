import { useRef, useState } from "react";

export function useRecordingTimer() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [duration, setDuration] = useState(0);

  function startTimer() {
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setDuration(0);
  }

  return { duration, startTimer, stopTimer };
}
