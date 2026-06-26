export type { Theme, ThemeColors } from './types';
export { sage }    from './sage';
export { vanilla } from './vanilla';
export { blossom } from './blossom';
export { cotton }  from './cotton';
export { dusk }    from './dusk';

import { sage }    from './sage';
import { vanilla } from './vanilla';
import { blossom } from './blossom';
import { cotton }  from './cotton';
import { dusk }    from './dusk';
import type { Theme } from './types';

export const themes: Record<string, Theme> = {
  sage,
  vanilla,
  blossom,
  cotton,
  dusk,
};
