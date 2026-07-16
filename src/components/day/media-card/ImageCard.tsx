import { Image, Pressable, StyleSheet } from "react-native";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { colors } from "@/theme";
import type { Media } from "@/db/schema";
import { ActionsBar } from "./ActionsBar";

type Props = {
  item: Media;
  optionsOpen: boolean;
  onPress: () => void;
  onToggleOptions: () => void;
  onReorder: () => void;
  onDelete: () => void;
};

export function ImageCard({ item, optionsOpen, onPress, onToggleOptions, onReorder, onDelete }: Props) {
  return (
    <Pressable style={s.card} onPress={onPress}>
      <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <Pressable style={s.optionsBtn} hitSlop={12} onPress={onToggleOptions}>
        <FontAwesomeFreeSolid name="sliders" size={22} color={colors.bgSurface} />
      </Pressable>
      {optionsOpen && <ActionsBar onOpenReorder={onReorder} onDelete={onDelete} />}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  optionsBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 6,
  },
});
