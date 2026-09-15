import type { FontAwesomeFreeSolidIconName } from "@react-native-vector-icons/fontawesome-free-solid";

export type OnboardingSlide = {
  key: string;
  icon?: FontAwesomeFreeSolidIconName;
  useLogo?: boolean;
  title: string;
  body: string;
};

// One slide per major area of the app — shown in order on first launch, and replayable from Settings.
export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    key: "welcome",
    useLogo: true,
    title: "Welcome to Daylapse",
    body: "A photo or clip, a mood, a few lines — one small keeping for each day. Let's look around.",
  },
  {
    key: "home",
    icon: "house",
    title: "Home",
    body: "Your streak, today's status, and a quick way back into your last few days — all in one glance.",
  },
  {
    key: "calendar",
    icon: "calendar",
    title: "Calendar",
    body: "Every day you've kept lives here. Scroll back through the years, tap a day to open it, or press Play to watch a month unfold.",
  },
  {
    key: "capture",
    icon: "camera",
    title: "Capture a day",
    body: "Add a photo or clip from the in-app camera, choose a mood, and write a few lines in your journal.",
  },
  {
    key: "editor",
    icon: "crop-simple",
    title: "Shape the moment",
    body: "Frame it, add a caption or date stamp, trim a clip — then keep it exactly how you want to remember it.",
  },
  {
    key: "montages",
    icon: "clapperboard",
    title: "Montages",
    body: "Weave a run of days — a month, a year, any stretch you choose — into one video you can watch back.",
  },
  {
    key: "settings",
    icon: "gear",
    title: "Make it yours",
    body: "Pick a theme, set a daily reminder, choose your frame — Daylapse bends to how you keep your days.",
  },
  {
    key: "done",
    icon: "circle-check",
    title: "That's everything",
    body: "Find this tour again anytime in Settings. For now — go keep today.",
  },
];
