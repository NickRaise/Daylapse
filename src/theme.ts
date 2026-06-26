// ─── Active theme ────────────────────────────────────────────────────────────
// Change the import name to switch the whole app's theme:
//   sage | vanilla | blossom | cotton | dusk
import { sage as activeTheme } from "./themes";

export default activeTheme;

// Named re-exports so existing imports keep working:
//   import { colors } from '../theme'
export const { colors, radius, spacing, fontSize, fontWeight } = activeTheme;
