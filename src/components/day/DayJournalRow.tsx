import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { colors } from "@/theme";

type Props = {
  text: string;
  isLoading: boolean;
  onPress: () => void;
};

export function DayJournalRow({ text, isLoading, onPress }: Props) {
  return (
    <Pressable style={s.journalRow} onPress={onPress}>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.placeholderPrimary} />
      ) : (
        <Text
          style={[s.journalText, !!text && s.journalTextFilled]}
          numberOfLines={2}
        >
          {text || "Tell today's story…"}
        </Text>
      )}
      <FontAwesomeFreeSolid
        name="edit"
        size={16}
        color={text ? colors.textSecondary : colors.placeholderPrimary}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  journalRow: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.bgSubtle,
    minHeight: 48,
  },
  journalText: {
    flex: 1,
    color: colors.placeholderPrimary,
    fontStyle: "italic",
    fontSize: 14,
    lineHeight: 20,
  },
  journalTextFilled: {
    color: colors.textPrimary,
    fontStyle: "normal",
  },
});
