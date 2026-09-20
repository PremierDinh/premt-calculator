import { newtonSolve } from './calculus';

export interface QuadraticResult {
  delta: number;
  roots: Array<{ re: number; im: number }>;
}

export function solveQuadratic(a: number, b: number, c: number): QuadraticResult {
  if (Math.abs(a) < 1e-14) {
    if (Math.abs(b) < 1e-14) return { delta: 0, roots: [] };
    return { delta: 0, roots: [{ re: -c / b, im: 0 }] };
  }
  const delta = b * b - 4 * a * c;
  if (delta >= 0) {
    const s = Math.sqrt(delta);
    return {
      delta,
      roots: [
        { re: (-b + s) / (2 * a), im: 0 },
        { re: (-b - s) / (2 * a), im: 0 },
      ],
    };
  }
  const s = Math.sqrt(-delta);
  return {
    delta,
    roots: [
      { re: -b / (2 * a), im: s / (2 * a) },
      { re: -b / (2 * a), im: -s / (2 * a) },
    ],
  };
}

export function solveLinearSystem2(
  a1: number, b1: number, c1: number,
  a2: number, b2: number, c2: number,
): { x: number; y: number } | null {
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 1e-12) return null;
  return {
    x: (c1 * b2 - c2 * b1) / det,
    y: (a1 * c2 - a2 * c1) / det,
  };
}

export function solveGeneral(fn: (x: number) => number, guess = 0): number {
  return newtonSolve(fn, guess);
}

export type InequalityKind = '>' | '<' | '>=' | '<=';

export function solveLinearInequality(a: number, b: number, kind: InequalityKind): string {
  if (Math.abs(a) < 1e-12) {
    const ok = compare(b, 0, kind);
    return ok ? 'All real' : 'Empty';
  }
  const bound = -b / a;
  const flip = a < 0;
  let op = kind;
  if (flip) {
    op = kind === '>' ? '<' : kind === '<' ? '>' : kind === '>=' ? '<=' : '>=';
  }
  return `x ${op} ${round(bound)}`;
}

export function solveQuadraticInequality(a: number, b: number, c: number, kind: InequalityKind): string {
  const { delta, roots } = solveQuadratic(a, b, c);
  if (delta < 0) {
    const mid = a > 0;
    const wantPositive = kind === '>' || kind === '>=';
    return mid === wantPositive ? 'All real' : 'Empty';
  }
  const xs = roots.map((r) => r.re).sort((p, q) => p - q);
  const [x1, x2] = xs;
  const wantPos = kind === '>' || kind === '>=';
  const eq = kind === '>=' || kind === '<=';
  if (a > 0) {
    if (wantPos) return eq ? `x<=${round(x1)} or x>=${round(x2)}` : `x<${round(x1)} or x>${round(x2)}`;
    return eq ? `${round(x1)}<=x<=${round(x2)}` : `${round(x1)}<x<${round(x2)}`;
  }
  if (wantPos) return eq ? `${round(x1)}<=x<=${round(x2)}` : `${round(x1)}<x<${round(x2)}`;
  return eq ? `x<=${round(x1)} or x>=${round(x2)}` : `x<${round(x1)} or x>${round(x2)}`;
}

function compare(left: number, right: number, kind: InequalityKind): boolean {
  switch (kind) {
    case '>': return left > right;
    case '<': return left < right;
    case '>=': return left >= right;
    case '<=': return left <= right;
  }
}

function round(n: number): number {
  return parseFloat(n.toPrecision(8));
}
