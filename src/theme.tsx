import { createContext, useContext, useMemo, type ReactNode } from "react";
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";
import { File, Paths } from "expo-file-system";
import { sage, themes, type Theme, type ThemeColors } from "./themes";

export type { ThemeColors } from "./themes";

export type ThemeName = "sage" | "vanilla" | "blossom" | "cotton" | "dusk";

export const THEME_ORDER: ThemeName[] = ["sage", "vanilla", "blossom", "cotton", "dusk"];

export const DEFAULT_THEME: ThemeName = "sage";

// Read straight off disk so the very first paint already uses the saved theme — the settings store
// hydrates asynchronously, which would otherwise flash the default palette on every launch.
export function readStoredTheme(): ThemeName {
  try {
    const file = new File(Paths.document, "app-settings.json");
    if (!file.exists) return DEFAULT_THEME;
    const stored = JSON.parse(file.textSync()) as { theme?: string };
    return stored.theme && themes[stored.theme] ? (stored.theme as ThemeName) : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

const ThemeContext = createContext<Theme>(themes[readStoredTheme()] ?? sage);

export function ThemeProvider({ name, children }: { name: ThemeName; children: ReactNode }) {
  const value = themes[name] ?? sage;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function useColors(): ThemeColors {
  return useContext(ThemeContext).colors;
}

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

// Turns a stylesheet into a hook, so its colours are rebuilt whenever the theme changes.
// Sizing tokens (radius/spacing/fontSize) stay importable as plain values — they're identical across themes.
export function makeStyles<T extends NamedStyles>(factory: (colors: ThemeColors) => T) {
  // Built once per palette and shared by every instance — a list of 300 day cells would otherwise
  // recompute the same stylesheet 300 times on each theme change. Bounded by the number of themes.
  const cache = new Map<ThemeColors, T>();
  return function useStyles(): T {
    const colors = useColors();
    return useMemo(() => {
      let styles = cache.get(colors);
      if (!styles) {
        styles = StyleSheet.create(factory(colors)) as T;
        cache.set(colors, styles);
      }
      return styles;
    }, [colors]);
  };
}

// Shared structural tokens — the same in every theme, so they stay static imports.
export const { radius, spacing, fontSize, fontWeight } = sage;

export default sage;
