import { describe, expect, it } from 'vitest';
import { createEvalContext } from '../../../math/evaluator';
import { analyzeFunction, compileFunction } from '../solver';
import { characteristicPolynomial, eigenvalues, formatComplexRoot, polynomialRoots, rref } from '../linalg';
import { formatInRadix, parseInRadix, twosComplement } from '../baseConvert';
import { parseStoredMemory } from '../../../store/calculatorStore';
import { exactRealString } from '../../exactForm';

const ctx = createEvalContext({ angleUnit: 'rad' });

describe('analyzeFunction', () => {
  it('finds extrema and inflection of a cubic', () => {
    const { roots, critical } = analyzeFunction(compileFunction('x^3-3x', ctx), -5, 5);
    expect(roots).toHaveLength(3);
    expect(exactRealString(roots[2])).toBe('√3');
    expect(critical.map((c) => c.kind)).toEqual(['max', 'inflection', 'min']);
    expect(critical[0].x).toBeCloseTo(-1, 6);
    expect(critical[0].y).toBeCloseTo(2, 6);
    expect(critical[1].x).toBe(0);
    expect(critical[2].y).toBeCloseTo(-2, 6);
  });

  it('does not report a flat inflection as an extremum', () => {
    const { critical } = analyzeFunction(compileFunction('x^3', ctx), -3, 3);
    expect(critical.filter((c) => c.kind !== 'inflection')).toEqual([]);
  });
});

describe('linear algebra', () => {
  it('computes rank and RREF', () => {
    const { rank, matrix } = rref([[1, 2, 3], [2, 4, 6], [1, 0, 1]]);
    expect(rank).toBe(2);
    expect(matrix[0]).toEqual([1, 0, 1]);
    expect(matrix[1]).toEqual([0, 1, 1]);
  });

  it('solves a system through the augmented matrix', () => {
    const { matrix } = rref([[2, 1, -1, 8], [-3, -1, 2, -11], [-2, 1, 2, -3]]);
    expect(matrix.map((r) => r[3])).toEqual([2, 3, -1]);
  });

  it('builds the characteristic polynomial', () => {
    expect(characteristicPolynomial([[2, 1], [1, 2]])).toEqual([1, -4, 3]);
  });

  it('finds real and complex eigenvalues', () => {
    expect(eigenvalues([[2, 1], [1, 2]]).map((z) => z.re)).toEqual([1, 3]);
    const rot = eigenvalues([[0, -1], [1, 0]]);
    expect(rot.map(formatComplexRoot)).toEqual(['−i', 'i']);
    const ev = eigenvalues([[4, 1, 0, 0], [1, 3, 1, 0], [0, 1, 2, 1], [0, 0, 1, 1]]);
    const sum = ev.reduce((s, z) => s + z.re, 0);
    expect(sum).toBeCloseTo(10, 8);
  });

  it('finds polynomial roots', () => {
    expect(polynomialRoots([1, -6, 11, -6]).map((z) => z.re)).toEqual([1, 2, 3]);
  });
});

describe('base conversion', () => {
  it('parses and formats', () => {
    expect(parseInRadix('ff', 16)).toBe(255n);
    expect(parseInRadix('0b1010', 2)).toBe(10n);
    expect(parseInRadix('129', 8)).toBeNull();
    expect(formatInRadix(255n, 2)).toBe('1111 1111');
    expect(formatInRadix(1234567n, 10)).toBe('1 234 567');
    expect(formatInRadix(-26n, 16)).toBe('−1A');
  });

  it('computes two’s complement', () => {
    expect(twosComplement(-1n, 8)).toBe(255n);
    expect(twosComplement(200n, 8)).toBeNull();
  });
});

describe('stored memory', () => {
  it('restores valid data and drops corrupt entries', () => {
    const raw = JSON.stringify({
      ans: 5,
      preAns: 'bad',
      variables: { A: 2, B: null },
      history: [{ expression: '2+3', result: '5', value: 5 }, { expression: 1 }],
    });
    const mem = parseStoredMemory(raw);
    expect(mem.ans).toBe(5);
    expect(mem.preAns).toBe(0);
    expect(mem.variables.A).toBe(2);
    expect(mem.variables.B).toBe(0);
    expect(mem.history).toHaveLength(1);
    expect(parseStoredMemory('{oops').history).toEqual([]);
  });
});
