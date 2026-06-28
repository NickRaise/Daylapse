import { Text, View, StyleSheet } from "react-native";

export default function Gallery() {
  return (
    <View style={styles.container}>
      <Text className="bg-red-400">Media Gallery</Text>
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
