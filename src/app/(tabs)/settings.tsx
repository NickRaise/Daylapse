import { Text, View, StyleSheet } from "react-native";

export default function Settings() {
  return (
    <View style={styles.container}>
      <Text className="bg-red-400">Settings</Text>
      {/* Video Quality
       use native mobile camera
       Save to media gallery also
       Force recording time limit (1 sec, 5 sec, 10 sec, 30 sec, 1 min, 5 min) */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
