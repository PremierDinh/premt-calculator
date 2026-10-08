import type { DisplayState, KeyContext, KeyId, MatrixAppState, ModeResult } from '../../types';
import { det, identity, inverse, matAdd, matMul, matSub, trace, transpose, type Matrix } from '../../../math/matrix';
import { formatNumber } from '../../format';
import { prefersMathInput } from '../../settings';

type MatName = MatrixAppState['target'];
type MatOp = MatrixAppState['op'];

const OPS: MatOp[] = ['det', 'inv', 'tr', 'add', 'sub', 'mul', 'trn'];
const OP_KEYS: Partial<Record<KeyId, MatOp>> = {
  ONE: 'det', TWO: 'inv', THREE: 'tr', FOUR: 'add', FIVE: 'sub', SIX: 'mul', SEVEN: 'trn',
};

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

function secondOperand(target: MatName): MatName {
  return target === 'MatB' ? 'MatA' : 'MatB';
}

function opLabel(op: MatOp, target: MatName): string {
  const b = secondOperand(target);
  switch (op) {
    case 'det': return `det(${target})`;
    case 'inv': return `${target}⁻¹`;
    case 'tr': return `Trace(${target})`;
    case 'add': return `${target}+${b}`;
    case 'sub': return `${target}−${b}`;
    case 'mul': return `${target}×${b}`;
    case 'trn': return `Trn(${target})`;
  }
}

function formatGrid(m: Matrix, ctx: KeyContext): string[][] {
  return m.map((row) => row.map((v) => formatNumber(v, ctx.settings)));
}

export function getMatrixDisplay(state: MatrixAppState, ctx: KeyContext): DisplayState {
  if (state.screen === 'menu') {
    return { lines: [{ text: 'Matrix', size: 'small' }, { text: `▶ ${state.target}` }, { text: '1:A 2:B 3:C EXE:edit f(x):op', size: 'small' }] };
  }
  if (state.screen === 'size') {
    return { lines: [{ text: 'Size', size: 'small' }, { text: `${state.rows}×${state.cols}` }, { text: '▲▼ rows  ◀▶ cols', size: 'small' }] };
  }
  if (state.screen === 'edit') {
    const m = ctx.matrices[state.target] ?? identity(state.rows);
    return {
      lines: [
        { text: `${state.target}[${state.editRow + 1},${state.editCol + 1}]= ${state.inputBuffer}`, size: 'small' },
      ],
      gridData: formatGrid(m, ctx),
      gridVariant: 'matrix',
      highlightCell: { row: state.editRow, col: state.editCol },
    };
  }
  if (state.screen === 'op') {
    return {
      lines: [
        { text: 'Op', size: 'small' },
        { text: `▶ ${opLabel(state.op, state.target)}` },
        { text: '1:det 2:inv 3:tr 4:+ 5:− 6:× 7:Trn', size: 'small' },
      ],
    };
  }
  const natural = prefersMathInput(ctx.settings);
  if (state.resultGrid) {
    return {
      lines: [{ text: state.resultTitle ?? '', size: 'small' }],
      gridData: state.resultGrid,
      gridVariant: 'matrix',
    };
  }
  return {
    lines: [
      { text: state.resultTitle ?? '', size: 'small' },
      { text: state.resultText, align: 'right', size: 'large', natural },
    ],
  };
}

function compute(state: MatrixAppState, ctx: KeyContext): Pick<MatrixAppState, 'resultText' | 'resultTitle' | 'resultGrid'> {
  const title = opLabel(state.op, state.target);
  const a = ctx.matrices[state.target];
  const bName = secondOperand(state.target);
  const b = ctx.matrices[bName];
  const missing = (name: MatName) => (ctx.language === 'vi' ? `Chưa nhập ${name}` : `${name} not set`);
  if (!a) return { resultTitle: title, resultText: missing(state.target), resultGrid: undefined };
  const binary = state.op === 'add' || state.op === 'sub' || state.op === 'mul';
  if (binary && !b) return { resultTitle: title, resultText: missing(bName), resultGrid: undefined };

  try {
    const scalar = (v: number) => ({ resultTitle: title, resultText: formatNumber(v, ctx.settings), resultGrid: undefined });
    const grid = (m: Matrix) => ({ resultTitle: title, resultText: '', resultGrid: formatGrid(m, ctx) });
    switch (state.op) {
      case 'det': return scalar(det(a));
      case 'tr': return scalar(trace(a));
      case 'inv': return grid(inverse(a));
      case 'trn': return grid(transpose(a));
      case 'add': return grid(matAdd(a, b!));
      case 'sub': return grid(matSub(a, b!));
      case 'mul': return grid(matMul(a, b!));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    const dimension = /mismatch|square/i.test(message);
    return { resultTitle: title, resultText: dimension ? 'Dimension ERROR' : 'Math ERROR', resultGrid: undefined };
  }
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
    if (key === 'LEFT' || key === 'UP') {
      let r = state.editRow;
      let c = state.editCol - 1;
      if (c < 0) { c = state.cols - 1; r = Math.max(0, r - 1); }
      if (state.editRow === 0 && state.editCol === 0) { r = 0; c = 0; }
      return { state: { ...state, editRow: r, editCol: c, inputBuffer: '' }, result: { handled: true } };
    }
    if (key === 'EXE' || key === 'RIGHT' || key === 'DOWN') {
      const m = (ctx.matrices[state.target] ?? identity(state.rows)).map((r) => [...r]);
      const typed = parseFloat(state.inputBuffer);
      if (state.inputBuffer && Number.isFinite(typed)) m[state.editRow][state.editCol] = typed;
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
    const picked = OP_KEYS[key];
    if (picked) return { state: { ...state, op: picked }, result: { handled: true } };
    if (key === 'UP' || key === 'DOWN') {
      const i = OPS.indexOf(state.op);
      const op = OPS[(i + (key === 'DOWN' ? 1 : -1) + OPS.length) % OPS.length];
      return { state: { ...state, op }, result: { handled: true } };
    }
    if (key === 'EXE') {
      return { state: { ...state, screen: 'result', ...compute(state, ctx) }, result: { handled: true } };
    }
    if (key === 'EXIT') return { state: { ...state, screen: 'menu' }, result: { handled: true } };
  }

  if (state.screen === 'result' && (key === 'EXIT' || key === 'EXE')) {
    return { state: { ...state, screen: 'op' }, result: { handled: true } };
  }
  return { state, result: { handled: false } };
}
