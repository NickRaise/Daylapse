import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { colors, fontSize, radius, spacing } from "../../theme";

type Props = {
  visible: boolean;
  value: string;
  onChange: (text: string) => void;
  onClose: () => void;
  dateLabel?: string;
};

export function JournalEditor({
  visible,
  value,
  onChange,
  onClose,
  dateLabel,
}: Props) {
  const insets = useSafeAreaInsets();

  const historyRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (visible) {
      historyRef.current = [value];
      indexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [visible]);

  function handleTextChange(text: string) {
    onChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const pruned = historyRef.current
        .slice(0, indexRef.current + 1)
        .concat(text);
      historyRef.current = pruned.length > 50 ? pruned.slice(-50) : pruned;
      indexRef.current = historyRef.current.length - 1;
      setCanUndo(indexRef.current > 0);
      setCanRedo(false);
    }, 600);
  }

  function handleUndo() {
    if (indexRef.current <= 0) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    indexRef.current--;
    onChange(historyRef.current[indexRef.current]);
    setCanUndo(indexRef.current > 0);
    setCanRedo(true);
  }

  function handleRedo() {
    if (indexRef.current >= historyRef.current.length - 1) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    indexRef.current++;
    onChange(historyRef.current[indexRef.current]);
    setCanUndo(true);
    setCanRedo(indexRef.current < historyRef.current.length - 1);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[s.modalWrap, { paddingTop: insets.top + 10 }]}>
      <View style={s.root}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={onClose}
            style={s.headerSide}
            activeOpacity={0.7}
          >
            <FontAwesomeFreeSolid
              name="chevron-down"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={s.headerCenter}>
            <Text style={s.headerLabel}>Journal</Text>
            {dateLabel ? <Text style={s.headerDate}>{dateLabel}</Text> : null}
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={s.headerSide}
            activeOpacity={0.7}
          >
            <Text style={s.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Editor + toolbar pushed up by keyboard */}
        <KeyboardAvoidingView
          style={s.editorArea}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TextInput
            style={s.input}
            multiline
            autoFocus
            value={value}
            onChangeText={handleTextChange}
            placeholder="Tell today's story…"
            placeholderTextColor={colors.placeholderPrimary}
            textAlignVertical="top"
            scrollEnabled
          />

          <View
            style={[s.toolbar, { paddingBottom: insets.bottom + spacing[2] }]}
          >
            <View style={s.toolbarActions}>
              <TouchableOpacity
                onPress={handleUndo}
                disabled={!canUndo}
                style={s.toolbarBtn}
                activeOpacity={0.6}
              >
                <FontAwesomeFreeSolid
                  name="undo"
                  size={14}
                  color={canUndo ? colors.textSecondary : colors.textDisabled}
                />
                <Text style={[s.toolbarLabel, !canUndo && s.toolbarLabelOff]}>
                  Undo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRedo}
                disabled={!canRedo}
                style={s.toolbarBtn}
                activeOpacity={0.6}
              >
                <FontAwesomeFreeSolid
                  name="redo"
                  size={14}
                  color={canRedo ? colors.textSecondary : colors.textDisabled}
                />
                <Text style={[s.toolbarLabel, !canRedo && s.toolbarLabelOff]}>
                  Redo
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={s.charCount}>{value.length} chars</Text>
          </View>
        </KeyboardAvoidingView>
      </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalWrap: {
    flex: 1,
    backgroundColor: "transparent",
  },
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerSide: {
    minWidth: 60,
  },
  headerCenter: {
    alignItems: "center",
    gap: 2,
  },
  headerLabel: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  headerDate: {
    fontSize: fontSize.xs,
    fontWeight: "400",
    color: colors.textMuted,
  },
  doneText: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.primary,
    textAlign: "right",
  },
  editorArea: {
    flex: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
    fontSize: fontSize.base,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  toolbarActions: {
    flexDirection: "row",
    gap: spacing[6],
  },
  toolbarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  toolbarLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  toolbarLabelOff: {
    color: colors.textDisabled,
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
