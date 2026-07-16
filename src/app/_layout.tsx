import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { Caveat_400Regular, useFonts } from "@expo-google-fonts/caveat";
import { migrateDb } from "@/db";
import useSettingsStore from "@/store/settings.store";
import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const STACK_SCREEN_OPTIONS = { headerShown: false } as const;
const FONTS = { Caveat: Caveat_400Regular } as const;

export default function RootLayout() {
  const [fontsLoaded] = useFonts(FONTS);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await Promise.all([migrateDb(), useSettingsStore.getState().hydrate()]);
      setReady(true);
    };

    init();
  }, []);

  if (!ready || !fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={STACK_SCREEN_OPTIONS} />
    </GestureHandlerRootView>
  );
}
