import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as MediaLibrary from "expo-media-library/legacy";
import { captureRef } from "react-native-view-shot";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { colors, fontSize, radius, spacing } from "@/theme";
import useEditorStore from "@/store/editor.store";
import useEntryStore from "@/store/entry.store";
import useMediaStore from "@/store/media.store";
import useSettingsStore from "@/store/settings.store";
import { MediaRepository } from "@/repositories/media.repository";
import { mediaService } from "@/service/media.service";
import { MediaFrame, computeFrameRatio } from "@/components/editor/MediaFrame";
import { CaptionPanel } from "@/components/editor/CaptionPanel";
import { TrimPanel, type TrimRange } from "@/components/editor/TrimPanel";
import { VolumePanel } from "@/components/editor/VolumePanel";
import { DateStampControl } from "@/components/editor/DateStampControl";
import { DateStampOverlay } from "@/components/editor/DateStampOverlay";
import { DraggableCaption } from "@/components/editor/DraggableCaption";
import type { DateStampFormat, DateStampPosition } from "@/types";

type Tab = "caption" | "date" | "trim" | "volume";
type Orientation = "portrait" | "landscape";

const H_PAD = 16;

function todayDateKey(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function EditorScreen() {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const frameRef = useRef<View>(null);

  const pendingMedia = useEditorStore((s) => s.pendingMedia);
  const setPendingMedia = useEditorStore((s) => s.setPendingMedia);
  const currentEntryId = useEntryStore((s) => s.currentId);
  const setRecentlySavedMediaURI = useMediaStore((s) => s.setRecentlySavedMediaURI);
  const saveToGallery = useSettingsStore((s) => s.saveToGallery);
  const defaultAspectRatio = useSettingsStore((s) => s.defaultAspectRatio);
  const lastDateStampEnabled = useSettingsStore((s) => s.lastDateStampEnabled);
  const lastDateStampPosition = useSettingsStore((s) => s.lastDateStampPosition);
  const lastDateStampFormat = useSettingsStore((s) => s.lastDateStampFormat);
  const setLastDateStampPrefs = useSettingsStore((s) => s.setLastDateStampPrefs);

  // Derive initial orientation from the base ratio
  const initOrientation: Orientation =
    defaultAspectRatio === "9:16" ? "portrait" : "landscape";

  const [activeTab, setActiveTab] = useState<Tab>("caption");
  const [captionText, setCaptionText] = useState("");
  const [orientation, setOrientation] = useState<Orientation>(initOrientation);
  const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 0 });
  const [videoDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [dateStampEnabled, setDateStampEnabled] = useState(lastDateStampEnabled);
  const [dateStampPosition, setDateStampPosition] = useState<DateStampPosition>(lastDateStampPosition);
  const [dateStampFormat, setDateStampFormat] = useState<DateStampFormat>(lastDateStampFormat);
  const [isSaving, setIsSaving] = useState(false);

  const dateKey = todayDateKey();
  const isVideo = pendingMedia?.type === "video";

  // Frame dimensions (needed for DraggableCaption bounds)
  const frameW = screenW - H_PAD * 2;
  const frameH = frameW / computeFrameRatio(defaultAspectRatio, orientation);

  // Frame gestures are disabled while the user positions the caption
  const captionDragMode = activeTab === "caption" && captionText.length > 0;

  useEffect(() => {
    if (!pendingMedia) router.back();
  }, []);

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "caption", icon: "pen", label: "Caption" },
    { id: "date", icon: "calendar-days", label: "Date" },
    ...(isVideo
      ? [
          { id: "trim" as Tab, icon: "scissors", label: "Trim" },
          { id: "volume" as Tab, icon: "volume-high", label: "Volume" },
        ]
      : []),
  ];

  function toggleOrientation() {
    setOrientation((o) => (o === "landscape" ? "portrait" : "landscape"));
  }

  async function handleSave() {
    if (!pendingMedia || isSaving) return;
    setIsSaving(true);
    try {
      let localUri: string;

      if (isVideo) {
        // Can't burn overlays into video frames — save original
        localUri = await mediaService.copyMedia(pendingMedia.uri);
      } else {
        // Capture the frame view (with caption + date stamp composited)
        const capturedUri = await captureRef(frameRef, {
          format: "jpg",
          quality: 0.92,
          result: "tmpfile",
        });
        localUri = await mediaService.copyMedia(capturedUri);
      }

      if (saveToGallery) {
        await MediaLibrary.createAssetAsync(pendingMedia.uri);
      }

      if (currentEntryId !== null) {
        const existingMedia = await MediaRepository.getMediaByEntry(currentEntryId);
        await MediaRepository.addMedia({
          entryId: currentEntryId,
          type: isVideo ? "video" : "image",
          uri: localUri,
          order: existingMedia.length,
        });
      }

      setRecentlySavedMediaURI(localUri);

      await setLastDateStampPrefs({
        enabled: dateStampEnabled,
        position: dateStampPosition,
        format: dateStampFormat,
      });

      setPendingMedia(null);
    } catch (err) {
      console.error("[editor] save failed:", err);
      setIsSaving(false);
      return;
    }

    router.back(); // camera detects pendingMedia=null and also pops
  }

  function handleRetake() {
    setPendingMedia(null);
    router.back();
  }

  if (!pendingMedia || pendingMedia.isLoading) {
    return (
      <View style={s.loadingRoot}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadingText}>
          {pendingMedia?.isLoading ? "Processing video…" : "Loading…"}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <Pressable style={s.iconBtn} onPress={handleRetake} hitSlop={12}>
            <FontAwesomeFreeSolid name="arrow-left" size={16} color={colors.textSecondary} />
          </Pressable>

          <Text style={s.headerTitle}>Edit</Text>

          {/* Portrait / Landscape toggle */}
          <Pressable style={s.orientBtn} onPress={toggleOrientation} hitSlop={8}>
            <FontAwesomeFreeSolid
              name={orientation === "portrait" ? "mobile-screen" : "mobile-screen-button"}
              size={15}
              color={colors.textSecondary}
            />
            <Text style={s.orientLabel}>
              {orientation === "portrait" ? "Portrait" : "Landscape"}
            </Text>
          </Pressable>
        </View>

        {/* ── Media Frame ── */}
        <View style={s.frameWrap}>
          <MediaFrame
            ref={frameRef}
            media={pendingMedia}
            aspectRatio={defaultAspectRatio}
            orientation={orientation}
            gesturesEnabled={!captionDragMode}
          >
            {/* Draggable caption — burned into photo on save */}
            <DraggableCaption
              text={captionText}
              frameWidth={frameW}
              frameHeight={frameH}
              draggable={captionDragMode}
            />

            {/* Date stamp overlay — burned into photo on save */}
            {dateStampEnabled && (
              <DateStampOverlay
                dateKey={dateKey}
                position={dateStampPosition}
                format={dateStampFormat}
              />
            )}
          </MediaFrame>

          {/* Caption drag hint */}
          {captionDragMode && (
            <Text style={s.dragHint}>Drag the text to position it on the frame</Text>
          )}
        </View>

        {/* ── Tool tab bar ── */}
        <View style={s.tabBar}>
          {tabs.map(({ id, icon, label }) => {
            const active = activeTab === id;
            return (
              <Pressable key={id} style={s.tabBtn} onPress={() => setActiveTab(id)}>
                <FontAwesomeFreeSolid
                  name={icon}
                  size={14}
                  color={active ? colors.primary : colors.textMuted}
                />
                <Text style={[s.tabLabel, active && s.tabLabelActive]}>{label}</Text>
                {active && <View style={s.tabIndicator} />}
              </Pressable>
            );
          })}
        </View>

        {/* ── Tool panel ── */}
        <ScrollView
          style={s.panelScroll}
          contentContainerStyle={s.panelContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "caption" && (
            <CaptionPanel
              value={captionText}
              onChange={setCaptionText}
              isVideo={isVideo}
            />
          )}
          {activeTab === "date" && (
            <DateStampControl
              enabled={dateStampEnabled}
              position={dateStampPosition}
              format={dateStampFormat}
              onToggle={setDateStampEnabled}
              onPositionChange={setDateStampPosition}
              onFormatChange={setDateStampFormat}
            />
          )}
          {activeTab === "trim" && isVideo && (
            <TrimPanel
              duration={videoDuration}
              range={trimRange}
              onRangeChange={setTrimRange}
            />
          )}
          {activeTab === "volume" && isVideo && (
            <VolumePanel volume={volume} onVolumeChange={setVolume} />
          )}
        </ScrollView>

        {/* ── Action row ── */}
        <View style={s.actions}>
          <Pressable style={[s.btn, s.btnSecondary]} onPress={handleRetake}>
            <Text style={s.btnSecText}>Retake</Text>
          </Pressable>
          <Pressable
            style={[s.btn, s.btnPrimary, isSaving && s.btnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.textOnAccent} />
            ) : (
              <Text style={s.btnPrimText}>Save</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },

  loadingRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing[3],
  },
  loadingText: { fontSize: fontSize.sm, color: colors.textSecondary },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  orientBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSubtle,
  },
  orientLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.textSecondary,
  },

  // Frame
  frameWrap: {
    alignItems: "center",
    paddingHorizontal: H_PAD,
    gap: 6,
  },
  dragHint: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontStyle: "italic",
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing[3],
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[3],
    gap: 3,
    position: "relative",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "20%",
    right: "20%",
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },

  // Panel
  panelScroll: { flex: 1 },
  panelContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },

  // Actions
  actions: {
    flexDirection: "row",
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  btnSecondary: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnDisabled: { opacity: 0.6 },
  btnSecText: { fontSize: fontSize.base, fontWeight: "600", color: colors.textPrimary },
  btnPrimText: { fontSize: fontSize.base, fontWeight: "600", color: colors.textOnAccent },
});
