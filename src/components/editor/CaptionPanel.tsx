import { useState } from "react";
import { ScrollView, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/theme";
import type { CaptionPosition, CaptionSize, CaptionStyle, DateStampStyle } from "@/types";

export type { CaptionPosition, CaptionSize, CaptionStyle, DateStampStyle };

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_LEN = 120;
const SWATCH = 30;

// Curated palettes matched to the Sage/earthy design language
const TEXT_COLORS = [
  "#FFFFFF", "#F3E9D2", "#D4A373", "#CCD5AE",
  "#FAEDCD", "#FAD4C0", "#F4D35E", "#88A97A",
  "#8DA9C4", "#EC407A", "#AB47BC", "#E040FB",
  "#000000", "#3F3428", "#6F6558", "#9B9288",
];

const BG_PALETTE = [
  "#000000", "#3F3428", "#6F6558", "#D4A373",
  "#CCD5AE", "#8DA9C4", "#88A97A", "#D97A6C",
  "#EC407A", "#F4D35E", "#AB47BC", "#FFFFFF",
];

// ── 2-axis position picker ────────────────────────────────────────────────────
// Decomposes the 9-position string into independent H and V axes.
// Combining the two axes covers all 9 positions with just 6 buttons —
// the same model CSS justify-content + align-items uses.
function decomposePos(pos: CaptionPosition): { v: string; h: string } {
  const parts = pos.split("-");
  if (parts.length === 1) return { v: "center", h: "center" };
  return { v: parts[0], h: parts[1] };
}

function composePos(v: string, h: string): CaptionPosition {
  if (v === "center" && h === "center") return "center";
  return `${v}-${h}` as CaptionPosition;
}

function AlignmentPicker({ selected, onSelect }: {
  selected: CaptionPosition;
  onSelect: (p: CaptionPosition) => void;
}) {
  const { v, h } = decomposePos(selected);

  const hOptions = [
    { value: "left",   label: "Left"   },
    { value: "center", label: "Center" },
    { value: "right",  label: "Right"  },
  ];
  const vOptions = [
    { value: "top",    label: "Top"    },
    { value: "center", label: "Middle" },
    { value: "bottom", label: "Bottom" },
  ];

  return (
    <View style={ap.root}>
      <View style={ap.row}>
        {hOptions.map(({ value, label }) => {
          const active = h === value;
          return (
            <Pressable
              key={value}
              style={[ap.btn, active && ap.btnActive]}
              onPress={() => onSelect(composePos(v, value))}
            >
              <Text style={[ap.label, active && ap.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={ap.row}>
        {vOptions.map(({ value, label }) => {
          const active = v === value;
          return (
            <Pressable
              key={value}
              style={[ap.btn, active && ap.btnActive]}
              onPress={() => onSelect(composePos(value, h))}
            >
              <Text style={[ap.label, active && ap.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const ap = StyleSheet.create({
  root: { gap: spacing[2] },
  row: { flexDirection: "row", gap: spacing[2] },
  btn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
  },
  btnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  labelActive: { color: colors.textOnAccent },
});

// ── Color swatch ──────────────────────────────────────────────────────────────
function Swatch({
  color,
  selected,
  onPress,
  empty,
  children,
}: {
  color?: string;
  selected: boolean;
  onPress: () => void;
  empty?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Pressable hitSlop={4} onPress={onPress}>
      <View
        style={[
          sw.swatch,
          color ? { backgroundColor: color } : sw.swatchEmpty,
          selected && sw.swatchSelected,
          (color === "#FFFFFF" || empty) && sw.swatchBorder,
        ]}
      >
        {children}
      </View>
    </Pressable>
  );
}

const sw = StyleSheet.create({
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  swatchEmpty: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  swatchSelected: { borderWidth: 2.5, borderColor: colors.primary },
  swatchBorder: { borderWidth: 1, borderColor: colors.border },
});

// ── Main panel ────────────────────────────────────────────────────────────────
type Props = {
  value: string;
  onChange: (text: string) => void;
  style: CaptionStyle;
  onStyleChange: (s: CaptionStyle) => void;
  dateStyle: DateStampStyle;
  onDateStyleChange: (s: DateStampStyle) => void;
  isVideo?: boolean;
};

type ColorTarget = "caption" | "date";

export function CaptionPanel({ value, onChange, style, onStyleChange, dateStyle, onDateStyleChange, isVideo }: Props) {
  const [colorTarget, setColorTarget] = useState<ColorTarget>("caption");

  function update(patch: Partial<CaptionStyle>) {
    onStyleChange({ ...style, ...patch });
  }

  // Active colors depend on which overlay is being styled
  const activeTextColor = colorTarget === "caption" ? style.textColor : dateStyle.textColor;
  const activeBgColor   = colorTarget === "caption" ? style.bgColor   : dateStyle.bgColor;

  function handleTextColor(c: string) {
    if (colorTarget === "caption") update({ textColor: c });
    else onDateStyleChange({ ...dateStyle, textColor: c });
  }
  function handleBgColor(c: string) {
    if (colorTarget === "caption") update({ bgColor: c });
    else onDateStyleChange({ ...dateStyle, bgColor: c });
  }

  const bgPrefix = [
    <Swatch
      key="transparent"
      empty
      selected={activeBgColor === "transparent"}
      onPress={() => handleBgColor("transparent")}
    >
      <Text style={{ fontSize: 15, color: colors.error, fontWeight: "700", lineHeight: 18 }}>×</Text>
    </Swatch>,
    <Swatch
      key="half"
      color="#000000"
      selected={activeBgColor === "rgba(0,0,0,0.5)" || activeBgColor === "rgba(0,0,0,0.45)"}
      onPress={() => handleBgColor(colorTarget === "caption" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.45)")}
    >
      <Text style={{ fontSize: 8, color: "#fff", fontWeight: "700" }}>50%</Text>
    </Swatch>,
  ];

  return (
    <View style={s.root}>

      {/* ── Caption text input ──────────────────────────────────────────────── */}
      <TextInput
        style={s.input}
        value={value}
        onChangeText={(t) => onChange(t.slice(0, MAX_LEN))}
        placeholder="Write something on your memory…"
        placeholderTextColor={colors.placeholderSecondary}
        multiline
        maxLength={MAX_LEN}
        returnKeyType="done"
        blurOnSubmit
        textAlignVertical="top"
      />
      <View style={s.inputMeta}>
        <Text style={s.hint}>
          {isVideo ? "Appears on frame — drag to reposition" : "Burned into photo on save"}
        </Text>
        <Text style={s.counter}>{value.length}/{MAX_LEN}</Text>
      </View>

      {/* ── Style section ───────────────────────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>Style</Text>

        {/* Caption size — only applies to caption overlay */}
        <View style={s.sizeRow}>
          {(["sm", "md", "lg"] as CaptionSize[]).map((v, i) => {
            const active = style.size === v;
            return (
              <Pressable
                key={v}
                style={[s.sizeBtn, active && s.sizeBtnActive]}
                onPress={() => update({ size: v })}
              >
                <Text style={[s.sizeBtnLabel, active && s.sizeBtnLabelActive]}>
                  {(["S", "M", "L"] as const)[i]}
                </Text>
                <Text style={[s.sizeBtnSub, active && s.sizeBtnSubActive]}>
                  {(["Small", "Medium", "Large"] as const)[i]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Segment: which overlay's colors to edit */}
        <View style={s.segment}>
          {(["caption", "date"] as ColorTarget[]).map((target) => {
            const active = colorTarget === target;
            return (
              <Pressable
                key={target}
                style={[s.segBtn, active && s.segBtnActive]}
                onPress={() => setColorTarget(target)}
              >
                <Text style={[s.segLabel, active && s.segLabelActive]}>
                  {target === "caption" ? "Caption" : "Date stamp"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Shared color rows — edit whichever overlay is selected above */}
        <View style={s.colorRow}>
          <Text style={s.colorLabel}>Text</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.swatchStrip}>
            {TEXT_COLORS.map((c) => (
              <Swatch key={c} color={c} selected={activeTextColor === c} onPress={() => handleTextColor(c)} />
            ))}
          </ScrollView>
        </View>

        <View style={s.colorRow}>
          <Text style={s.colorLabel}>BG</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.swatchStrip}>
            {bgPrefix}
            {BG_PALETTE.map((c) => (
              <Swatch key={c} color={c} selected={activeBgColor === c} onPress={() => handleBgColor(c)} />
            ))}
          </ScrollView>
        </View>
      </View>

      {/* ── Caption position ─────────────────────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>Position</Text>
        <AlignmentPicker
          selected={style.position}
          onSelect={(p) => update({ position: p })}
        />
      </View>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { gap: spacing[4] },

  // Text input
  input: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.base,
    color: colors.textPrimary,
    minHeight: 72,
    lineHeight: 22,
  },
  inputMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: -spacing[2],
  },
  hint: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  counter: { fontSize: fontSize.xs, color: colors.textMuted },

  // Section
  section: { gap: spacing[3] },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },

  // Size buttons — stretch across full width with label + sublabel
  sizeRow: { flexDirection: "row", gap: spacing[2] },
  sizeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    gap: 2,
  },
  sizeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sizeBtnLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sizeBtnLabelActive: { color: colors.textOnAccent },
  sizeBtnSub: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.textMuted,
    lineHeight: 12,
  },
  sizeBtnSubActive: { color: colors.textOnAccentDim },

  // Overlay segment toggle
  segment: {
    flexDirection: "row",
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    gap: 3,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  segBtnActive: { backgroundColor: colors.primary },
  segLabel: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  segLabelActive: { color: colors.textOnAccent },

  // Color rows
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  colorLabel: {
    width: 30,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  swatchStrip: { gap: 6, paddingRight: 4 },
});
