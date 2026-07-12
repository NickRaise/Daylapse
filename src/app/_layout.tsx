import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { Caveat_400Regular, useFonts } from "@expo-google-fonts/caveat";
import { migrateDb } from "@/db";
import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Caveat: Caveat_400Regular,
  });

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await migrateDb();
      setReady(true);
    };

    init();
  }, []);

  if (!ready || !fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
