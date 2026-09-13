import { memo } from "react";
import { Image, Pressable, StyleSheet } from "react-native";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { makeStyles, useColors } from "@/theme";
import type { Media } from "@/db/schema";
import { ActionsBar } from "./ActionsBar";

type Props = {
  item: Media;
  optionsOpen: boolean;
  onPress: (item: Media) => void;
  onToggleOptions: (id: number) => void;
  onReorder: () => void;
  onDelete: (id: number) => void;
};

export const ImageCard = memo(function ImageCard({
  item,
  optionsOpen,
  onPress,
  onToggleOptions,
  onReorder,
  onDelete,
}: Props) {
  const s = useStyles();
  const colors = useColors();
  return (
    <Pressable style={s.card} onPress={() => onPress(item)}>
      <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <Pressable style={s.optionsBtn} hitSlop={12} onPress={() => onToggleOptions(item.id)}>
        <FontAwesomeFreeSolid name="sliders" size={22} color={colors.bgSurface} />
      </Pressable>
      {optionsOpen && <ActionsBar onOpenReorder={onReorder} onDelete={() => onDelete(item.id)} />}
    </Pressable>
  );
});

const useStyles = makeStyles((colors) => ({
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
}));
