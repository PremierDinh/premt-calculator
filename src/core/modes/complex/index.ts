import type { ComplexAppState, DisplayState, KeyContext, KeyId, ModeResult } from '../../types';
import { deleteAtCursor, insertAtCursor } from '../../../math/expression';
import { createEvalContext, evaluate } from '../../../math/evaluator';
import { formatValue } from '../../format';
import { toReal } from '../../../math/ast';

export function createComplexState(): ComplexAppState {
  return { expression: '', result: '', cursorPos: 0, showResult: false };
}

export function getComplexDisplay(state: ComplexAppState, ctx: KeyContext): DisplayState {
  return {
    lines: [
      { text: 'Complex', size: 'small' },
      { text: state.expression || '0', align: 'right' },
      ...(state.showResult ? [{ text: state.result, align: 'right' as const, size: 'large' as const }] : []),
    ],
    showShift: ctx.shiftActive,
  };
}

export function handleComplexKey(
  state: ComplexAppState,
  key: KeyId,
  ctx: KeyContext,
): { state: ComplexAppState; result: ModeResult } {
  const inserts: Partial<Record<KeyId, string>> = {
    ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
    FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9',
    DOT: '.', PLUS: '+', MINUS: '-', MULT: '*', DIV: '/',
    LPAREN: '(', RPAREN: ')', X: 'i', ANS: 'Ans',
    SIN: 're(', COS: 'im(', TAN: 'arg(', LOG: 'conj(', SQRT: 'polar(',
  };
  if (key === 'AC') return { state: createComplexState(), result: { handled: true } };
  if (key === 'DEL') {
    const { text, cursor } = deleteAtCursor(state.expression, state.cursorPos);
    return { state: { ...state, expression: text, cursorPos: cursor }, result: { handled: true } };
  }
  if (key === 'EXE') {
    try {
      const value = evaluate(state.expression || '0', createEvalContext({
        ans: ctx.ans, preAns: ctx.preAns, variables: ctx.variables, angleUnit: ctx.angleUnit,
        matrices: ctx.matrices, vectors: ctx.vectors,
      }));
      const formatted = formatValue(value, { ...ctx.settings, complexForm: ctx.settings.complexForm });
      return {
        state: { ...state, result: formatted, showResult: true },
        result: { handled: true, setAns: value.kind === 'complex' ? value : toReal(value) },
      };
    } catch {
      return { state: { ...state, result: 'Math ERROR', showResult: true }, result: { handled: true } };
    }
  }
  const insert = inserts[key];
  if (insert) {
    const { text, cursor } = insertAtCursor(state.expression, insert, state.cursorPos);
    return { state: { ...state, expression: text, cursorPos: cursor, showResult: false }, result: { handled: true } };
  }
  return { state, result: { handled: false } };
}
