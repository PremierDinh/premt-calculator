import type { DisplayState, InequalityState, KeyContext, KeyId, ModeResult } from '../../types';
import { solveLinearInequality, solveQuadraticInequality, type InequalityKind } from '../../../math/equations';

export function createInequalityState(): InequalityState {
  return {
    screen: 'type',
    ineqType: 'linear',
    kind: '>',
    coefficients: ['1', '0'],
    coeffIndex: 0,
    inputBuffer: '',
    resultText: '',
  };
}

export function getInequalityDisplay(state: InequalityState): DisplayState {
  if (state.screen === 'type') {
    return { lines: [{ text: 'Inequality', size: 'small' }, { text: `▶ ${state.ineqType}` }, { text: '1:Linear 2:Quad', size: 'small' }] };
  }
  if (state.screen === 'kind') {
    return { lines: [{ text: `ax+b ${state.kind} 0`, size: 'small' }, { text: state.kind }, { text: '1:> 2:< 3:>= 4:<=', size: 'small' }] };
  }
  if (state.screen === 'input') {
    const labels = state.ineqType === 'linear' ? ['a', 'b'] : ['a', 'b', 'c'];
    return { lines: [{ text: `${labels[state.coeffIndex]}=?`, size: 'small' }, { text: state.inputBuffer || '0', align: 'right' }] };
  }
  return { lines: [{ text: state.resultText }] };
}

const KINDS: InequalityKind[] = ['>', '<', '>=', '<='];

export function handleInequalityKey(
  state: InequalityState,
  key: KeyId,
  _ctx: KeyContext,
): { state: InequalityState; result: ModeResult } {
  const nums: Partial<Record<KeyId, string>> = {
    ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
    FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9', DOT: '.',
  };
  if (key === 'AC') return { state: createInequalityState(), result: { handled: true } };

  if (state.screen === 'type') {
    if (key === 'ONE') return { state: { ...state, ineqType: 'linear', coefficients: ['1', '0'] }, result: { handled: true } };
    if (key === 'TWO') return { state: { ...state, ineqType: 'quadratic', coefficients: ['1', '0', '0'] }, result: { handled: true } };
    if (key === 'UP' || key === 'DOWN') {
      return { state: { ...state, ineqType: state.ineqType === 'linear' ? 'quadratic' : 'linear' }, result: { handled: true } };
    }
    if (key === 'EXE') return { state: { ...state, screen: 'kind' }, result: { handled: true } };
  }

  if (state.screen === 'kind') {
    if (key === 'ONE') return { state: { ...state, kind: '>' }, result: { handled: true } };
    if (key === 'TWO') return { state: { ...state, kind: '<' }, result: { handled: true } };
    if (key === 'THREE') return { state: { ...state, kind: '>=' }, result: { handled: true } };
    if (key === 'FOUR') return { state: { ...state, kind: '<=' }, result: { handled: true } };
    if (key === 'UP' || key === 'DOWN') {
      const i = KINDS.indexOf(state.kind);
      const next = KINDS[(i + (key === 'DOWN' ? 1 : -1) + 4) % 4];
      return { state: { ...state, kind: next }, result: { handled: true } };
    }
    if (key === 'EXE') return { state: { ...state, screen: 'input', coeffIndex: 0, inputBuffer: '' }, result: { handled: true } };
  }

  if (state.screen === 'input') {
    if (key === 'DEL') return { state: { ...state, inputBuffer: state.inputBuffer.slice(0, -1) }, result: { handled: true } };
    if (nums[key]) return { state: { ...state, inputBuffer: state.inputBuffer + nums[key] }, result: { handled: true } };
    if (key === 'MINUS' && !state.inputBuffer) return { state: { ...state, inputBuffer: '-' }, result: { handled: true } };
    if (key === 'EXE') {
      const coefficients = [...state.coefficients];
      coefficients[state.coeffIndex] = state.inputBuffer || '0';
      const done = state.coeffIndex >= coefficients.length - 1;
      if (!done) {
        return { state: { ...state, coefficients, coeffIndex: state.coeffIndex + 1, inputBuffer: '' }, result: { handled: true } };
      }
      const vals = coefficients.map((c) => parseFloat(c) || 0);
      const resultText = state.ineqType === 'linear'
        ? solveLinearInequality(vals[0], vals[1], state.kind)
        : solveQuadraticInequality(vals[0], vals[1], vals[2], state.kind);
      return { state: { ...state, coefficients, screen: 'result', resultText }, result: { handled: true } };
    }
  }

  return { state, result: { handled: false } };
}
