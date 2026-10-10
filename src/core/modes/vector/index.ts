import type { DisplayState, KeyContext, KeyId, ModeResult, VectorAppState } from '../../types';
import { cross, dot, norm, vecAdd, vecSub, type Vector } from '../../../math/vector';
import { formatNumber, formatValue } from '../../format';
import { prefersMathInput } from '../../settings';

type VecName = VectorAppState['target'];
type VecOp = VectorAppState['op'];

const OPS: VecOp[] = ['dot', 'cross', 'norm', 'add', 'sub', 'angle'];
const OP_KEYS: Partial<Record<KeyId, VecOp>> = {
  ONE: 'dot', TWO: 'cross', THREE: 'norm', FOUR: 'add', FIVE: 'sub', SIX: 'angle',
};

export function createVectorState(): VectorAppState {
  return {
    screen: 'menu',
    target: 'VctA',
    dim: 2,
    editIndex: 0,
    inputBuffer: '',
    op: 'dot',
    resultText: '',
  };
}

function secondOperand(target: VecName): VecName {
  return target === 'VctB' ? 'VctA' : 'VctB';
}

function opLabel(op: VecOp, target: VecName): string {
  const b = secondOperand(target);
  switch (op) {
    case 'dot': return `${target}•${b}`;
    case 'cross': return `${target}×${b}`;
    case 'norm': return `|${target}|`;
    case 'add': return `${target}+${b}`;
    case 'sub': return `${target}−${b}`;
    case 'angle': return `∠(${target},${b})`;
  }
}

function formatVec(v: Vector, ctx: KeyContext): string {
  return `(${v.map((x) => formatNumber(x, ctx.settings)).join(', ')})`;
}

export function getVectorDisplay(state: VectorAppState, ctx: KeyContext): DisplayState {
  if (state.screen === 'menu') {
    return { lines: [{ text: 'Vector', size: 'small' }, { text: `▶ ${state.target}` }, { text: '1:A 2:B 3:C =:edit f(x):op', size: 'small' }] };
  }
  if (state.screen === 'size') {
    return { lines: [{ text: 'Dim', size: 'small' }, { text: String(state.dim) }, { text: '2 / 3', size: 'small' }] };
  }
  if (state.screen === 'edit') {
    const v = ctx.vectors[state.target] ?? Array(state.dim).fill(0);
    return {
      lines: [
        { text: `${state.target}[${state.editIndex + 1}]= ${state.inputBuffer}`, size: 'small' },
      ],
      gridData: [v.map((x) => formatNumber(x, ctx.settings))],
      gridVariant: 'matrix',
      highlightCell: { row: 0, col: state.editIndex },
    };
  }
  if (state.screen === 'op') {
    return {
      lines: [
        { text: 'Op', size: 'small' },
        { text: `▶ ${opLabel(state.op, state.target)}` },
        { text: '1:• 2:× 3:|v| 4:+ 5:− 6:∠', size: 'small' },
      ],
    };
  }
  return {
    lines: [
      { text: opLabel(state.op, state.target), size: 'small' },
      { text: state.resultText, align: 'right', size: 'large', natural: prefersMathInput(ctx.settings) },
    ],
  };
}

