import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { Caveat_400Regular, useFonts } from "@expo-google-fonts/caveat";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Caveat: Caveat_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
