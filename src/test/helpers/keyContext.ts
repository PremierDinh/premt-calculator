import type { KeyContext } from '../../core/types';
import { DEFAULT_SETTINGS } from '../../core/settings';

export function mockKeyContext(partial?: Partial<KeyContext>): KeyContext {
  return {
    shiftActive: false,
    alphaActive: false,
    angleUnit: 'deg',
    ans: 0,
    preAns: 0,
    variables: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, x: 0, y: 0, z: 0 },
    matrices: {},
    vectors: {},
    numberFormat: 'norm',
    settings: { ...DEFAULT_SETTINGS },
    history: [],
    language: 'vi',
    ...partial,
  };
}
