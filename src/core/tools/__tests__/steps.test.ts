import { describe, expect, it } from 'vitest';
import { createEvalContext } from '../../../math/evaluator';
import { compileFunction, parseInequality, solveLinearSystem } from '../solver';
import { equationSteps, inequalitySteps, polyText, polynomialCoefficients, systemSteps } from '../steps';

const ctx = createEvalContext({ angleUnit: 'rad' });
const tr = (vi: string) => vi;
const text = (steps: { title: string; lines: string[] }[] | null) =>
  (steps ?? []).flatMap((s) => [s.title, ...s.lines]).join('\n');

describe('polynomial detection', () => {
  it('reads coefficients of polynomial equations', () => {
    expect(polynomialCoefficients(compileFunction('x^3-6x^2+11x=6', ctx))).toEqual([-6, 11, -6, 1]);
    expect(polyText([-6, 11, -6, 1])).toBe('x³ − 6x² + 11x − 6');
    expect(polyText([1, 0, 1 / 3])).toBe('(1/3)x² + 1');
  });

  it('rejects non-polynomials', () => {
    expect(polynomialCoefficients(compileFunction('e^x=3x', ctx))).toBeNull();
    expect(polynomialCoefficients(compileFunction('sin(x)', ctx))).toBeNull();
    expect(polynomialCoefficients(compileFunction('x^4', ctx))).toBeNull();
  });
});

describe('equation steps', () => {
  it('solves a quadratic with Δ and Vieta', () => {
    const out = text(equationSteps(compileFunction('x^2-5x+6=0', ctx), tr));
    expect(out).toContain('Δ = b² − 4ac = (−5)² − 4·1·6 = 1');
    expect(out).toContain('x₁ + x₂ = −b/a = 5');
    expect(out).toContain('S = {2; 3}');
  });

  it('keeps surds exact', () => {
    const out = text(equationSteps(compileFunction('x^2=3', ctx), tr));
    expect(out).toContain('S = {−√3; √3}');
  });

  it('reports Δ < 0 with complex roots', () => {
    const out = text(equationSteps(compileFunction('x^2+1', ctx), tr));
    expect(out).toContain('Δ < 0');
    expect(out).toContain('S = ∅');
  });

  it('factors a cubic with Horner', () => {
    const out = text(equationSteps(compileFunction('x^3-6x^2+11x=6', ctx), tr));
    expect(out).toContain('x = 1 là một nghiệm');
    expect(out).toContain('(x − 1)(x² − 5x + 6)');
    expect(out).toContain('S = {1; 2; 3}');
  });

  it('solves a linear equation', () => {
    const out = text(equationSteps(compileFunction('x/3+4=10', ctx), tr));
    expect(out).toContain('x = 18');
  });
});

describe('system steps', () => {
  it("uses Cramer's rule", () => {
    const r = solveLinearSystem(['2x+y=5', 'x-y=1'], ctx);
    if (r.kind === 'nonlinear') throw new Error('expected linear');
    const out = text(systemSteps(r.augmented, r.vars, tr));
    expect(out).toContain('D = 2·(−1) − 1·1 = −3');
    expect(out).toContain('x = Dx / D = −6 / (−3) = 2');
    expect(out).toContain('y = Dy / D = −3 / (−3) = 1');
  });
});

describe('inequality steps', () => {
  it('builds a sign table', () => {
    const p = parseInequality('x^2-5x+6<0')!;
    const out = text(inequalitySteps(compileFunction(p.expr, ctx), p.op, tr));
    expect(out).toContain('x ∈ (2; 3)');
  });

  it('merges closed endpoints', () => {
    const p = parseInequality('x^2>=0')!;
    expect(text(inequalitySteps(compileFunction(p.expr, ctx), p.op, tr))).toContain('x ∈ ℝ');
  });
});
