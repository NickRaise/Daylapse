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
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { colors, fontSize, spacing } from "@/theme";
import useEditorStore from "@/store/editor.store";
import useSettingsStore from "@/store/settings.store";
import { MediaFrame, frameSize } from "@/components/editor/MediaFrame";
import { CaptionPanel } from "@/components/editor/CaptionPanel";
import { ClipDurationPicker } from "@/components/editor/ClipDurationPicker";
import { TrimPanel } from "@/components/editor/TrimPanel";
import { VolumePanel } from "@/components/editor/VolumePanel";
import { DateStampOverlay } from "@/components/editor/DateStampOverlay";
import { DraggableCaption } from "@/components/editor/DraggableCaption";
import { BurnOverlay } from "@/components/editor/BurnOverlay";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { EditorTabBar } from "@/components/editor/EditorTabBar";
import { EditorActions } from "@/components/editor/EditorActions";
import { useEditorVideo } from "@/hooks/useEditorVideo";
import { useEditorFit } from "@/hooks/useEditorFit";
import { useCaptionEditor } from "@/hooks/useCaptionEditor";
import { useEditorSave } from "@/hooks/useEditorSave";
import { todayDateKey } from "@/utils/date";
import { mediaExportFrame, type FitMode } from "@/utils/frameMapping";
import type { DateStampFormat } from "@/types";

type Tab = "trim" | "text";

const H_PAD = 16;
// No UI can change this anymore (DateStampControl was removed as dead code) — fixed default.
const DATE_STAMP_FORMAT: DateStampFormat = "DD MMM YYYY";

const VIDEO_TABS = [
  { id: "trim" as Tab, icon: "scissors" as const, label: "Trim" },
  { id: "text" as Tab, icon: "pen" as const, label: "Text & Date" },
];

