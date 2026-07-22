import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { colors, fontSize, spacing } from "@/theme";

type FAIconName = React.ComponentProps<typeof FontAwesomeFreeSolid>["name"];

export type TabItem<T extends string> = {
  id: T;
  icon: FAIconName;
  label: string;
};

type Props<T extends string> = {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
};

export function EditorTabBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: Props<T>) {
  return (
    <View style={s.tabBar}>
      {tabs.map(({ id, icon, label }) => {
        const active = activeTab === id;
        return (
          <Pressable key={id} style={s.tabBtn} onPress={() => onTabChange(id)}>
            <FontAwesomeFreeSolid
              name={icon}
              size={14}
              color={active ? colors.primary : colors.textMuted}
            />
            <Text style={[s.tabLabel, active && s.tabLabelActive]}>
              {label}
            </Text>
            {active && <View style={s.tabIndicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
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
});
