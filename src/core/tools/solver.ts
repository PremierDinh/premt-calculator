import { parse } from '../../math/parser';
import { evalNode, type EvalContext } from '../../math/evaluator';
import { toReal } from '../../math/ast';
import { derivative } from '../../math/calculus';
import { rref } from './linalg';

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
  const nearest = Math.round(x);
  if (Math.abs(x - nearest) < 1e-9) return nearest === 0 ? 0 : nearest;
  return Number(x.toPrecision(15));
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

export interface CriticalPoint {
  x: number;
  y: number;
  kind: 'min' | 'max' | 'inflection';
}

/** Local extrema and inflection points of f in [a, b], from the roots of f′ and f″. */
export function analyzeFunction(fn: RealFn, a: number, b: number): { roots: number[]; critical: CriticalPoint[] } {
  const d1: RealFn = (x) => derivative(fn, x, 1e-5);
  const d2: RealFn = (x) => (fn(x + 1e-4) - 2 * fn(x) + fn(x - 1e-4)) / 1e-8;
  const critical: CriticalPoint[] = [];
  const span = Math.abs(b - a);
  const probe = span / 400;

  for (const x of findRoots(d1, a, b, 2000)) {
    const left = fn(x - probe);
    const right = fn(x + probe);
    const y = fn(x);
    if (!Number.isFinite(y)) continue;
    if (y < left && y < right) critical.push({ x, y: polish(y), kind: 'min' });
    else if (y > left && y > right) critical.push({ x, y: polish(y), kind: 'max' });
  }
  for (const x of findRoots(d2, a, b, 2000)) {
    const s1 = Math.sign(d2(x - probe));
    const s2 = Math.sign(d2(x + probe));
    const y = fn(x);
    if (Number.isFinite(y) && s1 !== 0 && s2 !== 0 && s1 !== s2) {
      const xr = Math.round(x * 1e6) / 1e6;
      critical.push({ x: Math.abs(xr) < 1e-9 ? 0 : xr, y: polish(y), kind: 'inflection' });
    }
  }
  return { roots: findRoots(fn, a, b), critical: critical.sort((p, q) => p.x - q.x) };
}

const SYSTEM_VARS = ['x', 'y', 'z'] as const;
type SystemVar = (typeof SYSTEM_VARS)[number];

export type LinearSystemResult =
  | { kind: 'unique'; vars: SystemVar[]; values: number[] }
  | { kind: 'none' | 'infinite'; vars: SystemVar[] }
  | { kind: 'nonlinear' };

/** Solves 2–3 linear equations in x, y (, z). Coefficients are probed numerically, so any linear form is accepted. */
export function solveLinearSystem(lines: string[], ctx: EvalContext): LinearSystemResult {
  const eqs = lines.map((l) => l.trim()).filter(Boolean);
  if (eqs.length < 2 || eqs.length > 3) throw new Error('count');
  const vars = SYSTEM_VARS.slice(0, eqs.length) as SystemVar[];
  const fns = eqs.map((text) => {
    const parts = text.split('=');
    if (parts.length !== 2) throw new Error('equation');
    const lhs = parse(parts[0].trim() || '0');
    const rhs = parse(parts[1].trim() || '0');
    return (point: number[]) => {
      const variables = { ...ctx.variables };
      vars.forEach((v, i) => {
        variables[v] = point[i];
      });
      const scope = { ...ctx, variables };
      return toReal(evalNode(lhs, scope)) - toReal(evalNode(rhs, scope));
    };
  });

  const zero = vars.map(() => 0);
  const rows = fns.map((f) => {
    const c = f(zero);
    const coeffs = vars.map((_, i) => f(vars.map((__, j) => (i === j ? 1 : 0))) - c);
    return { f, c, coeffs };
  });
  const probes = [vars.map((_, i) => 1.7 + i * 0.9), vars.map((_, i) => -2.3 + i * 1.3)];
  for (const { f, c, coeffs } of rows) {
    for (const p of probes) {
      const predicted = c + coeffs.reduce((s, a, i) => s + a * p[i], 0);
      if (Math.abs(f(p) - predicted) > 1e-7 * Math.max(1, Math.abs(predicted))) return { kind: 'nonlinear' };
    }
  }

  const reduced = rref(rows.map(({ c, coeffs }) => [...coeffs, -c]));
  const n = vars.length;
  if (reduced.pivots.includes(n)) return { kind: 'none', vars };
  if (reduced.rank < n) return { kind: 'infinite', vars };
  return { kind: 'unique', vars, values: reduced.matrix.slice(0, n).map((row) => polish(row[n])) };
}

