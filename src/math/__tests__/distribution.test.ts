import { describe, expect, it } from 'vitest';
import {
  binomialCdf, binomialInv, binomialPdf, normalCdf, normalInv, normalPdf, poissonCdf, poissonInv, poissonPdf,
} from '../distribution';

describe('normal distribution', () => {
  it('matches reference values', () => {
    expect(normalPdf(0, 0, 1)).toBeCloseTo(0.3989422804, 9);
    expect(normalCdf(1.96, 0, 1)).toBeCloseTo(0.9750021049, 9);
    expect(normalCdf(-8, 0, 1)).toBeCloseTo(6.22e-16, 17);
    expect(normalCdf(110, 100, 10)).toBeCloseTo(0.8413447461, 9);
  });

  it('inverts the CDF', () => {
    expect(normalInv(0.975, 0, 1)).toBeCloseTo(1.959963985, 8);
    expect(normalInv(0.5, 100, 15)).toBeCloseTo(100, 9);
    for (const p of [1e-10, 0.01, 0.3, 0.7, 0.999999]) {
      expect(normalCdf(normalInv(p, 0, 1), 0, 1)).toBeCloseTo(p, 12);
    }
  });
});

describe('binomial distribution', () => {
  it('matches reference values', () => {
    expect(binomialPdf(3, 10, 0.5)).toBeCloseTo(0.1171875, 12);
    expect(binomialCdf(3, 10, 0.5)).toBeCloseTo(0.171875, 12);
    expect(binomialPdf(500, 1000, 0.5)).toBeCloseTo(0.0252250181, 9);
    expect(Number.isFinite(binomialCdf(500, 1000, 0.5))).toBe(true);
  });

  it('finds the smallest k with CDF ≥ target', () => {
    expect(binomialInv(0.171875, 10, 0.5)).toBe(3);
    expect(binomialInv(0.18, 10, 0.5)).toBe(4);
  });
});

describe('poisson distribution', () => {
  it('matches reference values', () => {
    expect(poissonPdf(2, 3)).toBeCloseTo(0.2240418077, 9);
    expect(poissonCdf(2, 3)).toBeCloseTo(0.4231900811, 9);
    expect(Number.isFinite(poissonPdf(200, 200))).toBe(true);
  });

  it('inverts the CDF', () => {
    expect(poissonInv(0.42, 3)).toBe(2);
    expect(poissonInv(0.43, 3)).toBe(3);
  });
});
