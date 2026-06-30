import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing, fontSize } from "../../theme";

type Preview = { uri: string; type: "photo" | "video" };

type Props = {
  preview: Preview;
  onRetake: () => void;
  onSave: () => void;
};

export function CameraPreview({ preview, onRetake, onSave }: Props) {
  return (
    <View style={s.root}>
      <View style={s.viewfinderWrapper}>
        {preview.type === "photo" ? (
          <Image source={{ uri: preview.uri }} style={s.image} resizeMode="cover" />
        ) : (
          <View style={s.videoPlaceholder}>
            <Text style={t.videoIcon}>▶</Text>
            <Text style={t.videoSavedText}>Video recorded</Text>
          </View>
        )}
      </View>

      <View style={s.panel}>
        <View style={s.actions}>
          <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={onRetake}>
            <Text style={t.btnTextSecondary}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onSave}>
            <Text style={t.btnTextPrimary}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  viewfinderWrapper: {
    flex: 1,
    overflow: "hidden",
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  image: {
    flex: 1,
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: colors.textPrimary,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing[3],
  },
  panel: {
    backgroundColor: colors.bg,
    paddingTop: spacing[5],
    paddingBottom: spacing[10],
    paddingHorizontal: spacing[6],
  },
  actions: {
    flexDirection: "row",
    gap: spacing[4],
  },
  btn: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    alignItems: "center",
  },
  btnSecondary: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
});

const t = StyleSheet.create({
  videoIcon: {
    fontSize: 48,
    color: colors.bg,
  },
  videoSavedText: {
    fontSize: fontSize.base,
    fontWeight: "500",
    color: colors.bgSubtle,
  },
  btnTextSecondary: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  btnTextPrimary: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.textOnAccent,
  },
});
