import { Image, Modal, Pressable, StatusBar, StyleSheet, useWindowDimensions, View } from "react-native";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { useVideoPlayer, VideoView } from "expo-video";

type Selected = { uri: string; type: "image" | "video" } | null;

type Props = {
  selected: Selected;
  onClose: () => void;
};

function VideoLightbox({ uri }: { uri: string }) {
  const { width, height } = useWindowDimensions();
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });
  return <VideoView style={{ width, height }} player={player} nativeControls />;
}

export function MediaLightbox({ selected, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  return (
    <Modal
      visible={selected !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={s.lightbox}>
        {selected?.type === "image" ? (
          <Image source={{ uri: selected.uri }} style={{ width, height }} resizeMode="contain" />
        ) : selected?.type === "video" ? (
          <VideoLightbox uri={selected.uri} />
        ) : null}
        <Pressable style={s.closeBtn} onPress={onClose}>
          <FontAwesomeFreeSolid name="xmark" size={18} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  lightbox: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
