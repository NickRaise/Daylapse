import "../global.css";
import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-xl font-bold text-blue-600">
        Welcome to Nativewind!
      </Text>
    </View>
  );
}
