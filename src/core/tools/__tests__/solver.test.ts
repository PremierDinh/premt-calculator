import { describe, expect, it } from 'vitest';
import { createEvalContext } from '../../../math/evaluator';
import { compileFunction, findRoots, integrateAdaptive } from '../solver';

const ctx = createEvalContext({ angleUnit: 'rad' });

describe('solver', () => {
  it('finds all roots of a polynomial equation', () => {
    const fn = compileFunction('x^3-6x^2+11x=6', ctx);
    expect(findRoots(fn, -10, 10)).toEqual([1, 2, 3]);
  });

  it('finds double (touching) roots', () => {
    expect(findRoots(compileFunction('(x-2)^2', ctx), -10, 10)).toEqual([2]);
  });

  it('finds transcendental roots and skips poles', () => {
    const sinRoots = findRoots(compileFunction('sin(x)', ctx), -4, 4);
    expect(sinRoots).toHaveLength(3);
    expect(sinRoots[2]).toBeCloseTo(Math.PI, 8);
    expect(findRoots(compileFunction('1/x', ctx), -5, 5)).toEqual([]);
    expect(findRoots(compileFunction('tan(x)', ctx), 1, 2)).toEqual([]);
  });

  it('solves equations with x on both sides', () => {
    const roots = findRoots(compileFunction('e^x=3x', ctx), -10, 10);
    expect(roots).toHaveLength(2);
    expect(roots[0]).toBeCloseTo(0.6190612867, 8);
  });

  it('integrates accurately', () => {
    expect(integrateAdaptive(compileFunction('x^2', ctx), 0, 3)).toBeCloseTo(9, 10);
    expect(integrateAdaptive(compileFunction('sin(x)', ctx), 0, Math.PI)).toBeCloseTo(2, 10);
  });

  it('rejects syntax errors', () => {
    expect(() => compileFunction('x^2=1=2', ctx)).toThrow();
  });
});
