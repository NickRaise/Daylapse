import { colors } from "@/theme";
import { StyleSheet, Text, View } from "react-native";

export default function SuggestionSection({ dateKey }: { dateKey: string }) {
  return (
    <View style={styles.root}>
      {/*Render media taken today, if any */}
      {/* TODO: Implement logic to fetch and display media suggestions for the given dateKey. */}

      {/* Otherwise, render a no suggestion message */}
      <View>
        <Text style={styles.noSuggestionsText}>No suggestions for today.</Text>
        <Text style={styles.noSuggestionsText}>
          Add some media to get started!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
  },
  noSuggestionsText: {
    color: colors.placeholderSecondary,
    fontStyle: "italic",
    textAlign: "center",
  },
});
