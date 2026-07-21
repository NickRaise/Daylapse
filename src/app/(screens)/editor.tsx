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
import { useVideoPlayer } from "expo-video";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { colors, fontSize, radius, spacing } from "@/theme";
import useEditorStore from "@/store/editor.store";
import useEntryStore from "@/store/entry.store";
import useMediaStore from "@/store/media.store";
import useSettingsStore from "@/store/settings.store";
import { MediaRepository } from "@/repositories/media.repository";
import { mediaService } from "@/service/media.service";
import { MediaFrame, frameSize } from "@/components/editor/MediaFrame";
import { CaptionPanel } from "@/components/editor/CaptionPanel";
import { TrimPanel, type TrimRange } from "@/components/editor/TrimPanel";
import { VolumePanel } from "@/components/editor/VolumePanel";
import { DateStampControl } from "@/components/editor/DateStampControl";
import { DateStampOverlay } from "@/components/editor/DateStampOverlay";
import { DraggableCaption } from "@/components/editor/DraggableCaption";
import type { CaptionStyle, DateStampFormat, DateStampPosition, DateStampStyle } from "@/types";

// Video has 2 tabs: trim (includes volume) and text (includes date stamp).
// Photos skip the tab bar entirely — the text panel is always shown.
type Tab = "trim" | "text";
type Fit = "landscape" | "portrait";
type FAIconName = React.ComponentProps<typeof FontAwesomeFreeSolid>["name"];

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
  const keepOriginalPhoto = useSettingsStore((s) => s.keepOriginalPhoto);
  const defaultAspectRatio = useSettingsStore((s) => s.defaultAspectRatio);
  const setLastEditorPrefs = useSettingsStore((s) => s.setLastEditorPrefs);

  // Restored prefs — used as initial state so the editor opens with the
  // user's last-used settings. Defaults are only used on first-ever launch.
  const lastCaptionStyle = useSettingsStore((s) => s.lastCaptionStyle);
  const lastDateStampStyle = useSettingsStore((s) => s.lastDateStampStyle);
  const lastVolume = useSettingsStore((s) => s.lastVolume);
  const lastDateStampEnabled = useSettingsStore((s) => s.lastDateStampEnabled);
  const lastDateStampPosition = useSettingsStore((s) => s.lastDateStampPosition);
  const lastDateStampFormat = useSettingsStore((s) => s.lastDateStampFormat);

  const isVideo = pendingMedia?.type === "video";

  // Video player — always created (null source = no-op for photos)
  const videoPlayer = useVideoPlayer(
    isVideo && !pendingMedia?.isLoading ? pendingMedia!.uri : null,
    (p) => { p.loop = true; p.muted = false; },
  );

  const initFit: Fit = defaultAspectRatio === "9:16" ? "portrait" : "landscape";

  // All editor state initialised from stored prefs — no hard-coded defaults
  const [activeTab, setActiveTab] = useState<Tab>("trim");
  const [captionText, setCaptionText] = useState("");
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(lastCaptionStyle);
  const [dateStampStyle, setDateStampStyle] = useState<DateStampStyle>(lastDateStampStyle);
  const [fit, setFit] = useState<Fit>(initFit);
  const trimRangeRef = useRef<TrimRange>({ start: 0, end: 0 });
  const setTrimRange = (r: TrimRange) => { trimRangeRef.current = r; };
  const [videoDuration, setVideoDuration] = useState(0);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [volume, setVolume] = useState(lastVolume);
  const [dateStampEnabled, setDateStampEnabled] = useState(lastDateStampEnabled);
  const [dateStampPosition, setDateStampPosition] = useState<DateStampPosition>(lastDateStampPosition);
  const [dateStampFormat, setDateStampFormat] = useState<DateStampFormat>(lastDateStampFormat);
  const [isSaving, setIsSaving] = useState(false);

  // Apply volume to player whenever it changes
  useEffect(() => {
    if (isVideo) videoPlayer.volume = volume;
  }, [volume, isVideo, videoPlayer]);

  // Track video duration once the player is ready
  useEffect(() => {
    if (!isVideo) return;
    const sub = videoPlayer.addListener("statusChange", () => {
      const d = videoPlayer.duration;
      if (d > 0) {
        setVideoDuration(d);
        setTrimRange({ start: 0, end: d });
      }
    });
    return () => sub.remove();
  }, [isVideo, videoPlayer]);

  // Feed playhead position into the trim timeline
  useEffect(() => {
    if (!isVideo || !videoDuration) return;
    videoPlayer.timeUpdateEventInterval = 0.05;
    const sub = videoPlayer.addListener("timeUpdate", ({ currentTime }) => {
      setPlayheadTime(currentTime);
    });
    return () => sub.remove();
  }, [isVideo, videoPlayer, videoDuration]);

  const dateKey = todayDateKey();
  const { width: frameW, height: frameH } = frameSize(defaultAspectRatio, screenW);
  const captionDragMode = activeTab === "text" && captionText.length > 0;

  useEffect(() => {
    if (!pendingMedia) router.back();
  }, []);

  // Two tabs for video only — photos show the text panel directly.
  const videoTabs: { id: Tab; icon: FAIconName; label: string }[] = [
    { id: "trim", icon: "scissors",    label: "Trim" },
    { id: "text", icon: "pen",         label: "Text & Date" },
  ];

  function toggleFit() {
    setFit((f: Fit) => (f === "landscape" ? "portrait" : "landscape"));
  }

  async function handleSave() {
    if (!pendingMedia || isSaving) return;
    setIsSaving(true);
    try {
      let localUri: string;

      if (isVideo || keepOriginalPhoto) {
        localUri = await mediaService.copyMedia(pendingMedia.uri);
      } else {
        const capturedUri = await captureRef(frameRef, {
          format: "jpg",
          quality: 0.92,
          result: "tmpfile",
        });
        localUri = await mediaService.copyMedia(capturedUri);
      }

      if (saveToGallery) {
        await MediaLibrary.createAssetAsync(localUri);
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

      // Persist all editor prefs so next session opens with the same settings
      await setLastEditorPrefs({
        captionStyle,
        dateStampStyle,
        volume,
        dateStampEnabled,
        dateStampPosition,
        dateStampFormat,
      });

      setPendingMedia(null);
    } catch (err) {
      console.error("[editor] save failed:", err);
      setIsSaving(false);
      return;
    }

    router.back();
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

  // ── Panel content helpers ────────────────────────────────────────────────────

  // Caption + Date: shared between the photo single-panel and the video "Text" tab
  function renderTextPanel() {
    return (
      <>
        <DateStampControl
          enabled={dateStampEnabled}
          format={dateStampFormat}
          onToggle={setDateStampEnabled}
          onFormatChange={setDateStampFormat}
        />
        <View style={s.panelDivider} />
        <CaptionPanel
          value={captionText}
          onChange={setCaptionText}
          style={captionStyle}
          onStyleChange={setCaptionStyle}
          dateStyle={dateStampStyle}
          onDateStyleChange={setDateStampStyle}
          isVideo={isVideo}
        />
      </>
    );
  }

  // Trim + Volume: video "Trim" tab
  function renderTrimPanel() {
    if (!pendingMedia) return null;
    return (
      <>
        <TrimPanel
          videoUri={pendingMedia.uri}
          player={videoPlayer}
          duration={videoDuration}
          onRangeChange={setTrimRange}
          playhead={playheadTime}
          onSeek={setPlayheadTime}
        />
        <View style={s.panelDivider} />
        <VolumePanel volume={volume} onVolumeChange={setVolume} />
      </>
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

          <Pressable style={s.orientBtn} onPress={toggleFit} hitSlop={8}>
            <FontAwesomeFreeSolid
              name={fit === "portrait" ? "mobile-screen" : "mobile-screen-button"}
              size={15}
              color={colors.textSecondary}
            />
            <Text style={s.orientLabel}>
              {fit === "portrait" ? "Portrait" : "Landscape"}
            </Text>
          </Pressable>
        </View>

        {/* ── Media Frame ── */}
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

        {/* ── Tab bar (video only) ── */}
        {isVideo && (
          <View style={s.tabBar}>
            {videoTabs.map(({ id, icon, label }) => {
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
        )}

        {/* ── Panel ── */}
        <ScrollView
          style={[s.panelScroll, !isVideo && s.panelScrollBorderTop]}
          contentContainerStyle={s.panelContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isVideo
            ? activeTab === "trim"
              ? renderTrimPanel()
              : renderTextPanel()
            : renderTextPanel()
          }
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
  tabLabel: { fontSize: 11, fontWeight: "500", color: colors.textMuted },
  tabLabelActive: { color: colors.primary, fontWeight: "600" },
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
