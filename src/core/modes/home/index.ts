import type { DisplayState, HomeMenuItem, HomeState, KeyContext, KeyId, ModeId, ModeResult } from '../../types';
import { modeLabel } from '../../../i18n/strings';

export const HOME_MODE_IDS: ModeId[] = [
  'calculate', 'statistics', 'distribution',
  'spreadsheet', 'table', 'equation',
  'inequality', 'complex', 'basen',
  'matrix', 'vector', 'ratio',
  'mathbox',
];

export function getHomeItems(lang: KeyContext['language']): HomeMenuItem[] {
  return HOME_MODE_IDS.map((id) => ({
    id,
    label: modeLabel(lang, id),
    icon: id,
  }));
}

export function createHomeState(): HomeState {
  return { selectedIndex: 0, scrollRow: 0 };
}

export function getHomeDisplay(state: HomeState, ctx: KeyContext): DisplayState {
  return {
    lines: [],
    showHome: true,
    menuItems: getHomeItems(ctx.language),
    selectedMenuIndex: state.selectedIndex,
  };
}

export function handleHomeKey(
  state: HomeState,
  key: KeyId,
  _ctx: KeyContext,
): { state: HomeState; result: ModeResult } {
  const cols = 3;
  const total = HOME_MODE_IDS.length;
  const row = Math.floor(state.selectedIndex / cols);
  const col = state.selectedIndex % cols;

  if (key === 'UP' || (key === 'SCROLL' && state.selectedIndex > 0)) {
    const newRow = Math.max(0, row - 1);
    return { state: { selectedIndex: newRow * cols + col, scrollRow: newRow }, result: { handled: true } };
  }
  if (key === 'DOWN' || key === 'SCROLL') {
    const idx = Math.min(total - 1, (row + 1) * cols + col);
    return { state: { selectedIndex: idx, scrollRow: Math.floor(idx / cols) }, result: { handled: true } };
  }
  if (key === 'LEFT') {
    return { state: { ...state, selectedIndex: Math.max(0, state.selectedIndex - 1) }, result: { handled: true } };
  }
  if (key === 'RIGHT') {
    return { state: { ...state, selectedIndex: Math.min(total - 1, state.selectedIndex + 1) }, result: { handled: true } };
  }
  if (key === 'OK' || key === 'EXE') {
    const mode = HOME_MODE_IDS[state.selectedIndex];
    if (mode) return { state, result: { handled: true, switchMode: mode } };
  }

  const numMap: Partial<Record<KeyId, number>> = {
    ONE: 0, TWO: 1, THREE: 2, FOUR: 3, FIVE: 4, SIX: 5,
    SEVEN: 6, EIGHT: 7, NINE: 8,
  };
  if (key in numMap) {
    const idx = numMap[key]!;
    if (idx < total) return { state: { selectedIndex: idx, scrollRow: Math.floor(idx / cols) }, result: { handled: true } };
  }

  return { state, result: { handled: false } };
}