export default function EditorScreen() {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const frameRef = useRef<View>(null);
  const burnOverlayRef = useRef<View>(null);
  const [captionRect, setCaptionRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const pendingMedia = useEditorStore((s) => s.pendingMedia);
  const defaultAspectRatio = useSettingsStore((s) => s.defaultAspectRatio);
  const lastCaptionStyle = useSettingsStore((s) => s.lastCaptionStyle);
  const lastVolume = useSettingsStore((s) => s.lastVolume);
  const lastDateStampEnabled = useSettingsStore((s) => s.lastDateStampEnabled);
  const lastPhotoDuration = useSettingsStore((s) => s.lastPhotoDuration);

  const isVideo = pendingMedia?.type === "video";

  const [activeTab, setActiveTab] = useState<Tab>("trim");
  const [volume, setVolume] = useState(lastVolume);
  const [photoDuration, setPhotoDuration] = useState(lastPhotoDuration);

  const {
    captionText,
    setCaptionText,
    captionStyle,
    setCaptionStyle,
    dateStampEnabled,
    setDateStampEnabled,
    captionResetToken,
    resetCaptionPosition,
  } = useCaptionEditor({ lastCaptionStyle, lastDateStampEnabled });

  const {
    videoPlayer,
    videoDuration,
    videoSize,
    playheadSV,
    trimRangeRef,
    setTrimRange,
  } = useEditorVideo({
    isVideo,
    mediaUri: isVideo && !pendingMedia?.isLoading ? pendingMedia!.uri : null,
    volume,
  });

  const { fit, toggleFit } = useEditorFit({
    isVideo,
    mediaWidth: pendingMedia?.width,
    mediaHeight: pendingMedia?.height,
    videoSize,
    defaultAspectRatio,
  });

  const { width: frameW, height: frameH } = frameSize(
    defaultAspectRatio,
    screenW,
  );
  const dateKey = todayDateKey();
  const captionDragMode =
    (!isVideo || activeTab === "text") && captionText.length > 0;

  const fitMode: FitMode = fit === "landscape" ? "cover" : "contain";
  const hasOverlay = captionText.length > 0 || dateStampEnabled;
  const exportFrame = videoSize
    ? mediaExportFrame(frameW, frameH, videoSize.width, videoSize.height, fitMode)
    : null;
  // The exported frame is just the on-screen frame scaled up, so caption coordinates only need that factor.
  const overlayCaptionPos =
    captionText && captionRect && exportFrame
      ? { left: captionRect.left / exportFrame.scale, top: captionRect.top / exportFrame.scale }
      : null;

  const { handleSave, isSaving } = useEditorSave({
    frameRef,
    burnOverlayRef,
    isVideo,
    hasOverlay,
    videoSize,
    exportFrame,
    captionStyle,
    volume,
    dateStampEnabled,
    trimRangeRef,
    videoDuration,
    photoDuration,
    onComplete: router.back,
  });

  useEffect(() => {
    if (!pendingMedia) router.back();
  }, []);

  function handleRetake() {
    // Not clearing pendingMedia here — camera.tsx auto-dismisses on focus once it's null, which would skip past the camera screen entirely.
    router.back();
  }

  if (!pendingMedia || pendingMedia.isLoading) {
    return (
      <View style={s.loadingRoot}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadingText}>
          {pendingMedia?.isLoading ? "Getting your moment ready…" : "One moment…"}
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
        <EditorHeader fit={fit} onBack={handleRetake} onToggleFit={toggleFit} />

        <View style={s.frameWrap}>
          <MediaFrame
            ref={frameRef}
            media={pendingMedia}
            aspectRatio={defaultAspectRatio}
            fit={fit}
            player={videoPlayer}
            gesturesEnabled={!captionDragMode}
          >
            <DraggableCaption
              text={captionText}
              frameWidth={frameW}
              frameHeight={frameH}
              textColor={captionStyle.textColor}
              bgColor={captionStyle.bgColor}
              size={captionStyle.size}
              position={captionStyle.position}
              draggable={captionDragMode}
              resetSignal={captionResetToken}
              onRectChange={setCaptionRect}
            />
            {dateStampEnabled && (
              <DateStampOverlay
                dateKey={dateKey}
                format={DATE_STAMP_FORMAT}
                textColor={captionStyle.textColor}
                bgColor={captionStyle.bgColor}
              />
            )}
          </MediaFrame>

          <View
            style={[s.dragHintRow, !captionDragMode && s.dragHintHidden]}
            pointerEvents={captionDragMode ? "auto" : "none"}
          >
            <Text style={s.dragHint}>Drag the text to reposition</Text>
            <Pressable style={s.resetBtn} onPress={resetCaptionPosition} hitSlop={16}>
              <FontAwesomeFreeSolid
                name="arrow-rotate-left"
                size={13}
                color={colors.primary}
              />
            </Pressable>
          </View>
        </View>

        {isVideo && (
          <EditorTabBar
            tabs={VIDEO_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        <ScrollView
          style={[s.panelScroll, !isVideo && s.panelScrollBorderTop]}
          contentContainerStyle={s.panelContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isVideo && activeTab === "trim" ? (
            <>
              <TrimPanel
                videoUri={pendingMedia.uri}
                player={videoPlayer}
                duration={videoDuration}
                onRangeChange={setTrimRange}
                playheadSV={playheadSV}
              />
              <View style={s.panelDivider} />
              <VolumePanel volume={volume} onVolumeChange={setVolume} />
            </>
          ) : (
            <>
              {!isVideo && (
                <>
                  <ClipDurationPicker
                    currentDuration={photoDuration}
                    maxDuration={30}
                    onDurationChange={setPhotoDuration}
                    label="Duration"
                    showSummary={false}
                  />
                  <View style={s.panelDivider} />
                </>
              )}
              <CaptionPanel
                value={captionText}
                onChange={setCaptionText}
                style={captionStyle}
                onStyleChange={setCaptionStyle}
                dateEnabled={dateStampEnabled}
                onDateToggle={setDateStampEnabled}
              />
            </>
          )}
        </ScrollView>

        <EditorActions
          onRetake={handleRetake}
          onSave={handleSave}
          isSaving={isSaving}
        />

        {isVideo && hasOverlay && exportFrame && (
          <View style={s.burnOffscreen} pointerEvents="none">
            <View ref={burnOverlayRef} collapsable={false}>
              <BurnOverlay
                width={exportFrame.width}
                height={exportFrame.height}
                scale={exportFrame.scale}
                captionText={captionText}
                captionPos={overlayCaptionPos}
                captionStyle={captionStyle}
                dateStampEnabled={dateStampEnabled}
                dateKey={dateKey}
                dateFormat={DATE_STAMP_FORMAT}
              />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  burnOffscreen: { position: "absolute", left: -100000, top: 0 },

  loadingRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing[3],
  },
  loadingText: { fontSize: fontSize.sm, color: colors.textSecondary },

  frameWrap: {
    alignItems: "center",
    paddingHorizontal: H_PAD,
    gap: 6,
  },
  dragHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: spacing[3],
  },
  dragHint: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontStyle: "italic",
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  dragHintHidden: {
    opacity: 0,
  },

  panelScroll: { flex: 1 },
  panelContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    gap: 0,
  },
  panelScrollBorderTop: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing[3],
  },
  panelDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[4],
  },
});
