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
  faceColor: string;
  Component: ComponentType<EmojiProps>;
};

const MOODS: MoodConfig[] = [
  {
    key: "happy",
    label: "Happy",
    blobColor: colors.moodHappy,
    faceColor: "#FDE8A0",
    Component: HappyEmoji,
  },
  {
    key: "calm",
    label: "Calm",
    blobColor: colors.moodCalm,
    faceColor: "#D8E6C8",
    Component: CalmEmoji,
  },
  {
    key: "neutral",
    label: "Neutral",
    blobColor: colors.moodNeutral,
    faceColor: "#E8E5DA",
    Component: NeutralEmoji,
  },
  {
    key: "sad",
    label: "Sad",
    blobColor: colors.moodSad,
    faceColor: "#C8DDEF",
    Component: SadEmoji,
  },
  {
    key: "angry",
    label: "Angry",
    blobColor: colors.moodAngry,
    faceColor: "#F4B8B0",
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
        {MOODS.map(({ key, label, blobColor, faceColor, Component }) => {
          const selected = value === key;
          return (
            <TouchableOpacity
              key={key}
              style={s.item}
              onPress={() => handlePress(key)}
              activeOpacity={0.75}
            >
              <Component
                size={44}
                shadowColor={selected ? blobColor : "none"}
                faceColor={selected ? faceColor : "none"}
                ringColor={colors.textPrimary}
                dotColor={colors.textPrimary}
              />
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
  itemLabel: {
    fontFamily: "Caveat",
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  itemLabelSelected: {
    color: colors.textPrimary,
  },
});
