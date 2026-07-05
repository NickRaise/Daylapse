import { ComponentType } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, fontSize, spacing } from "../../theme";
import {
  HappyEmoji,
  CalmEmoji,
  NeutralEmoji,
  SadEmoji,
  AngryEmoji,
  type EmojiProps,
} from "../../data/emoji";

export type Mood = "happy" | "calm" | "neutral" | "sad" | "angry";

type MoodConfig = {
  key: Mood;
  label: string;
  blobColor: string;
  Component: ComponentType<EmojiProps>;
};

const MOODS: MoodConfig[] = [
  {
    key: "happy",
    label: "Happy",
    blobColor: colors.moodHappy,
    Component: HappyEmoji,
  },
  {
    key: "calm",
    label: "Calm",
    blobColor: colors.moodCalm,
    Component: CalmEmoji,
  },
  {
    key: "neutral",
    label: "Neutral",
    blobColor: colors.moodNeutral,
    Component: NeutralEmoji,
  },
  { key: "sad", label: "Sad", blobColor: colors.moodSad, Component: SadEmoji },
  {
    key: "angry",
    label: "Angry",
    blobColor: colors.moodAngry,
    Component: AngryEmoji,
  },
];

type Props = {
  value: Mood | null;
  onChange: (mood: Mood | null) => void;
};

export function MoodPicker({ value, onChange }: Props) {
  function handlePress(key: Mood) {
    onChange(value === key ? null : key);
  }

  return (
    <View style={s.root}>
      <Text style={s.heading}>How are you feeling?</Text>
      <View style={s.row}>
        {MOODS.map(({ key, label, blobColor, Component }) => {
          const selected = value === key;
          return (
            <TouchableOpacity
              key={key}
              style={s.item}
              onPress={() => handlePress(key)}
              activeOpacity={0.75}
            >
              <View style={[s.faceWrap, selected && { borderColor: blobColor }]}>
                <Component size={44} blobColor={blobColor} />
              </View>
              <Text style={[s.itemLabel, selected && s.itemLabelSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    width: "85%",
    gap: spacing[3],
  },
  heading: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  item: {
    alignItems: "center",
    gap: spacing[1],
  },
  faceWrap: {
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: "transparent",
    padding: 2,
  },
  itemLabel: {
    fontFamily: "Caveat",
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  itemLabelSelected: {
    color: colors.textPrimary,
  },
});
