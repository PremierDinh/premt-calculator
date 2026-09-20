import type { DisplayState, KeyContext, KeyId, MatrixAppState, ModeResult } from '../../types';
import { det, formatMatrix, identity, inverse, matAdd, matMul, matSub, trace } from '../../../math/matrix';

export function createMatrixState(): MatrixAppState {
  return {
    screen: 'menu',
    target: 'MatA',
    rows: 2,
    cols: 2,
    editRow: 0,
    editCol: 0,
    inputBuffer: '',
    op: 'det',
    resultText: '',
  };
}

export function getMatrixDisplay(state: MatrixAppState, ctx: KeyContext): DisplayState {
  if (state.screen === 'menu') {
    return { lines: [{ text: 'Matrix', size: 'small' }, { text: `▶ ${state.target}` }, { text: '1:A 2:B 3:C EXE:edit', size: 'small' }] };
  }
  if (state.screen === 'size') {
    return { lines: [{ text: 'Size', size: 'small' }, { text: `${state.rows}×${state.cols}` }, { text: '▲▼ rows  ◀▶ cols', size: 'small' }] };
  }
  if (state.screen === 'edit') {
    const m = ctx.matrices[state.target] ?? identity(state.rows);
    return {
      lines: [
        { text: `${state.target}[${state.editRow + 1},${state.editCol + 1}]`, size: 'small' },
        { text: state.inputBuffer || String(m[state.editRow]?.[state.editCol] ?? 0), align: 'right' },
      ],
    };
  }
  if (state.screen === 'op') {
    return { lines: [{ text: 'Op', size: 'small' }, { text: state.op }, { text: '1:det 2:inv 3:tr 4:+ 5:- 6:×', size: 'small' }] };
  }
  return { lines: state.resultText.split('\n').map((text) => ({ text })) };
}

export function handleMatrixKey(
  state: MatrixAppState,
  key: KeyId,
  ctx: KeyContext,
): { state: MatrixAppState; result: ModeResult } {
  const nums: Partial<Record<KeyId, string>> = {
    ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
    FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9', DOT: '.',
  };
  if (key === 'AC') return { state: createMatrixState(), result: { handled: true } };

  if (state.screen === 'menu') {
    if (key === 'ONE') return { state: { ...state, target: 'MatA' }, result: { handled: true } };
    if (key === 'TWO') return { state: { ...state, target: 'MatB' }, result: { handled: true } };
    if (key === 'THREE') return { state: { ...state, target: 'MatC' }, result: { handled: true } };
    if (key === 'EXE') return { state: { ...state, screen: 'size' }, result: { handled: true } };
    if (key === 'FUNCTION') return { state: { ...state, screen: 'op' }, result: { handled: true } };
  }

  if (state.screen === 'size') {
    if (key === 'UP') return { state: { ...state, rows: Math.min(3, state.rows + 1) }, result: { handled: true } };
    if (key === 'DOWN') return { state: { ...state, rows: Math.max(1, state.rows - 1) }, result: { handled: true } };
    if (key === 'RIGHT') return { state: { ...state, cols: Math.min(3, state.cols + 1) }, result: { handled: true } };
    if (key === 'LEFT') return { state: { ...state, cols: Math.max(1, state.cols - 1) }, result: { handled: true } };
    if (key === 'EXE') {
      const existing = ctx.matrices[state.target];
      const data = existing && existing.length === state.rows && existing[0].length === state.cols
        ? existing
        : identity(Math.max(state.rows, state.cols)).slice(0, state.rows).map((r) => r.slice(0, state.cols));
      return {
        state: { ...state, screen: 'edit', editRow: 0, editCol: 0, inputBuffer: '' },
        result: { handled: true, setMatrix: { name: state.target, value: data } },
      };
    }
  }

  if (state.screen === 'edit') {
    if (key === 'DEL') return { state: { ...state, inputBuffer: state.inputBuffer.slice(0, -1) }, result: { handled: true } };
    if (nums[key]) return { state: { ...state, inputBuffer: state.inputBuffer + nums[key] }, result: { handled: true } };
    if (key === 'MINUS' && !state.inputBuffer) return { state: { ...state, inputBuffer: '-' }, result: { handled: true } };
    if (key === 'EXE' || key === 'RIGHT' || key === 'DOWN') {
      const m = (ctx.matrices[state.target] ?? identity(state.rows)).map((r) => [...r]);
      m[state.editRow][state.editCol] = parseFloat(state.inputBuffer || String(m[state.editRow][state.editCol]));
      let r = state.editRow;
      let c = state.editCol + 1;
      if (c >= state.cols) { c = 0; r++; }
      const done = r >= state.rows;
      return {
        state: {
          ...state,
          screen: done ? 'op' : 'edit',
          editRow: done ? 0 : r,
          editCol: done ? 0 : c,
          inputBuffer: '',
        },
        result: { handled: true, setMatrix: { name: state.target, value: m } },
      };
    }
  }

  if (state.screen === 'op') {
    if (key === 'ONE') return { state: { ...state, op: 'det' }, result: { handled: true } };
    if (key === 'TWO') return { state: { ...state, op: 'inv' }, result: { handled: true } };
    if (key === 'THREE') return { state: { ...state, op: 'tr' }, result: { handled: true } };
    if (key === 'FOUR') return { state: { ...state, op: 'add' }, result: { handled: true } };
    if (key === 'FIVE') return { state: { ...state, op: 'sub' }, result: { handled: true } };
    if (key === 'SIX') return { state: { ...state, op: 'mul' }, result: { handled: true } };
    if (key === 'EXE') {
      try {
        const a = ctx.matrices[state.target];
        const b = ctx.matrices.MatB;
        if (!a) throw new Error('empty');
        let resultText = '';
        if (state.op === 'det') resultText = String(parseFloat(det(a).toPrecision(8)));
        if (state.op === 'inv') resultText = formatMatrix(inverse(a));
        if (state.op === 'tr') resultText = String(parseFloat(trace(a).toPrecision(8)));
        if (state.op === 'add' && b) resultText = formatMatrix(matAdd(a, b));
        if (state.op === 'sub' && b) resultText = formatMatrix(matSub(a, b));
        if (state.op === 'mul' && b) resultText = formatMatrix(matMul(a, b));
        return { state: { ...state, screen: 'result', resultText }, result: { handled: true } };
      } catch {
        return { state: { ...state, screen: 'result', resultText: 'Math ERROR' }, result: { handled: true } };
      }
    }
  }

  if (state.screen === 'result' && key === 'EXIT') {
    return { state: { ...state, screen: 'op' }, result: { handled: true } };
  }
  return { state, result: { handled: false } };
}
