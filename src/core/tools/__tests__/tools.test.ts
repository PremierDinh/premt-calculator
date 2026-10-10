import { describe, expect, it } from 'vitest';
import { numberToExpression } from '../constants';
import { convertUnit } from '../units';
import { divisorsFromFactors, formatFactorization, gcdInt, isPrime, lcmInt, primeFactorize } from '../numberTheory';
import { createEvalContext, evaluateExpression } from '../../../math/evaluator';

describe('numberTheory', () => {
  it('factorizes and lists divisors', () => {
    const f = primeFactorize(360);
    expect(formatFactorization(f)).toBe('2³ × 3² × 5');
    expect(divisorsFromFactors(f)).toHaveLength(24);
    expect(divisorsFromFactors(primeFactorize(12))).toEqual([1, 2, 3, 4, 6, 12]);
  });

  it('handles primes and large inputs', () => {
    expect(isPrime(97)).toBe(true);
    expect(isPrime(1)).toBe(false);
    expect(formatFactorization(primeFactorize(999999000001))).toBe('999999000001');
  });

  it('computes gcd and lcm', () => {
    expect(gcdInt(360, 84)).toBe(12);
    expect(lcmInt(360, 84)).toBe(2520);
  });
});

describe('units', () => {
  it('converts linear units', () => {
    expect(convertUnit(1, 'length', 'in', 'cm')).toBeCloseTo(2.54);
    expect(convertUnit(36, 'speed', 'kmh', 'ms')).toBeCloseTo(10);
    expect(convertUnit(180, 'angle', 'deg', 'rad')).toBeCloseTo(Math.PI);
  });

  it('converts temperature with offsets', () => {
    expect(convertUnit(100, 'temperature', 'C', 'F')).toBeCloseTo(212);
    expect(convertUnit(0, 'temperature', 'K', 'C')).toBeCloseTo(-273.15);
  });
});

describe('numberToExpression', () => {
  it('produces parser-compatible text', () => {
    const ctx = createEvalContext();
    for (const v of [6.62607015e-34, 299792458, 6.02214076e23, -2.5, 9.80665]) {
      expect(evaluateExpression(numberToExpression(v), ctx) / v).toBeCloseTo(1, 12);
    }
  });
});
