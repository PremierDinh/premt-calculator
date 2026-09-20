import { describe, expect, it } from 'vitest';
import { trace } from '../matrix';
import { createEvalContext, evaluateExpression } from '../evaluator';

describe('matrix trace', () => {
  it('sums the main diagonal', () => {
    expect(trace([[1, 2], [3, 4]])).toBe(5);
  });

  it('evaluates tr() as scalar trace', () => {
    const ctx = createEvalContext({
      matrices: { M: [[1, 2], [3, 4]] },
    });
    expect(evaluateExpression('tr(M)', ctx)).toBe(5);
  });
});