export type InequalityOp = '<' | '<=' | '>' | '>=';

export interface Interval {
  from: number;
  to: number;
  closedFrom: boolean;
  closedTo: boolean;
}

/** Splits "lhs op rhs" into lhs − rhs and the operator. */
export function parseInequality(text: string): { expr: string; op: InequalityOp } | null {
  const normalized = text.replace(/≤/g, '<=').replace(/≥/g, '>=');
  const match = normalized.match(/^(.*?)(<=|>=|<|>)(.*)$/);
  if (!match || /<|>/.test(match[3])) return null;
  const [, lhs, op, rhs] = match;
  if (!lhs.trim() || !rhs.trim()) return null;
  return { expr: `(${lhs.trim()})-(${rhs.trim()})`, op: op as InequalityOp };
}

/** Solution set of g(x) op 0 restricted to [a, b], as a union of intervals. */
export function solveInequality(g: RealFn, op: InequalityOp, a: number, b: number, samples = 4000): Interval[] {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const strict = op === '<' || op === '>';
  const holds = (y: number) => Number.isFinite(y) && (op === '<' || op === '<=' ? y < 0 : y > 0);
  const roots = findRoots(g, lo, hi, samples);
  const isRoot = (x: number) => roots.some((r) => Math.abs(r - x) < 1e-9);

  const step = (hi - lo) / samples;
  const intervals: Interval[] = [];
  let start: number | null = null;
  let prev = lo;
  for (let i = 0; i <= samples; i++) {
    const x = lo + i * step;
    const ok = holds(g(x)) && !isRoot(x);
    if (ok && start === null) {
      const boundary = i === 0 ? lo : refineBoundary(g, holds, prev, x);
      start = boundary;
    } else if (!ok && start !== null) {
      intervals.push({ from: start, to: refineBoundary(g, holds, x, prev), closedFrom: false, closedTo: false });
      start = null;
    }
    prev = x;
  }
  if (start !== null) intervals.push({ from: start, to: hi, closedFrom: false, closedTo: true });

  const snapped = intervals.map((iv) => {
    const from = snapToRoot(iv.from, roots);
    const to = snapToRoot(iv.to, roots);
    return {
      from,
      to,
      closedFrom: from === lo ? true : !strict && isRoot(from),
      closedTo: to === hi ? true : !strict && isRoot(to),
    };
  });

  if (!strict) {
    for (const r of roots) {
      const covered = snapped.some((iv) => r >= iv.from - 1e-9 && r <= iv.to + 1e-9);
      if (!covered) snapped.push({ from: r, to: r, closedFrom: true, closedTo: true });
    }
  }

  const merged: Interval[] = [];
  for (const iv of snapped.sort((p, q) => p.from - q.from)) {
    const last = merged[merged.length - 1];
    if (last && Math.abs(last.to - iv.from) < 1e-9 && (last.closedTo || iv.closedFrom)) {
      last.to = iv.to;
      last.closedTo = iv.closedTo;
    } else {
      merged.push({ ...iv });
    }
  }
  return merged;
}

function refineBoundary(g: RealFn, holds: (y: number) => boolean, outside: number, inside: number): number {
  let o = outside;
  let i = inside;
  for (let k = 0; k < 60; k++) {
    const mid = (o + i) / 2;
    if (holds(g(mid))) i = mid;
    else o = mid;
  }
  return polish((o + i) / 2);
}

function snapToRoot(x: number, roots: number[]): number {
  return roots.find((r) => Math.abs(r - x) < 1e-7) ?? x;
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
