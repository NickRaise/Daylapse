import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { Caveat_400Regular, useFonts } from "@expo-google-fonts/caveat";
import { migrateDb } from "@/db";
import useSettingsStore from "@/store/settings.store";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "@/theme";
import { configureNotificationHandler, syncReminder } from "@/service/reminder.service";
import { ToastHost } from "@/components/Toast";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

const STACK_SCREEN_OPTIONS = { headerShown: false } as const;
const FONTS = { Caveat: Caveat_400Regular } as const;

export default function RootLayout() {
  const [fontsLoaded] = useFonts(FONTS);
  const theme = useSettingsStore((s) => s.theme);
  const hasSeenOnboarding = useSettingsStore((s) => s.hasSeenOnboarding);
  const setHasSeenOnboarding = useSettingsStore((s) => s.setHasSeenOnboarding);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      configureNotificationHandler();
      await Promise.all([migrateDb(), useSettingsStore.getState().hydrate()]);
      setReady(true);
      syncReminder();
    };

    init();

    // The reminder's copy depends on today's state, so it's recomputed on every app-state change
    // rather than trusting a single far-future trigger to still be relevant when it fires.
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" || state === "background") syncReminder();
    });
    return () => sub.remove();
  }, []);

  if (!ready || !fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider name={theme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemedStatusBar />
        <Stack screenOptions={STACK_SCREEN_OPTIONS} />
        <ToastHost />
        <OnboardingTour visible={!hasSeenOnboarding} onDone={() => setHasSeenOnboarding(true)} />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

// Light text on the dark theme, dark text on the rest.
function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}
