import { colors } from "@/theme";
import { StyleSheet, Text, View } from "react-native";

export default function DayScreen() {
  return (
    <View style={styles.root}>
      <Text>Day Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
