import { describe, expect, it } from 'vitest';
import { toReal } from '../ast';
import { createEvalContext, evaluate } from '../evaluator';
import { parseRecurringLiteral } from '../recurring';

describe('recurring decimals', () => {
  it('parses recurring literals', () => {
    expect(parseRecurringLiteral('0.{3}')).toBeCloseTo(1 / 3, 10);
    expect(parseRecurringLiteral('0.16{6}')).toBeCloseTo(1 / 6, 10);
  });

  it('evaluates in expressions', () => {
    const ctx = createEvalContext({
      ans: 0,
      preAns: 0,
      variables: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, x: 0, y: 0, z: 0 },
      matrices: {},
      vectors: {},
      angleUnit: 'deg',
    });
    expect(toReal(evaluate('0.{3}', ctx))).toBeCloseTo(1 / 3, 10);
  });
});
