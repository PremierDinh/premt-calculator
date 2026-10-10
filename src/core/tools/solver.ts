import { parse } from '../../math/parser';
import { evalNode, type EvalContext } from '../../math/evaluator';
import { toReal } from '../../math/ast';
import { derivative } from '../../math/calculus';

export type RealFn = (x: number) => number;

/** Compiles an expression in x; "lhs = rhs" becomes lhs − rhs. Throws on syntax errors. */
export function compileFunction(text: string, ctx: EvalContext): RealFn {
  const parts = text.split('=');
  if (parts.length > 2) throw new Error('too many =');
  const lhs = parse(parts[0].trim() || '0');
  const rhs = parts.length === 2 ? parse(parts[1].trim() || '0') : null;
  return (x: number) => {
    const scope = { ...ctx, variables: { ...ctx.variables, x } };
    try {
      const l = toReal(evalNode(lhs, scope));
      return rhs ? l - toReal(evalNode(rhs, scope)) : l;
    } catch {
      return NaN;
    }
  };
}

function bisect(fn: RealFn, a: number, b: number, fa: number): number {
  let lo = a;
  let hi = b;
  let flo = fa;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const fm = fn(mid);
    if (fm === 0) return mid;
    if (Math.sign(fm) === Math.sign(flo)) {
      lo = mid;
      flo = fm;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

function polish(x: number): number {
  const rounded = Math.round(x * 1e9) / 1e9;
  return Math.abs(rounded) < 1e-12 ? 0 : rounded;
}

/** All real roots in [a, b]: sign changes are bisected, touching roots found at local minima of |f|. */
export function findRoots(fn: RealFn, a: number, b: number, samples = 4000): number[] {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const step = (hi - lo) / samples;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = lo + i * step;
    xs.push(x);
    ys.push(fn(x));
  }

  let scale = 0;
  for (const y of ys) if (Number.isFinite(y)) scale = Math.max(scale, Math.abs(y));
  const tol = 1e-7 * Math.max(1, scale);

  const roots: number[] = [];
  const accept = (r: number) => {
    const fr = fn(r);
    if (!Number.isFinite(fr) || Math.abs(fr) > 1e-6 * Math.max(1, Math.abs(r))) return;
    const p = polish(r);
    if (!roots.some((q) => Math.abs(q - p) < Math.max(step / 2, 1e-9))) roots.push(p);
  };

  for (let i = 0; i < samples; i++) {
    const y0 = ys[i];
    const y1 = ys[i + 1];
    if (!Number.isFinite(y0) || !Number.isFinite(y1)) continue;
    if (y0 === 0) accept(xs[i]);
    else if (Math.sign(y0) !== Math.sign(y1) && y1 !== 0) accept(bisect(fn, xs[i], xs[i + 1], y0));
  }
  if (ys[samples] === 0) accept(xs[samples]);

  for (let i = 1; i < samples; i++) {
    const m = Math.abs(ys[i]);
    if (!Number.isFinite(m) || m > tol * 1e4) continue;
    if (m <= Math.abs(ys[i - 1]) && m <= Math.abs(ys[i + 1])) {
      let x = xs[i];
      for (let k = 0; k < 50; k++) {
        const d = derivative(fn, x);
        const dd = (derivative(fn, x + 1e-5) - derivative(fn, x - 1e-5)) / 2e-5;
        if (!Number.isFinite(d) || !Number.isFinite(dd) || Math.abs(dd) < 1e-14) break;
        const next = x - d / dd;
        if (Math.abs(next - x) < 1e-13) break;
        x = next;
      }
      if (Math.abs(x - xs[i]) <= step) accept(x);
    }
  }

  return roots.sort((p, q) => p - q);
}

/** Adaptive Simpson integration. */
export function integrateAdaptive(fn: RealFn, a: number, b: number, eps = 1e-10): number {
  const simpson = (l: number, r: number, fl: number, fm: number, fr: number) => ((r - l) / 6) * (fl + 4 * fm + fr);
  const recurse = (l: number, r: number, fl: number, fm: number, fr: number, whole: number, e: number, depth: number): number => {
    const m = (l + r) / 2;
    const lm = (l + m) / 2;
    const rm = (m + r) / 2;
    const flm = fn(lm);
    const frm = fn(rm);
    const left = simpson(l, m, fl, flm, fm);
    const right = simpson(m, r, fm, frm, fr);
    if (depth <= 0 || Math.abs(left + right - whole) <= 15 * e) return left + right + (left + right - whole) / 15;
    return recurse(l, m, fl, flm, fm, left, e / 2, depth - 1) + recurse(m, r, fm, frm, fr, right, e / 2, depth - 1);
  };
  const fa = fn(a);
  const fb = fn(b);
  const fm = fn((a + b) / 2);
  return recurse(a, b, fa, fm, fb, simpson(a, b, fa, fm, fb), eps, 40);
}
