import { beforeEach, describe, expect, it } from 'vitest';
import { useCalculatorStore } from '../calculatorStore';

describe('calculatorStore', () => {
  beforeEach(() => {
    useCalculatorStore.setState({
      power: 'on',
      currentMode: 'calculate',
      shiftActive: false,
      overlay: 'none',
      modeState: useCalculatorStore.getState().modeState,
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
});
