import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialModeState } from '../../core/modes';
import { useCalculatorStore } from '../calculatorStore';

describe('calculatorStore', () => {
  beforeEach(() => {
    useCalculatorStore.setState({
      power: 'on',
      currentMode: 'calculate',
      shiftActive: false,
      alphaActive: false,
      overlay: 'none',
      history: [],
      ans: 0,
      modeState: createInitialModeState(),
    });
  });

  it('toggles shift', () => {
    useCalculatorStore.getState().pressKey('SHIFT');
    expect(useCalculatorStore.getState().shiftActive).toBe(true);
  });

  it('opens menu overlay with selection', () => {
    useCalculatorStore.getState().pressKey('MENU');
    const display = useCalculatorStore.getState().display;
    expect(display.overlay).toBe('menu');
    expect(display.lines.some((l) => l.text.startsWith('▶'))).toBe(true);
  });

  it('toggles fraction result to decimal with FORMAT (S⇔D)', () => {
    for (const key of ['ONE', 'DIV', 'TWO', 'EXE'] as const) {
      useCalculatorStore.getState().pressKey(key);
    }
    expect(useCalculatorStore.getState().modeState.calculate.result).toBe('1/2');

    useCalculatorStore.getState().pressKey('FORMAT');
    expect(useCalculatorStore.getState().settings.fractionOutput).toBe(false);
    expect(useCalculatorStore.getState().modeState.calculate.result).toBe('0.5');

    useCalculatorStore.getState().pressKey('FORMAT');
    expect(useCalculatorStore.getState().settings.fractionOutput).toBe(true);
    expect(useCalculatorStore.getState().modeState.calculate.result).toBe('1/2');
  });

  it('cycles number format with SHIFT+FORMAT', () => {
    useCalculatorStore.getState().pressKey('SHIFT');
    useCalculatorStore.getState().pressKey('FORMAT');
    expect(useCalculatorStore.getState().settings.numberFormat).toBe('fix');
    expect(useCalculatorStore.getState().shiftActive).toBe(false);
  });

  it('evaluates with SHIFT+( instead of inserting =', () => {
    for (const key of ['ONE', 'PLUS', 'ONE', 'EXE'] as const) {
      useCalculatorStore.getState().pressKey(key);
    }
    expect(useCalculatorStore.getState().modeState.calculate.result).toBe('2');

    useCalculatorStore.getState().pressKey('SHIFT');
    useCalculatorStore.getState().pressKey('LPAREN');
    expect(useCalculatorStore.getState().shiftActive).toBe(false);
    expect(useCalculatorStore.getState().modeState.calculate.result).toBe('2');
  });

  it('opens history overlay with SHIFT+CATALOG (LIST)', () => {
    for (const key of ['TWO', 'EXE'] as const) {
      useCalculatorStore.getState().pressKey(key);
    }
    useCalculatorStore.getState().pressKey('SHIFT');
    useCalculatorStore.getState().pressKey('CATALOG');
    const display = useCalculatorStore.getState().display;
    expect(display.overlay).toBe('history');
    expect(display.lines.some((l) => l.text.includes('2=2'))).toBe(true);
  });

  it('toggles mixed fraction form with SHIFT+×', () => {
    useCalculatorStore.getState().pressKey('SHIFT');
    useCalculatorStore.getState().pressKey('MULT');
    expect(useCalculatorStore.getState().settings.fractionForm).toBe('mixed');
    expect(useCalculatorStore.getState().shiftActive).toBe(false);
  });
});
