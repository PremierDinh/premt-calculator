import type { CalculateState, DisplayState, KeyContext, KeyId, ModeResult, VariableName } from '../../types';
import { deleteAtCursor, insertAtCursor } from '../../../math/expression';
import { createEvalContext, evaluate } from '../../../math/evaluator';
import { formatValue } from '../../format';
import { t } from '../../../i18n/strings';
import { toReal } from '../../../math/ast';

const VARS: VariableName[] = ['A', 'B', 'C', 'D', 'E', 'F', 'x', 'y', 'z'];

export function createCalculateState(): CalculateState {
  return {
    expression: '',
    result: '',
    cursorPos: 0,
    showResult: false,
    variableMode: 'none',
    selectedVar: null,
    historyIndex: -1,
    insertMode: false,
  };
}

export function getCalculateDisplay(state: CalculateState, ctx: KeyContext): DisplayState {
  const lines: DisplayState['lines'] = [];
  if (state.variableMode !== 'none') {
    lines.push({
      text: state.variableMode === 'sto' ? t(ctx.language, 'sto') : t(ctx.language, 'rcl'),
      size: 'small',
    });
    lines.push({ text: state.selectedVar ?? 'A' });
    return { lines, showShift: ctx.shiftActive, showAlpha: ctx.alphaActive };
  }
  const expr = state.expression || '0';
  const cursor = Math.min(state.cursorPos, expr.length);
  const withCursor = `${expr.slice(0, cursor)}▌${expr.slice(cursor)}`;
  lines.push({ text: withCursor, align: 'right' });
  if (state.showResult && state.result) {
    lines.push({ text: state.result, align: 'right', size: 'large' });
  }
  return { lines, showShift: ctx.shiftActive, showAlpha: ctx.alphaActive };
}

const KEY_INSERT: Partial<Record<KeyId, string>> = {
  ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
  FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9',
  DOT: '.', PLUS: '+', MINUS: '-', MULT: '×', DIV: '÷',
  LPAREN: '(', RPAREN: ')', POWER: '^', SQUARE: '^2',
  SIN: 'sin(', COS: 'cos(', TAN: 'tan(', LOG: 'log(',
  SQRT: 'sqrt(', X: 'x', ANS: 'Ans', FRAC: '/', EXP10: '*10^',
  FUNCTION: 'f(',
};

const SHIFT_INSERT: Partial<Record<KeyId, string>> = {
  SQRT: 'root(', POWER: '^(-1)', SQUARE: 'log(',
  LOG: 'ln(', ANS: 'PreAns', SIN: 'asin(', COS: 'acos(', TAN: 'atan(',
  SEVEN: 'pi', EIGHT: 'e', NINE: 'i',
  LPAREN: '=', RPAREN: ',', FRAC: '0.', FUNCTION: 'd(',
  DIV: '%', MINUS: '(-', PLUS: 'dms(',
};

const ALPHA_INSERT: Partial<Record<KeyId, string>> = {
  FOUR: 'A', FIVE: 'B', SIX: 'C',
  ONE: 'D', TWO: 'E', THREE: 'F',
  ZERO: 'x', DOT: 'y', EXP10: 'z',
  X: 'x',
};

function evalCtx(ctx: KeyContext) {
  return createEvalContext({
    ans: ctx.ans,
    preAns: ctx.preAns,
    variables: ctx.variables,
    matrices: ctx.matrices,
    vectors: ctx.vectors,
    angleUnit: ctx.angleUnit,
  });
}

