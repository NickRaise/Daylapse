import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors, fontSize, spacing } from "../theme";

type Props = {
  message?: string;
};

// TODO: Needs UI improvements
export function LoadingScreen({ message }: Props) {
  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      <Text style={s.title}>Daylapse</Text>
      <ActivityIndicator
        size="small"
        color={colors.primary}
        style={s.spinner}
      />
      {message && <Text style={s.message}>{message}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing[3],
  },
  title: {
    fontSize: fontSize["2xl"],
    color: colors.primary,
    fontFamily: "Caveat",
    letterSpacing: 1,
  },
  spinner: {
    marginTop: spacing[1],
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
