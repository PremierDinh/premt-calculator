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
});
