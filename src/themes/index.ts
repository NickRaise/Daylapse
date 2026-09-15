export type { Theme, ThemeColors } from './types';
export { sage }    from './sage';
export { vanilla } from './vanilla';
export { blossom } from './blossom';
export { olive }   from './olive';
export { dusk }    from './dusk';

import { sage }    from './sage';
import { vanilla } from './vanilla';
import { blossom } from './blossom';
import { olive }   from './olive';
import { dusk }    from './dusk';
import type { Theme } from './types';

export const themes: Record<string, Theme> = {
  sage,
  vanilla,
  blossom,
  olive,
  dusk,
};