function compute(state: VectorAppState, ctx: KeyContext): string {
  const a = ctx.vectors[state.target];
  const bName = secondOperand(state.target);
  const b = ctx.vectors[bName];
  const missing = (name: VecName) => (ctx.language === 'vi' ? `Chưa nhập ${name}` : `${name} not set`);
  if (!a) return missing(state.target);
  if (state.op !== 'norm' && !b) return missing(bName);
  const exact = (v: number) => formatValue({ kind: 'real', value: v }, ctx.settings);
  try {
    switch (state.op) {
      case 'dot': return exact(dot(a, b!));
      case 'cross': return formatVec(cross(a, b!), ctx);
      case 'norm': return exact(norm(a));
      case 'add': return formatVec(vecAdd(a, b!), ctx);
      case 'sub': return formatVec(vecSub(a, b!), ctx);
      case 'angle': {
        const cos = dot(a, b!) / (norm(a) * norm(b!));
        if (!Number.isFinite(cos)) return 'Math ERROR';
        const rad = Math.acos(Math.max(-1, Math.min(1, cos)));
        const unit = ctx.settings.angleUnit;
        const value = unit === 'deg' ? (rad * 180) / Math.PI : unit === 'gra' ? (rad * 200) / Math.PI : rad;
        return exact(value);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    return /mismatch|dimension|3D/i.test(message) ? 'Dimension ERROR' : 'Math ERROR';
  }
}

export function handleVectorKey(
  state: VectorAppState,
  key: KeyId,
  ctx: KeyContext,
): { state: VectorAppState; result: ModeResult } {
  const nums: Partial<Record<KeyId, string>> = {
    ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
    FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9', DOT: '.',
  };
  if (key === 'AC') return { state: createVectorState(), result: { handled: true } };

  if (state.screen === 'menu') {
    if (key === 'ONE') return { state: { ...state, target: 'VctA' }, result: { handled: true } };
    if (key === 'TWO') return { state: { ...state, target: 'VctB' }, result: { handled: true } };
    if (key === 'THREE') return { state: { ...state, target: 'VctC' }, result: { handled: true } };
    if (key === 'EXE') return { state: { ...state, screen: 'size' }, result: { handled: true } };
    if (key === 'FUNCTION') return { state: { ...state, screen: 'op' }, result: { handled: true } };
  }
  if (state.screen === 'size') {
    if (key === 'TWO') return { state: { ...state, dim: 2 }, result: { handled: true } };
    if (key === 'THREE') return { state: { ...state, dim: 3 }, result: { handled: true } };
    if (key === 'UP' || key === 'DOWN') return { state: { ...state, dim: state.dim === 2 ? 3 : 2 }, result: { handled: true } };
    if (key === 'EXE') {
      const data = ctx.vectors[state.target]?.slice(0, state.dim) ?? Array(state.dim).fill(0);
      while (data.length < state.dim) data.push(0);
      return {
        state: { ...state, screen: 'edit', editIndex: 0, inputBuffer: '' },
        result: { handled: true, setVector: { name: state.target, value: data } },
      };
    }
  }
  if (state.screen === 'edit') {
    if (key === 'DEL') return { state: { ...state, inputBuffer: state.inputBuffer.slice(0, -1) }, result: { handled: true } };
    if (nums[key]) return { state: { ...state, inputBuffer: state.inputBuffer + nums[key] }, result: { handled: true } };
    if (key === 'MINUS' && !state.inputBuffer) return { state: { ...state, inputBuffer: '-' }, result: { handled: true } };
    if (key === 'LEFT' || key === 'UP') {
      return { state: { ...state, editIndex: Math.max(0, state.editIndex - 1), inputBuffer: '' }, result: { handled: true } };
    }
    if (key === 'EXE' || key === 'RIGHT' || key === 'DOWN') {
      const data = [...(ctx.vectors[state.target] ?? Array(state.dim).fill(0))];
      const typed = parseFloat(state.inputBuffer);
      if (state.inputBuffer && Number.isFinite(typed)) data[state.editIndex] = typed;
      const next = state.editIndex + 1;
      return {
        state: {
          ...state,
          screen: next >= state.dim ? 'op' : 'edit',
          editIndex: next >= state.dim ? 0 : next,
          inputBuffer: '',
        },
        result: { handled: true, setVector: { name: state.target, value: data } },
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
    if (key === 'EXE') return { state: { ...state, screen: 'result', resultText: compute(state, ctx) }, result: { handled: true } };
    if (key === 'EXIT') return { state: { ...state, screen: 'menu' }, result: { handled: true } };
  }
  if (state.screen === 'result' && (key === 'EXIT' || key === 'EXE')) {
    return { state: { ...state, screen: 'op' }, result: { handled: true } };
  }
  return { state, result: { handled: false } };
}