export function handleCalculateKey(
  state: CalculateState,
  key: KeyId,
  ctx: KeyContext,
): { state: CalculateState; result: ModeResult } {
  if (state.variableMode !== 'none') {
    const varKeys: Partial<Record<KeyId, VariableName>> = {
      FOUR: 'A', FIVE: 'B', SIX: 'C',
      ONE: 'D', TWO: 'E', THREE: 'F',
      ZERO: 'x', DOT: 'y', EXP10: 'z',
    };
    if (key in varKeys) {
      const v = varKeys[key] as VariableName;
      if (state.variableMode === 'sto') {
        return {
          state: { ...state, variableMode: 'none', selectedVar: null },
          result: { handled: true, setVariable: { name: v, value: ctx.ans } },
        };
      }
      const insert = String(ctx.variables[v]);
      const { text, cursor } = insertAtCursor(state.expression, insert, state.cursorPos, state.insertMode && insert.length === 1);
      return {
        state: { ...state, expression: text, cursorPos: cursor, variableMode: 'none' },
        result: { handled: true },
      };
    }
    if (key === 'UP' || key === 'DOWN') {
      const order: VariableName[] = ['A', 'B', 'C', 'D', 'E', 'F', 'x', 'y', 'z'];
      const idx = Math.max(0, order.indexOf(state.selectedVar ?? 'A'));
      const next = order[(idx + (key === 'DOWN' ? 1 : -1) + order.length) % order.length];
      return { state: { ...state, selectedVar: next }, result: { handled: true } };
    }
    if (key === 'AC') return { state: createCalculateState(), result: { handled: true } };
    return { state, result: { handled: true } };
  }

  if (key === 'AC') return { state: createCalculateState(), result: { handled: true } };

  if (key === 'X' && ctx.shiftActive) {
    const payload = state.showResult && state.result && state.result !== 'Math ERROR'
      ? `${state.expression}=${state.result}`
      : state.expression
        ? `${state.expression}=Ans`
        : `Ans=${ctx.ans}`;
    return { state, result: { handled: true, consumeShift: true, openQr: true, qrPayload: payload.slice(0, 200) } };
  }

  if (key === 'EXE' && ctx.shiftActive) {
    return { state, result: { handled: true, consumeShift: true, toggleApprox: true } };
  }

  if (key === 'DEL' && ctx.shiftActive) {
    return {
      state: { ...state, insertMode: !state.insertMode },
      result: { handled: true, consumeShift: true },
    };
  }

  if ((key === 'UP' || key === 'DOWN' || key === 'PAGEUP' || key === 'PAGEDOWN') && ctx.history.length) {
    const goingUp = key === 'UP' || key === 'PAGEUP';
    const next = state.historyIndex < 0
      ? (goingUp ? ctx.history.length - 1 : -1)
      : state.historyIndex + (goingUp ? -1 : 1);
    const idx = Math.max(-1, Math.min(ctx.history.length - 1, next === ctx.history.length ? -1 : next));
    if (idx < 0) {
      return { state: { ...state, expression: '', cursorPos: 0, showResult: false, historyIndex: -1 }, result: { handled: true } };
    }
    const item = ctx.history[idx];
    return {
      state: {
        ...state,
        expression: item.expression,
        result: item.result,
        cursorPos: item.expression.length,
        showResult: true,
        historyIndex: idx,
      },
      result: { handled: true },
    };
  }

  if (key === 'DEL') {
    const { text, cursor } = deleteAtCursor(state.expression, state.cursorPos);
    return { state: { ...state, expression: text, cursorPos: cursor, showResult: false }, result: { handled: true } };
  }

  if (key === 'EXE') {
    try {
      const value = evaluate(state.expression || 'Ans', evalCtx(ctx));
      const formatted = formatValue(value, ctx.settings);
      const num = value.kind === 'real' || value.kind === 'fraction' || (value.kind === 'complex' && Math.abs(value.im) < 1e-12)
        ? toReal(value)
        : ctx.ans;
      return {
        state: { ...state, result: formatted, showResult: true, historyIndex: -1 },
        result: {
          handled: true,
          setAns: value,
          addHistory: { expression: state.expression, result: formatted, value: num },
        },
      };
    } catch {
      return { state: { ...state, result: 'Math ERROR', showResult: true }, result: { handled: true } };
    }
  }

  if (key === 'VARIABLE') {
    return {
      state: { ...state, variableMode: ctx.shiftActive ? 'rcl' : 'sto', selectedVar: 'A' },
      result: { handled: true, consumeShift: true },
    };
  }

  if (key === 'LEFT') {
    return { state: { ...state, cursorPos: Math.max(0, state.cursorPos - 1) }, result: { handled: true } };
  }
  if (key === 'RIGHT') {
    return { state: { ...state, cursorPos: Math.min(state.expression.length, state.cursorPos + 1) }, result: { handled: true } };
  }

  const insertMap = ctx.alphaActive ? ALPHA_INSERT : ctx.shiftActive ? SHIFT_INSERT : KEY_INSERT;
  const insert = insertMap[key];
  if (insert) {
    const { text, cursor } = insertAtCursor(
      state.expression,
      insert,
      state.cursorPos,
      state.insertMode && insert.length === 1,
    );
    return {
      state: { ...state, expression: text, cursorPos: cursor, showResult: false },
      result: { handled: true, consumeShift: ctx.shiftActive, consumeAlpha: ctx.alphaActive },
    };
  }

  return { state, result: { handled: false } };
}

export { VARS };
