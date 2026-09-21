import { describe, expect, it } from 'vitest';
import { applyCatalogItem, getCatalog, getTools } from '../catalog';
import { createInitialModeState } from '../modes';

describe('catalog', () => {
  it('returns mode-specific catalog groups', () => {
    expect(getCatalog('table', 'en')[0]?.items.length).toBeGreaterThan(0);
    expect(getCatalog('equation', 'vi')[0]?.items.some((i) => i.insert === '__EQN_QUAD__')).toBe(true);
    expect(getTools('statistics', 'en').length).toBeGreaterThan(1);
  });

  it('switches equation type from catalog action', () => {
    const modeState = createInitialModeState();
    const result = applyCatalogItem('equation', modeState, '__EQN_SIMUL__');
    expect(result.kind).toBe('modeState');
    if (result.kind === 'modeState') {
      expect(result.modeState.equation.eqnType).toBe('simultaneous');
      expect(result.modeState.equation.screen).toBe('input');
    }
  });

  it('prepares table sample range', () => {
    const modeState = createInitialModeState();
    const result = applyCatalogItem('table', modeState, '__TABLE_RANGE1__');
    expect(result.kind).toBe('modeState');
    if (result.kind === 'modeState') {
      expect(result.modeState.table.start).toBe('1');
      expect(result.modeState.table.end).toBe('5');
    }
  });
});
