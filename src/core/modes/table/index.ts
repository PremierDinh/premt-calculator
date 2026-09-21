import type { DisplayState, KeyContext, KeyId, ModeResult, TableState } from '../../types';
import { DEFAULT_SETTINGS, type CalculatorSettings } from '../../settings';
import { createEvalContext, evaluateFunction } from '../../../math/evaluator';
import { formatNumber } from '../../format';

export function createTableState(): TableState {
  return {
    screen: 'func',
    functionExpr: '',
    start: '1',
    end: '5',
    step: '1',
    tableData: [],
    scrollIndex: 0,
    inputBuffer: '',
  };
}

function evalCtx(ctx: KeyContext) {
  return createEvalContext({
    ans: ctx.ans,
    preAns: ctx.preAns,
    variables: ctx.variables,
    angleUnit: ctx.angleUnit,
    matrices: ctx.matrices,
    vectors: ctx.vectors,
  });
}

const MAX_TABLE_ROWS = 50;

function generateTable(state: TableState, ctx: KeyContext): { x: number; fx: number }[] {
  const start = parseFloat(state.start) || 0;
  const end = parseFloat(state.end) || 0;
  const step = parseFloat(state.step) || 1;
  const data: { x: number; fx: number }[] = [];
  const env = evalCtx(ctx);

  if (step === 0) return data;

  if (step > 0) {
    for (let x = start; x <= end + 1e-10 && data.length < MAX_TABLE_ROWS; x += step) {
      try {
        data.push({ x, fx: evaluateFunction(state.functionExpr, x, env) });
      } catch {
        data.push({ x, fx: NaN });
      }
    }
  } else {
    for (let x = start; x >= end - 1e-10 && data.length < MAX_TABLE_ROWS; x += step) {
      try {
        data.push({ x, fx: evaluateFunction(state.functionExpr, x, env) });
      } catch {
        data.push({ x, fx: NaN });
      }
    }
  }
  return data;
}

export function getTableDisplay(state: TableState, settings: CalculatorSettings = DEFAULT_SETTINGS): DisplayState {
  switch (state.screen) {
    case 'func':
      return {
        lines: [
          { text: 'f(x)=', size: 'small' },
          { text: state.inputBuffer || state.functionExpr || '0', align: 'right' },
        ],
      };
    case 'start':
      return {
        lines: [
          { text: 'Start:', size: 'small' },
          { text: state.inputBuffer || state.start, align: 'right' },
        ],
      };
    case 'end':
      return {
        lines: [
          { text: 'End:', size: 'small' },
          { text: state.inputBuffer || state.end, align: 'right' },
        ],
      };
    case 'step':
      return {
        lines: [
          { text: 'Step:', size: 'small' },
          { text: state.inputBuffer || state.step, align: 'right' },
        ],
      };
    case 'table': {
      const row = state.tableData[state.scrollIndex];
      if (!row) return { lines: [{ text: 'No data' }] };
      const fxStr = Number.isNaN(row.fx) ? 'ERROR' : formatNumber(row.fx, settings);
      return {
        lines: [
          { text: `x=${formatNumber(row.x, settings)}`, size: 'small' },
          { text: `f(x)=${fxStr}`, align: 'right', size: 'large' },
          { text: `${state.scrollIndex + 1}/${state.tableData.length}`, size: 'small' },
        ],
      };
    }
    default:
      return { lines: [{ text: 'Table' }] };
  }
}

const SCREENS: TableState['screen'][] = ['func', 'start', 'end', 'step', 'table'];

export function handleTableKey(
  state: TableState,
  key: KeyId,
  ctx: KeyContext,
): { state: TableState; result: ModeResult } {
  const numKeys: Partial<Record<KeyId, string>> = {
    ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
    FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9', DOT: '.',
  };
  const alphaKeys: Partial<Record<KeyId, string>> = {
    X: 'x', POWER: '^', SQUARE: '²', SQRT: '√(',
    SIN: 'sin(', COS: 'cos(', TAN: 'tan(',
    PLUS: '+', MINUS: '-', MULT: '*', DIV: '/',
    LPAREN: '(', RPAREN: ')',
  };

  if (key === 'AC') return { state: createTableState(), result: { handled: true } };

  if (state.screen === 'table') {
    if (key === 'UP') {
      return {
        state: { ...state, scrollIndex: Math.max(0, state.scrollIndex - 1) },
        result: { handled: true },
      };
    }
    if (key === 'DOWN' || key === 'SCROLL') {
      return {
        state: {
          ...state,
          scrollIndex: Math.min(state.tableData.length - 1, state.scrollIndex + 1),
        },
        result: { handled: true },
      };
    }
    if (key === 'EXIT') {
      return { state: { ...state, screen: 'step', inputBuffer: state.step }, result: { handled: true } };
    }
    return { state, result: { handled: true } };
  }

  if (key === 'DEL') {
    return { state: { ...state, inputBuffer: state.inputBuffer.slice(0, -1) }, result: { handled: true } };
  }

  if (numKeys[key]) {
    return { state: { ...state, inputBuffer: state.inputBuffer + numKeys[key] }, result: { handled: true } };
  }

  if (alphaKeys[key] && state.screen === 'func') {
    return { state: { ...state, inputBuffer: state.inputBuffer + alphaKeys[key] }, result: { handled: true } };
  }

  if (key === 'MINUS' && state.inputBuffer === '' && state.screen !== 'func') {
    return { state: { ...state, inputBuffer: '-' }, result: { handled: true } };
  }

  if (key === 'EXE') {
    const val = state.inputBuffer;
    if (state.screen === 'func') {
      return {
        state: { ...state, functionExpr: val || state.functionExpr, screen: 'start', inputBuffer: state.start },
        result: { handled: true },
      };
    }
    if (state.screen === 'start') {
      return {
        state: { ...state, start: val || state.start, screen: 'end', inputBuffer: state.end },
        result: { handled: true },
      };
    }
    if (state.screen === 'end') {
      return {
        state: { ...state, end: val || state.end, screen: 'step', inputBuffer: state.step },
        result: { handled: true },
      };
    }
    if (state.screen === 'step') {
      const next = { ...state, step: val || state.step, inputBuffer: '' };
      const tableData = generateTable(next, ctx);
      return {
        state: { ...next, screen: 'table', tableData, scrollIndex: 0 },
        result: { handled: true },
      };
    }
  }

  if (key === 'EXIT' && state.screen !== 'func') {
    const idx = SCREENS.indexOf(state.screen);
    const prev = SCREENS[Math.max(0, idx - 1)];
    return { state: { ...state, screen: prev, inputBuffer: '' }, result: { handled: true } };
  }

  return { state, result: { handled: false } };
}
