import { describe, expect, it } from 'vitest';
import { createEvalContext, evaluate, evaluateExpression } from '../evaluator';

const ctx = createEvalContext({ angleUnit: 'deg' });

describe('evaluator', () => {
  it('evaluates arithmetic', () => {
    expect(evaluateExpression('2+3*4', ctx)).toBe(14);
    expect(evaluateExpression('(2+3)*4', ctx)).toBe(20);
    expect(evaluateExpression('2^3', ctx)).toBe(8);
  });

  it('evaluates trigonometry in degrees', () => {
    expect(evaluateExpression('sin(90)', ctx)).toBeCloseTo(1, 8);
    expect(evaluateExpression('cos(0)', ctx)).toBeCloseTo(1, 8);
  });

  it('evaluates trigonometry in radians', () => {
    const rad = createEvalContext({ angleUnit: 'rad' });
    expect(evaluateExpression('sin(pi/2)', rad)).toBeCloseTo(1, 8);
  });

  it('evaluates combinatorics, gcd and lcm', () => {
    expect(evaluateExpression('nCr(5,2)', ctx)).toBe(10);
    expect(evaluateExpression('nPr(5,2)', ctx)).toBe(20);
    expect(evaluateExpression('gcd(12,18)', ctx)).toBe(6);
    expect(evaluateExpression('lcm(4,6)', ctx)).toBe(12);
    expect(evaluateExpression('5!', ctx)).toBe(120);
  });

  it('evaluates derivative, integral and sum', () => {
    expect(evaluateExpression('d(x^2,3)', ctx)).toBeCloseTo(6, 4);
    expect(evaluateExpression('int(x,0,1)', ctx)).toBeCloseTo(0.5, 4);
    expect(evaluateExpression('sum(1,4,x)', ctx)).toBe(10);
  });

  it('uses Ans memory', () => {
    const withAns = createEvalContext({ ans: 10 });
    expect(evaluateExpression('Ans+5', withAns)).toBe(15);
  });

  it('returns fractions for integer division', () => {
    const v = evaluate('1/2', ctx);
    expect(v.kind).toBe('fraction');
    if (v.kind === 'fraction') expect(v).toMatchObject({ num: 1, den: 2 });
  });
});
