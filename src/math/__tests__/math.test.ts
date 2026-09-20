import { describe, expect, it } from 'vitest';
import { addFrac, divFrac, formatFraction, gcd, lcm, simplify, toFraction, toMixed } from '../fraction';
import { cAdd, cDiv, cMul, formatComplex } from '../complex';
import { det, identity, inverse, matMul } from '../matrix';
import { solveLinearInequality, solveQuadratic, solveQuadraticInequality } from '../equations';
import { applySetting, DEFAULT_SETTINGS, cycleValue } from '../../core/settings';
import { formatNumber } from '../../core/format';

describe('fractions', () => {
  it('computes gcd and lcm', () => {
    expect(gcd(12, 18)).toBe(6);
    expect(lcm(4, 6)).toBe(12);
  });

  it('adds and simplifies', () => {
    expect(addFrac({ num: 1, den: 2 }, { num: 1, den: 3 })).toEqual({ num: 5, den: 6 });
    expect(simplify({ num: 2, den: 4 })).toEqual({ num: 1, den: 2 });
    expect(divFrac({ num: 1, den: 2 }, { num: 1, den: 4 })).toEqual({ num: 2, den: 1 });
  });

  it('converts to mixed numbers', () => {
    expect(toMixed({ num: 7, den: 3 })).toEqual({ whole: 2, num: 1, den: 3 });
    expect(formatFraction({ num: 7, den: 3 }, true)).toContain('2');
    expect(toFraction(0.5)?.den).toBe(2);
  });
});

describe('complex numbers', () => {
  it('adds and multiplies', () => {
    expect(cAdd({ re: 1, im: 2 }, { re: 3, im: 4 })).toEqual({ re: 4, im: 6 });
    expect(cMul({ re: 1, im: 1 }, { re: 1, im: -1 })).toEqual({ re: 2, im: 0 });
  });

  it('divides and formats polar', () => {
    const z = cDiv({ re: 1, im: 1 }, { re: 1, im: 0 });
    expect(z.re).toBeCloseTo(1);
    expect(formatComplex({ re: 0, im: 1 }, 'polar', 'deg')).toContain('∠');
  });
});

describe('matrices', () => {
  it('multiplies and inverts 2x2', () => {
    const a = [[1, 2], [3, 4]];
    expect(det(a)).toBe(-2);
    const inv = inverse(a);
    const prod = matMul(a, inv);
    expect(prod[0][0]).toBeCloseTo(1);
    expect(prod[1][1]).toBeCloseTo(1);
    expect(identity(2)).toEqual([[1, 0], [0, 1]]);
  });
});

describe('equations', () => {
  it('solves quadratics', () => {
    const r = solveQuadratic(1, -3, 2);
    expect(r.roots.map((x) => x.re).sort()).toEqual([1, 2]);
  });

  it('solves inequalities', () => {
    expect(solveLinearInequality(1, -2, '>')).toBe('x > 2');
    expect(solveQuadraticInequality(1, 0, -4, '>')).toContain('or');
  });
});

describe('settings', () => {
  it('cycles input/output and angle', () => {
    let s = DEFAULT_SETTINGS;
    s = applySetting(s, 'angleUnit');
    expect(s.angleUnit).toBe('rad');
    s = applySetting(s, 'inputOutput');
    expect(s.inputOutput).toBe('MathI/DecimalO');
    s = applySetting(s, 'language');
    expect(s.language).toBe('en');
  });

  it('formats numbers according to settings', () => {
    expect(formatNumber(Math.PI, { ...DEFAULT_SETTINGS, numberFormat: 'fix', fixDigits: 2 })).toBe('3.14');
    expect(formatNumber(1234.5, { ...DEFAULT_SETTINGS, digitSeparator: true })).toContain(' ');
    expect(formatNumber(1.5, { ...DEFAULT_SETTINGS, decimalMark: ',' })).toContain(',');
    expect(cycleValue(['a', 'b'], 'a')).toBe('b');
  });
});
