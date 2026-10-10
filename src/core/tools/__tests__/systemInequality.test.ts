import { describe, expect, it } from 'vitest';
import { createEvalContext } from '../../../math/evaluator';
import { compileFunction, parseInequality, solveInequality, solveLinearSystem } from '../solver';

const ctx = createEvalContext({ angleUnit: 'rad' });

function ineq(text: string, a = -10, b = 10) {
  const parsed = parseInequality(text)!;
  return solveInequality(compileFunction(parsed.expr, ctx), parsed.op, a, b);
}

describe('solveLinearSystem', () => {
  it('solves 2×2 and 3×3 systems', () => {
    expect(solveLinearSystem(['2x+y=5', 'x-y=1'], ctx)).toEqual({ kind: 'unique', vars: ['x', 'y'], values: [2, 1] });
    const r = solveLinearSystem(['2x+y-z=8', '-3x-y+2z=-11', '-2x+y+2z=-3'], ctx);
    expect(r).toEqual({ kind: 'unique', vars: ['x', 'y', 'z'], values: [2, 3, -1] });
  });

  it('accepts unsimplified linear forms', () => {
    const r = solveLinearSystem(['3(x-1)=y/2', 'x+y=2+x/2'], ctx);
    expect(r.kind).toBe('unique');
  });

  it('detects singular and nonlinear systems', () => {
    expect(solveLinearSystem(['x+y=1', '2x+2y=2'], ctx).kind).toBe('infinite');
    expect(solveLinearSystem(['x+y=1', 'x+y=2'], ctx).kind).toBe('none');
    expect(solveLinearSystem(['x^2+y=1', 'x-y=0'], ctx).kind).toBe('nonlinear');
  });

  it('rejects malformed input', () => {
    expect(() => solveLinearSystem(['x+y=1'], ctx)).toThrow();
    expect(() => solveLinearSystem(['x+y', 'x-y=0'], ctx)).toThrow();
  });
});

describe('inequalities', () => {
  it('parses operators', () => {
    expect(parseInequality('x^2 ≥ 4')).toEqual({ expr: '(x^2)-(4)', op: '>=' });
    expect(parseInequality('x = 4')).toBeNull();
    expect(parseInequality('1 < x < 2')).toBeNull();
  });

  it('solves quadratic inequalities', () => {
    expect(ineq('x^2-4>0')).toEqual([
      { from: -10, to: -2, closedFrom: true, closedTo: false },
      { from: 2, to: 10, closedFrom: false, closedTo: true },
    ]);
    expect(ineq('x^2<=4')).toEqual([{ from: -2, to: 2, closedFrom: true, closedTo: true }]);
  });

  it('handles touching roots', () => {
    expect(ineq('(x-1)^2>=0')).toEqual([{ from: -10, to: 10, closedFrom: true, closedTo: true }]);
    expect(ineq('(x-1)^2>0')).toHaveLength(2);
    expect(ineq('(x-1)^2<=0')).toEqual([{ from: 1, to: 1, closedFrom: true, closedTo: true }]);
  });

  it('handles poles', () => {
    expect(ineq('1/x>0')).toEqual([{ from: 0, to: 10, closedFrom: false, closedTo: true }]);
    expect(ineq('(x-3)/(x+1)<=0')).toEqual([{ from: -1, to: 3, closedFrom: false, closedTo: true }]);
  });
});
