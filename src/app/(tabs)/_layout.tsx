import { NativeTabs } from "expo-router/unstable-native-tabs";
import { colors } from "@/theme";

export default function TabsLayout() {
  return (
    <NativeTabs
      backgroundColor={colors.bgSubtle}
      iconColor={{ default: colors.textMuted, selected: colors.textPrimary }}
      indicatorColor={colors.border}
      rippleColor={colors.ripple}
      labelStyle={{ color: colors.textSecondary }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Label>Calendar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="gallery">
        <NativeTabs.Trigger.Label>Gallery</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="photo.on.rectangle.angled" md="photo_library" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
