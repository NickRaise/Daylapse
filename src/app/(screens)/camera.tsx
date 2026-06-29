import { CameraView, CameraType, CameraMode, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [mode, setMode] = useState<CameraMode>("picture");
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permText}>Camera access is needed</Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  async function openGallery() {
    await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"] });
  }

  return (
    <View style={styles.root}>
      <CameraView style={styles.camera} facing={facing} mode={mode} />

      {/* Photo / Video toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity onPress={() => setMode("picture")} style={styles.modeBtn}>
          <Text style={[styles.modeText, mode === "picture" && styles.modeActive]}>
            PHOTO
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode("video")} style={styles.modeBtn}>
          <Text style={[styles.modeText, mode === "video" && styles.modeActive]}>
            VIDEO
          </Text>
        </TouchableOpacity>
      </View>

      {/* Controls row */}
      <View style={styles.controls}>
        {/* Gallery */}
        <TouchableOpacity onPress={openGallery} style={styles.sideBtn}>
          <Text style={styles.icon}>⊞</Text>
        </TouchableOpacity>

        {/* Capture */}
        <View style={styles.captureRing}>
          <TouchableOpacity
            style={[styles.captureBtn, mode === "video" && styles.captureBtnVideo]}
          />
        </View>

        {/* Flip */}
        <TouchableOpacity
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          style={styles.sideBtn}
        >
          <Text style={styles.icon}>↺</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  permContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permText: {
    marginBottom: 12,
    fontSize: 16,
  },
  modeRow: {
    position: "absolute",
    bottom: 120,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
  },
  modeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  modeText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  modeActive: {
    color: "#fff",
  },
  controls: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 48,
  },
  sideBtn: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    color: "#fff",
    fontSize: 26,
  },
  captureRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
  },
  captureBtnVideo: {
    backgroundColor: "#E8523A",
    borderRadius: 8,
    width: 30,
    height: 30,
  },
});
