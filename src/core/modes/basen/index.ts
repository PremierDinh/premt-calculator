import type { BaseNBase, BaseNState, DisplayState, KeyContext, KeyId, ModeResult } from '../../types';
import { evaluateBaseExpression, formatBaseValue, parseBaseValue } from '../../../math/basen';

export function createBaseNState(): BaseNState {
  return { base: 10, expression: '', result: '' };
}

export function getBaseNDisplay(state: BaseNState): DisplayState {
  const names: Record<BaseNBase, string> = { 2: 'BIN', 8: 'OCT', 10: 'DEC', 16: 'HEX' };
  return {
    lines: [
      { text: `Base-N  ${names[state.base]}`, size: 'small' },
      { text: state.expression || '0', align: 'right' },
      { text: state.result || '', align: 'right', size: 'large' },
    ],
  };
}

export function handleBaseNKey(
  state: BaseNState,
  key: KeyId,
  _ctx: KeyContext,
): { state: BaseNState; result: ModeResult } {
  const hex: Partial<Record<KeyId, string>> = {
    ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
    FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9',
    SIN: 'A', COS: 'B', TAN: 'C', LOG: 'D', SQRT: 'E', X: 'F',
  };
  if (key === 'AC') return { state: createBaseNState(), result: { handled: true } };
  if (key === 'DEL') return { state: { ...state, expression: state.expression.slice(0, -1) }, result: { handled: true } };
  if (key === 'FORMAT' || key === 'FUNCTION') {
    const order: BaseNBase[] = [10, 16, 8, 2];
    const next = order[(order.indexOf(state.base) + 1) % order.length];
    try {
      const n = parseBaseValue(state.result || state.expression || '0', state.base);
      return { state: { ...state, base: next, result: formatBaseValue(n, next) }, result: { handled: true } };
    } catch {
      return { state: { ...state, base: next, result: '' }, result: { handled: true } };
    }
  }
  if (key === 'PLUS' || key === 'MINUS' || key === 'MULT' || key === 'DIV') {
    const op = { PLUS: '+', MINUS: '-', MULT: '*', DIV: '/' }[key];
    return { state: { ...state, expression: state.expression + op }, result: { handled: true } };
  }
  if (key === 'LPAREN' || key === 'RPAREN') {
    const ch = key === 'LPAREN' ? '(' : ')';
    return { state: { ...state, expression: state.expression + ch }, result: { handled: true } };
  }
  if (key === 'EXE') {
    try {
      const acc = evaluateBaseExpression(state.expression, state.base);
      return {
        state: { ...state, result: formatBaseValue(acc, state.base) },
        result: { handled: true, setAns: acc },
      };
    } catch {
      return { state: { ...state, result: 'ERROR' }, result: { handled: true } };
    }
  }
  const ch = hex[key];
  if (ch) {
    const allowed = '0123456789ABCDEF'.slice(0, state.base === 16 ? 16 : state.base);
    if (allowed.includes(ch)) {
      return { state: { ...state, expression: state.expression + ch, result: '' }, result: { handled: true } };
    }
  }
  return { state, result: { handled: false } };
}
