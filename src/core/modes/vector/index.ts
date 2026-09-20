import type { DisplayState, KeyContext, KeyId, ModeResult, VectorAppState } from '../../types';
import { cross, dot, formatVector, norm, vecAdd, vecSub } from '../../../math/vector';

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

export function getVectorDisplay(state: VectorAppState, ctx: KeyContext): DisplayState {
  if (state.screen === 'menu') {
    return { lines: [{ text: 'Vector', size: 'small' }, { text: `▶ ${state.target}` }, { text: '1:A 2:B 3:C', size: 'small' }] };
  }
  if (state.screen === 'size') {
    return { lines: [{ text: 'Dim', size: 'small' }, { text: String(state.dim) }] };
  }
  if (state.screen === 'edit') {
    const v = ctx.vectors[state.target] ?? [0, 0];
    return {
      lines: [
        { text: `${state.target}[${state.editIndex + 1}]`, size: 'small' },
        { text: state.inputBuffer || String(v[state.editIndex] ?? 0), align: 'right' },
      ],
    };
  }
  if (state.screen === 'op') {
    return { lines: [{ text: 'Op', size: 'small' }, { text: state.op }, { text: '1:dot 2:cross 3:|v| 4:+ 5:-', size: 'small' }] };
  }
  return { lines: [{ text: state.resultText }] };
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
    if (key === 'EXE') {
      const data = [...(ctx.vectors[state.target] ?? Array(state.dim).fill(0))];
      data[state.editIndex] = parseFloat(state.inputBuffer || '0');
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
    if (key === 'ONE') return { state: { ...state, op: 'dot' }, result: { handled: true } };
    if (key === 'TWO') return { state: { ...state, op: 'cross' }, result: { handled: true } };
    if (key === 'THREE') return { state: { ...state, op: 'norm' }, result: { handled: true } };
    if (key === 'FOUR') return { state: { ...state, op: 'add' }, result: { handled: true } };
    if (key === 'FIVE') return { state: { ...state, op: 'sub' }, result: { handled: true } };
    if (key === 'EXE') {
      try {
        const a = ctx.vectors[state.target];
        const b = ctx.vectors.VctB;
        if (!a) throw new Error('empty');
        let resultText = '';
        if (state.op === 'dot' && b) resultText = String(parseFloat(dot(a, b).toPrecision(10)));
        if (state.op === 'cross' && b) resultText = formatVector(cross(a, b));
        if (state.op === 'norm') resultText = String(parseFloat(norm(a).toPrecision(10)));
        if (state.op === 'add' && b) resultText = formatVector(vecAdd(a, b));
        if (state.op === 'sub' && b) resultText = formatVector(vecSub(a, b));
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
