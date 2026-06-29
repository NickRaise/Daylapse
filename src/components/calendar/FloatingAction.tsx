import { colors } from "@/theme";
import FontAwesomeFreeSolid, {
  FontAwesomeFreeSolidIconName,
} from "@react-native-vector-icons/fontawesome-free-solid";
import { Pressable, View } from "react-native";
import { getTodayKey } from "./utils";
import { useRouter } from "expo-router";

const RenderIcon = ({
  name,
  size,
  color,
  bgColor = "white",
}: {
  name: FontAwesomeFreeSolidIconName;
  size: number;
  color: string;
  bgColor: string;
}) => {
  return (
    <View>
      <FontAwesomeFreeSolid
        name="circle"
        size={size}
        color={bgColor}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
      <FontAwesomeFreeSolid name={name} size={size} color={color} />
    </View>
  );
};

export default function FloatingActions() {
  const ICON_SIZE = 80;
  const router = useRouter();

  const handleAddPress = () => {
    const dateKey = getTodayKey();
    router.push({ pathname: "/day", params: { dateKey } });
  };

  return (
    <View className={styles.container}>
      <Pressable onPress={() => console.log("Play button pressed")}>
        <RenderIcon
          name="play-circle"
          size={ICON_SIZE}
          color={colors.textPrimary}
          bgColor="white"
        />
      </Pressable>
      <Pressable onPress={handleAddPress}>
        <RenderIcon
          name="plus-circle"
          size={ICON_SIZE}
          color={colors.primary}
          bgColor="white"
        />
      </Pressable>
    </View>
  );
}

const styles = {
  container: "absolute bottom-2 right-5 flex flex-row gap-4 flex-1",
};
