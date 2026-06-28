import { colors } from "@/theme";
import FontAwesomeFreeSolid, {
  FontAwesomeFreeSolidIconName,
} from "@react-native-vector-icons/fontawesome-free-solid";
import { Pressable, View } from "react-native";

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
      <Pressable onPress={() => console.log("Plus button pressed")}>
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
