import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, fontSize, spacing } from "@/theme";
import useEditorStore from "@/store/editor.store";
import useSettingsStore from "@/store/settings.store";
import { MediaFrame, frameSize } from "@/components/editor/MediaFrame";
import { CaptionPanel } from "@/components/editor/CaptionPanel";
import { TrimPanel } from "@/components/editor/TrimPanel";
import { VolumePanel } from "@/components/editor/VolumePanel";
import { DateStampOverlay } from "@/components/editor/DateStampOverlay";
import { DraggableCaption } from "@/components/editor/DraggableCaption";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { EditorTabBar } from "@/components/editor/EditorTabBar";
import { EditorActions } from "@/components/editor/EditorActions";
import { useEditorVideo } from "@/hooks/useEditorVideo";
import { useEditorSave } from "@/hooks/useEditorSave";
import { todayDateKey } from "@/utils/date";
import type {
  CaptionStyle,
  DateStampFormat,
  DateStampPosition,
  DateStampStyle,
} from "@/types";

type Tab = "trim" | "text";
type Fit = "landscape" | "portrait";

const H_PAD = 16;

const VIDEO_TABS = [
  { id: "trim" as Tab, icon: "scissors" as const, label: "Trim" },
  { id: "text" as Tab, icon: "pen" as const, label: "Text & Date" },
];

export default function EditorScreen() {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const frameRef = useRef<View>(null);

  const pendingMedia = useEditorStore((s) => s.pendingMedia);
  const setPendingMedia = useEditorStore((s) => s.setPendingMedia);
  const defaultAspectRatio = useSettingsStore((s) => s.defaultAspectRatio);
  const lastCaptionStyle = useSettingsStore((s) => s.lastCaptionStyle);
  const lastDateStampStyle = useSettingsStore((s) => s.lastDateStampStyle);
  const lastVolume = useSettingsStore((s) => s.lastVolume);
  const lastDateStampEnabled = useSettingsStore((s) => s.lastDateStampEnabled);
  const lastDateStampPosition = useSettingsStore(
    (s) => s.lastDateStampPosition,
  );
  const lastDateStampFormat = useSettingsStore((s) => s.lastDateStampFormat);

  const isVideo = pendingMedia?.type === "video";
  const initFit: Fit = defaultAspectRatio === "9:16" ? "portrait" : "landscape";

  const [activeTab, setActiveTab] = useState<Tab>("trim");
  const [captionText, setCaptionText] = useState("");
  const [captionStyle, setCaptionStyle] =
    useState<CaptionStyle>(lastCaptionStyle);
  const [dateStampStyle] = useState<DateStampStyle>(lastDateStampStyle);
  const [fit, setFit] = useState<Fit>(initFit);
  const [volume, setVolume] = useState(lastVolume);
  const [dateStampEnabled, setDateStampEnabled] =
    useState(lastDateStampEnabled);
  const [dateStampPosition] = useState<DateStampPosition>(
    lastDateStampPosition,
  );
  const [dateStampFormat] = useState<DateStampFormat>(lastDateStampFormat);

  const {
    videoPlayer,
    videoDuration,
    playheadTime,
    playheadSV,
    setTrimRange,
    handleSeek,
  } = useEditorVideo({
    isVideo,
    mediaUri: isVideo && !pendingMedia?.isLoading ? pendingMedia!.uri : null,
    volume,
  });

  const { handleSave, isSaving } = useEditorSave({
    frameRef,
    isVideo,
    captionStyle,
    dateStampStyle,
    volume,
    dateStampEnabled,
    dateStampPosition,
    dateStampFormat,
    onComplete: router.back,
  });

  useEffect(() => {
    if (!pendingMedia) router.back();
  }, []);

  const { width: frameW, height: frameH } = frameSize(
    defaultAspectRatio,
    screenW,
  );
  const dateKey = todayDateKey();
  const captionDragMode = activeTab === "text" && captionText.length > 0;

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
        <EditorHeader
          fit={fit}
          onBack={handleRetake}
          onToggleFit={() =>
            setFit((f) => (f === "landscape" ? "portrait" : "landscape"))
          }
        />

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
            />
            {dateStampEnabled && (
              <DateStampOverlay
                dateKey={dateKey}
                format={dateStampFormat}
                textColor={dateStampStyle.textColor}
                bgColor={dateStampStyle.bgColor}
              />
            )}
          </MediaFrame>

          {captionDragMode && (
            <Text style={s.dragHint}>Drag the text to reposition</Text>
          )}
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
                playhead={playheadTime}
                playheadSV={playheadSV}
                onSeek={handleSeek}
              />
              <View style={s.panelDivider} />
              <VolumePanel volume={volume} onVolumeChange={setVolume} />
            </>
          ) : (
            <CaptionPanel
              value={captionText}
              onChange={setCaptionText}
              style={captionStyle}
              onStyleChange={setCaptionStyle}
              dateEnabled={dateStampEnabled}
              onDateToggle={setDateStampEnabled}
            />
          )}
        </ScrollView>

        <EditorActions
          onRetake={handleRetake}
          onSave={handleSave}
          isSaving={isSaving}
        />
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
