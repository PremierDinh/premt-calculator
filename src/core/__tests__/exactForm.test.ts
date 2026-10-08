import { describe, expect, it } from 'vitest';
import { exactQuadraticRoots, exactRealString, splitSquare } from '../exactForm';
import { formatValue } from '../format';
import { DEFAULT_SETTINGS } from '../settings';

describe('exactRealString', () => {
  it('prefers fractions, then multiples of π, then surds', () => {
    expect(exactRealString(0.75)).toBe('3/4');
    expect(exactRealString(Math.PI / 2)).toBe('π/2');
    expect(exactRealString(-3 * Math.PI / 4)).toBe('-3π/4');
    expect(exactRealString(Math.sqrt(8))).toBe('2√2');
    expect(exactRealString(Math.sqrt(2) / 2)).toBe('√2/2');
    expect(exactRealString(2 / Math.sqrt(3))).toBe('2√3/3');
  });

  it('gives up on numbers without a simple exact form', () => {
    expect(exactRealString(Math.E)).toBeNull();
    expect(exactRealString(0.3989422804014327)).toBeNull();
  });

  it('splits square factors', () => {
    expect(splitSquare(72)).toEqual({ k: 6, m: 2 });
    expect(splitSquare(5)).toEqual({ k: 1, m: 5 });
  });
});

describe('formatValue', () => {
  it('shows exact forms in MathO and decimals in DecimalO', () => {
    const value = { kind: 'real' as const, value: Math.sqrt(12) };
    expect(formatValue(value, DEFAULT_SETTINGS)).toBe('2√3');
    expect(formatValue(value, { ...DEFAULT_SETTINGS, inputOutput: 'MathI/DecimalO' })).toBe('3.464101615');
  });
});

describe('exactQuadraticRoots', () => {
  it('returns surd roots', () => {
    expect(exactQuadraticRoots(1, -1, -1)?.map((r) => r.text)).toEqual(['(1+√5)/2', '(1-√5)/2']);
    expect(exactQuadraticRoots(2, 0, -1)?.map((r) => r.text)).toEqual(['√2/2', '-√2/2']);
  });

  it('returns rational and repeated roots', () => {
    expect(exactQuadraticRoots(2, -3, 1)?.map((r) => r.text)).toEqual(['1', '1/2']);
    expect(exactQuadraticRoots(1, -2, 1)?.map((r) => r.text)).toEqual(['1']);
  });

  it('returns complex roots', () => {
    expect(exactQuadraticRoots(1, 1, 1)?.map((r) => r.text)).toEqual(['-1/2+√3/2i', '-1/2-√3/2i']);
    expect(exactQuadraticRoots(1, 0, 1)?.map((r) => r.text)).toEqual(['i', '-i']);
  });

  it('handles a negative leading coefficient', () => {
    const roots = exactQuadraticRoots(-1, 2, 1)!;
    roots.forEach((r) => expect(-r.re * r.re + 2 * r.re + 1).toBeCloseTo(0));
    expect(roots.map((r) => r.text)).toEqual(['1-√2', '1+√2']);
  });
});
