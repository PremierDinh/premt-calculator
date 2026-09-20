import { describe, expect, it } from 'vitest';
import { createInitialModeState, handleModeKey } from '../index';
import { mockKeyContext } from '../../../test/helpers/keyContext';

const MODES = [
  'calculate', 'statistics', 'distribution', 'spreadsheet', 'table',
  'equation', 'inequality', 'complex', 'basen', 'matrix', 'vector', 'ratio', 'mathbox',
] as const;

describe('mode smoke', () => {
  it.each(MODES)('%s handles AC reset', (mode) => {
    const modeState = createInitialModeState();
    const { result } = handleModeKey(mode, modeState, 'AC', mockKeyContext());
    expect(result.handled).toBe(true);
  });

  it('calculate evaluates 2+3', () => {
    let modeState = createInitialModeState();
    for (const key of ['TWO', 'PLUS', 'THREE'] as const) {
      ({ modeState } = handleModeKey('calculate', modeState, key, mockKeyContext()));
    }
    const { modeState: after, result } = handleModeKey('calculate', modeState, 'EXE', mockKeyContext());
    expect(result.handled).toBe(true);
    expect(after.calculate.result).not.toBe('Math ERROR');
  });

  it('ratio rejects A=0', () => {
    let modeState = createInitialModeState();
    const steps: Array<[string, string]> = [['0', 'ZERO'], ['EXE', 'EXE'], ['4', 'FOUR'], ['EXE', 'EXE'], ['3', 'THREE'], ['EXE', 'EXE']];
    for (const [, key] of steps) {
      ({ modeState } = handleModeKey('ratio', modeState, key as never, mockKeyContext()));
    }
    expect(modeState.ratio.resultText).toContain('0');
  });
});
