import { describe, expect, it } from 'vitest';
import { createInitialModeState, getModeDisplay, handleModeKey } from '../index';
import { mockKeyContext } from '../../../test/helpers/keyContext';
import { DEFAULT_SETTINGS } from '../../settings';
import { formatNumber } from '../../format';
import type { KeyContext, KeyId, ModeId } from '../../types';
import { continueFromResult } from '../calculate';
import { solveCubic, solveLinearSystem3 } from '../equation';
import { solveQuadratic as solveQuadIneq } from '../inequality';
import { compute1Var, compute2Var } from '../statistics';

function run(mode: ModeId, keys: KeyId[], ctx: KeyContext = mockKeyContext()) {
  let modeState = createInitialModeState();
  for (const key of keys) {
    ({ modeState } = handleModeKey(mode, modeState, key, ctx));
  }
  return { modeState, display: getModeDisplay(mode, modeState, ctx) };
}

describe('number formatting', () => {
  it('uses ×10ⁿ instead of e+ for large results', () => {
    expect(formatNumber(1.2193263111263526e18, DEFAULT_SETTINGS)).toBe('1.219326311×10¹⁸');
  });
});

describe('calculate continues from a result', () => {
  it('starts a new expression when a digit is typed', () => {
    const { modeState } = run('calculate', ['ONE', 'PLUS', 'TWO', 'EXE', 'THREE']);
    expect(modeState.calculate.expression).toBe('3');
  });

  it('continues with Ans when an operator is typed', () => {
    expect(continueFromResult('+')).toEqual({ expression: 'Ans', cursorPos: 3 });
    expect(continueFromResult('5')).toEqual({ expression: '', cursorPos: 0 });
  });
});

describe('equation upgrades', () => {
  it('solves cubics with rational roots exactly', () => {
    expect(solveCubic(1, -6, 11, -6, DEFAULT_SETTINGS, 'vi')).toBe('x1=3\nx2=2\nx3=1');
  });

  it('keeps surd roots of cubics exact', () => {
    const text = solveCubic(1, -3, 1, 1, DEFAULT_SETTINGS, 'vi');
    expect(text.split('\n')).toHaveLength(3);
    expect(text).toContain('√2');
    expect(text).toContain('x2=1');
  });

  it('reports complex cubic roots', () => {
    const text = solveCubic(1, 0, 0, -1, DEFAULT_SETTINGS, 'vi');
    expect(text.startsWith('x1=1\n')).toBe(true);
    expect(text).toContain('i');
  });

  it('solves a 3×3 linear system', () => {
    const sol = solveLinearSystem3([1, 1, 1, 6, 0, 2, 5, -4, 2, 5, -1, 27])!;
    expect(sol.map((v) => Math.round(v * 1e9) / 1e9)).toEqual([5, 3, -2]);
    expect(solveLinearSystem3([1, 1, 1, 1, 2, 2, 2, 2, 0, 1, 0, 0])).toBeNull();
  });
});

describe('inequality upgrades', () => {
  it('shows exact bounds with ≤/≥ wording', () => {
    const text = solveQuadIneq(1, 0, -2, '>=', DEFAULT_SETTINGS, 'vi');
    expect(text).toBe('x≤-√2\nhoặc x≥√2');
  });

  it('handles a double root', () => {
    expect(solveQuadIneq(1, -2, 1, '<', DEFAULT_SETTINGS, 'vi')).toBe('Vô nghiệm');
    expect(solveQuadIneq(1, -2, 1, '<=', DEFAULT_SETTINGS, 'vi')).toBe('x=1');
    expect(solveQuadIneq(1, -2, 1, '>', DEFAULT_SETTINGS, 'vi')).toBe('x≠1');
    expect(solveQuadIneq(1, -2, 1, '>=', DEFAULT_SETTINGS, 'vi')).toBe('Mọi x');
  });
});

describe('statistics upgrades', () => {
  const rows = (xs: number[]) => xs.map((x) => ({ x, freq: 1 }));

  it('computes Casio-style quartiles', () => {
    const data = rows([1, 2, 3, 4, 5, 6, 7]);
    expect(compute1Var(data, 'Q1')).toBe(2);
    expect(compute1Var(data, 'Med')).toBe(4);
    expect(compute1Var(data, 'Q3')).toBe(6);
  });

  it('computes the regression y=a+bx', () => {
    const data = [{ x: 1, y: 3, freq: 1 }, { x: 2, y: 5, freq: 1 }, { x: 3, y: 7, freq: 1 }];
    expect(compute2Var(data, 'a')).toBeCloseTo(1);
    expect(compute2Var(data, 'b')).toBeCloseTo(2);
    expect(compute2Var(data, 'r')).toBeCloseTo(1);
  });

  it('enters data without a frequency prompt and opens results with FUNCTION', () => {
    const { modeState, display } = run('statistics', ['ONE', 'TWO', 'EXE', 'FOUR', 'EXE', 'NINE', 'EXE', 'DEL', 'FUNCTION']);
    expect(modeState.statistics.data.map((r) => r.x)).toEqual([2, 4]);
    expect(modeState.statistics.screen).toBe('calc-menu');
    expect(display.lines.some((l) => l.text.includes('x̄=3'))).toBe(true);
  });
});

describe('matrix and vector', () => {
  it('shows matrix inverse as fractions', () => {
    const ctx = mockKeyContext({ matrices: { MatA: [[2, 1], [1, 1]] } as KeyContext['matrices'] });
    const { display } = run('matrix', ['FUNCTION', 'TWO', 'EXE'], ctx);
    expect(display.gridData).toEqual([['1', '-1'], ['-1', '2']]);
  });

  it('explains when the second vector is missing', () => {
    const ctx = mockKeyContext({ vectors: { VctA: [1, 2, 3] } as KeyContext['vectors'] });
    const { display } = run('vector', ['FUNCTION', 'ONE', 'EXE'], ctx);
    expect(display.lines.map((l) => l.text)).toContain('Chưa nhập VctB');
  });

  it('gives the exact norm', () => {
    const ctx = mockKeyContext({ vectors: { VctA: [1, 2, 3] } as KeyContext['vectors'] });
    const { display } = run('vector', ['FUNCTION', 'THREE', 'EXE'], ctx);
    expect(display.lines.map((l) => l.text)).toContain('√14');
  });
});
