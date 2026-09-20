import type { DisplayState, KeyContext, KeyId, ModeResult, RatioState } from '../../types';
import { formatNumber } from '../../format';

export function createRatioState(): RatioState {
  return { values: ['', '', '', ''], index: 0, inputBuffer: '', resultText: '', screen: 'input' };
}

export function getRatioDisplay(state: RatioState): DisplayState {
  const labels = ['A', 'B', 'C', 'X'];
  if (state.screen === 'result') {
    return { lines: [{ text: 'A:B = C:X', size: 'small' }, { text: state.resultText, align: 'right', size: 'large' }] };
  }
  return {
    lines: [
      { text: 'A:B = C:X', size: 'small' },
      { text: `${labels[state.index]}=${state.inputBuffer || state.values[state.index] || '?'}`, align: 'right' },
    ],
  };
}

export function handleRatioKey(
  state: RatioState,
  key: KeyId,
  ctx: KeyContext,
): { state: RatioState; result: ModeResult } {
  const nums: Partial<Record<KeyId, string>> = {
    ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
    FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9', DOT: '.',
  };
  if (key === 'AC') return { state: createRatioState(), result: { handled: true } };
  if (state.screen === 'input') {
    if (key === 'DEL') return { state: { ...state, inputBuffer: state.inputBuffer.slice(0, -1) }, result: { handled: true } };
    if (nums[key]) return { state: { ...state, inputBuffer: state.inputBuffer + nums[key] }, result: { handled: true } };
    if (key === 'EXE') {
      const values = [...state.values] as RatioState['values'];
      values[state.index] = state.inputBuffer;
      if (state.index < 2) {
        return { state: { ...state, values, index: state.index + 1, inputBuffer: '' }, result: { handled: true } };
      }
      const a = parseFloat(values[0]);
      const b = parseFloat(values[1]);
      const c = parseFloat(values[2]);
      if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) {
        return { state: { ...state, values, screen: 'result', resultText: 'Math ERROR' }, result: { handled: true } };
      }
      if (a === 0) {
        return { state: { ...state, values, screen: 'result', resultText: 'A cannot be 0' }, result: { handled: true } };
      }
      const x = (b * c) / a;
      return {
        state: { ...state, values, screen: 'result', resultText: `X=${formatNumber(x, ctx.settings)}` },
        result: { handled: true, setAns: x },
      };
    }
  }
  if (state.screen === 'result' && key === 'EXIT') {
    return { state: createRatioState(), result: { handled: true } };
  }
  return { state, result: { handled: false } };
}
