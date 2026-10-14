import { exactQuadraticRoots, exactRealString } from '../exactForm';
import { lcm, toFraction } from '../../math/fraction';
import { findRoots, type InequalityOp, type RealFn } from './solver';
import { rref } from './linalg';

export interface Step {
  title: string;
  lines: string[];
}

type Tr = (vi: string, en: string) => string;

const SUPERSCRIPT: Record<number, string> = { 2: '²', 3: '³' };
const SUBSCRIPT = '₁₂₃';

export function num(v: number): string {
  const clean = Math.abs(v) < 1e-12 ? 0 : v;
  const text = exactRealString(clean) ?? String(Number(clean.toPrecision(10)));
  return text.replace(/-/g, '−');
}

function paren(v: number): string {
  return v < 0 || num(v).includes('/') ? `(${num(v)})` : num(v);
}

/** Coefficients [c0, c1, c2, c3] of f when f is a polynomial of degree 1–3, otherwise null. */
export function polynomialCoefficients(fn: RealFn): number[] | null {
  const xs = [0, 1, -1, 2];
  const ys = xs.map(fn);
  if (ys.some((y) => !Number.isFinite(y))) return null;
  const solved = rref(xs.map((x, i) => [1, x, x * x, x * x * x, ys[i]]));
  if (solved.rank < 4) return null;
  const coeffs = solved.matrix.map((row) => {
    const c = row[4];
    if (Math.abs(c) < 1e-10) return 0;
    const f = toFraction(c, 1000, 1e-9);
    return f ? f.num / f.den : c;
  });
  for (const x of [0.37, -2.71, 3.3, -4.6, 7.1, 1.9]) {
    const expected = coeffs[0] + coeffs[1] * x + coeffs[2] * x * x + coeffs[3] * x * x * x;
    const actual = fn(x);
    if (!Number.isFinite(actual) || Math.abs(actual - expected) > 1e-7 * Math.max(1, Math.abs(expected))) return null;
  }
  return degree(coeffs) >= 1 ? coeffs : null;
}

function degree(coeffs: number[]): number {
  for (let d = coeffs.length - 1; d >= 0; d--) if (Math.abs(coeffs[d]) > 1e-12) return d;
  return -1;
}

/** Polynomial text from coefficients listed lowest degree first, e.g. "x³ − 6x² + 11x − 6". */
export function polyText(coeffs: number[], variable = 'x'): string {
  let out = '';
  for (let d = coeffs.length - 1; d >= 0; d--) {
    const c = coeffs[d];
    if (Math.abs(c) < 1e-12) continue;
    const abs = Math.abs(c);
    const absText = num(abs);
    const coefText = d > 0 && absText === '1' ? '' : d > 0 && absText.includes('/') ? `(${absText})` : absText;
    const power = d === 0 ? '' : d === 1 ? variable : `${variable}${SUPERSCRIPT[d]}`;
    const term = `${coefText}${power}`;
    out += out ? (c < 0 ? ` − ${term}` : ` + ${term}`) : (c < 0 ? `−${term}` : term);
  }
  return out || '0';
}

function linearSteps(c: number[], tr: Tr): Step[] {
  const [b, a] = c;
  const root = -b / a;
  const lines = [`${a === 1 ? '' : a === -1 ? '−' : paren(a)}x = ${num(-b)}`];
  if (a !== 1) lines.push(`x = ${num(-b)} : ${paren(a)} = ${num(root)}`);
  return [
    { title: tr('Đưa về dạng ax + b = 0', 'Write as ax + b = 0'), lines: [`${polyText(c)} = 0`, `a = ${num(a)}, b = ${num(b)}`] },
    { title: tr('Chuyển vế và chia cho a', 'Move b across and divide by a'), lines },
    { title: tr('Kết luận', 'Conclusion'), lines: [tr(`Phương trình có nghiệm duy nhất x = ${num(root)}`, `The equation has the single root x = ${num(root)}`)] },
  ];
}

function quadraticRoots(a: number, b: number, c: number): { real: number[]; texts: string[]; complex: string[] } {
  const exact = exactQuadraticRoots(a, b, c);
  const disc = b * b - 4 * a * c;
  if (disc < -1e-12) {
    return { real: [], texts: [], complex: exact ? exact.map((r) => r.text.replace(/-/g, '−')) : [] };
  }
  if (exact) return { real: exact.map((r) => r.re), texts: exact.map((r) => r.text.replace(/-/g, '−')), complex: [] };
  const s = Math.sqrt(Math.max(0, disc));
  const real = disc === 0 ? [-b / (2 * a)] : [(-b + s) / (2 * a), (-b - s) / (2 * a)];
  return { real, texts: real.map(num), complex: [] };
}

function quadraticSteps(c: number[], tr: Tr, withForm = true): Step[] {
  const [cc, b, a] = c;
  const disc = b * b - 4 * a * cc;
  const { real, texts, complex } = quadraticRoots(a, b, cc);
  const steps: Step[] = [];
  if (withForm) {
    steps.push({
      title: tr('Đưa về dạng ax² + bx + c = 0', 'Write as ax² + bx + c = 0'),
      lines: [`${polyText(c)} = 0`, `a = ${num(a)}, b = ${num(b)}, c = ${num(cc)}`],
    });
  }
  const quad = polyText(c);
  steps.push({
    title: withForm
      ? tr('Tính biệt thức Δ', 'Compute the discriminant Δ')
      : tr(`Giải ${quad} = 0: tính Δ`, `Solve ${quad} = 0: compute Δ`),
    lines: [`Δ = b² − 4ac = ${paren(b)}² − 4·${paren(a)}·${paren(cc)} = ${num(disc)}`],
  });
  if (disc > 1e-12) {
    steps.push({
      title: tr('Δ > 0: phương trình có hai nghiệm phân biệt', 'Δ > 0: two distinct real roots'),
      lines: [
        `√Δ = ${num(Math.sqrt(disc))}`,
        `x₁ = (−b + √Δ) / 2a = ${texts[0]}`,
        `x₂ = (−b − √Δ) / 2a = ${texts[1]}`,
      ],
    });
    steps.push({
      title: tr('Kiểm tra bằng định lý Vi-ét', "Check with Vieta's formulas"),
      lines: [`x₁ + x₂ = −b/a = ${num(-b / a)}`, `x₁ · x₂ = c/a = ${num(cc / a)}`],
    });
  } else if (Math.abs(disc) <= 1e-12) {
    steps.push({
      title: tr('Δ = 0: phương trình có nghiệm kép', 'Δ = 0: one double root'),
      lines: [`x₁ = x₂ = −b / 2a = ${texts[0] ?? num(real[0])}`],
    });
  } else {
    steps.push({
      title: tr('Δ < 0: phương trình vô nghiệm thực', 'Δ < 0: no real roots'),
      lines: complex.length ? [tr(`Nghiệm phức: x = ${complex.join(' ; x = ')}`, `Complex roots: x = ${complex.join(' ; x = ')}`)] : [],
    });
  }
  return steps;
}

function divisors(n: number): number[] {
  const out: number[] = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      out.push(i);
      if (i * i !== n) out.push(n / i);
    }
  }
  return out;
}

/** A rational root of the cubic via the rational root theorem, or null. */
function rationalRoot(c: number[]): number | null {
  if (Math.abs(c[0]) < 1e-12) return 0;
  const fracs = c.map((v) => toFraction(v, 1000));
  if (fracs.some((f) => !f)) return null;
  const scale = fracs.reduce((m, f) => lcm(m, f!.den), 1);
  const ints = fracs.map((f) => (f!.num * scale) / f!.den);
  const lead = Math.abs(ints[3]);
  const constant = Math.abs(ints[0]);
  if (lead > 1e6 || constant > 1e6) return null;
  const value = (x: number) => ((ints[3] * x + ints[2]) * x + ints[1]) * x + ints[0];
  const candidates = divisors(constant).flatMap((p) => divisors(lead).flatMap((q) => [p / q, -p / q]));
  candidates.sort((x, y) => Math.abs(x) - Math.abs(y) || y - x);
  return candidates.find((r) => Math.abs(value(r)) < 1e-9 * Math.max(1, constant)) ?? null;
}

function rootSet(roots: number[]): string {
  const unique = [...new Set(roots.map((r) => Number(r.toPrecision(12))))].sort((x, y) => x - y);
  return `S = {${unique.map(num).join('; ')}}`;
}

function cubicSteps(c: number[], tr: Tr): Step[] {
  const [d, cc, b, a] = c;
  const steps: Step[] = [{
    title: tr('Đưa về dạng ax³ + bx² + cx + d = 0', 'Write as ax³ + bx² + cx + d = 0'),
    lines: [`${polyText(c)} = 0`, `a = ${num(a)}, b = ${num(b)}, c = ${num(cc)}, d = ${num(d)}`],
  }];
  const r = rationalRoot(c);
  if (r === null) {
    steps.push({
      title: tr('Không nhẩm được nghiệm hữu tỉ', 'No rational root to guess'),
      lines: [tr('Dùng phương pháp số (chia đôi khoảng, Newton) để tìm nghiệm gần đúng — xem kết quả phía trên.', 'Numerical methods (bisection, Newton) give the roots shown above.')],
    });
    return steps;
  }
  const terms = [a * r ** 3, b * r ** 2, cc * r, d].filter((t) => Math.abs(t) > 1e-12);
  const substituted = terms.map((t, i) => (i === 0 ? num(t) : t < 0 ? ` − ${num(-t)}` : ` + ${num(t)}`)).join('') || '0';
  steps.push({
    title: tr('Nhẩm nghiệm', 'Guess a root'),
    lines: [
      tr(`Thay x = ${num(r)} vào vế trái: ${substituted} = 0`, `Substitute x = ${num(r)}: ${substituted} = 0`),
      tr(`⇒ x = ${num(r)} là một nghiệm`, `⇒ x = ${num(r)} is a root`),
    ],
  });
  const q2 = a;
  const q1 = b + r * q2;
  const q0 = cc + r * q1;
  const quad = [q0, q1, q2];
  const factor = r === 0 ? 'x' : `x ${r > 0 ? '−' : '+'} ${num(Math.abs(r))}`;
  steps.push({
    title: tr(`Chia cho (${factor}) theo sơ đồ Horner`, `Divide by (${factor}) with Horner's scheme`),
    lines: [
      `${num(a)} | ${num(b)} | ${num(cc)} | ${num(d)}`,
      `${num(q2)} | ${num(q1)} | ${num(q0)} | 0`,
      `⇒ ${polyText(c)} = ${r === 0 ? 'x' : `(${factor})`}(${polyText(quad)})`,
    ],
  });
  steps.push(...quadraticSteps(quad, tr, false));
  steps.push({ title: tr('Kết luận', 'Conclusion'), lines: [rootSet([r, ...quadraticRoots(q2, q1, q0).real])] });
  return steps;
}

/** Textbook solution for polynomial equations of degree 1–3; null for anything else. */
export function equationSteps(fn: RealFn, tr: Tr): Step[] | null {
  const c = polynomialCoefficients(fn);
  if (!c) return null;
  const deg = degree(c);
  if (deg === 1) return linearSteps(c.slice(0, 2), tr);
  if (deg === 2) {
    const steps = quadraticSteps(c.slice(0, 3), tr);
    const { real } = quadraticRoots(c[2], c[1], c[0]);
    steps.push({ title: tr('Kết luận', 'Conclusion'), lines: [real.length ? rootSet(real) : 'S = ∅'] });
    return steps;
  }
  return cubicSteps(c, tr);
}

function det(m: number[][]): number {
  if (m.length === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
    - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
    + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

function linearForm(coeffs: number[], vars: string[]): string {
  let out = '';
  coeffs.forEach((c, i) => {
    if (Math.abs(c) < 1e-12) return;
    const abs = num(Math.abs(c));
    const term = `${abs === '1' ? '' : abs.includes('/') ? `(${abs})` : abs}${vars[i]}`;
    out += out ? (c < 0 ? ` − ${term}` : ` + ${term}`) : (c < 0 ? `−${term}` : term);
  });
  return out || '0';
}

/** Cramer's rule walkthrough for a 2×2 or 3×3 linear system given as augmented rows. */
export function systemSteps(augmented: number[][], vars: string[], tr: Tr): Step[] {
  const n = vars.length;
  const A = augmented.map((row) => row.slice(0, n));
  const rhs = augmented.map((row) => row[n]);
  const D = det(A);
  const replaced = vars.map((_, k) => A.map((row, i) => row.map((v, j) => (j === k ? rhs[i] : v))));
  const Ds = replaced.map(det);
  const name = (k: number) => `D${vars[k]}`;

  const detLines = n === 2
    ? [
      `D = ${paren(A[0][0])}·${paren(A[1][1])} − ${paren(A[1][0])}·${paren(A[0][1])} = ${num(D)}`,
      ...replaced.map((m, k) => `${name(k)} = ${paren(m[0][0])}·${paren(m[1][1])} − ${paren(m[1][0])}·${paren(m[0][1])} = ${num(Ds[k])}`),
    ]
    : [`D = ${num(D)}`, ...Ds.map((v, k) => `${name(k)} = ${num(v)}`)];

  const steps: Step[] = [
    {
      title: tr('Viết hệ dưới dạng chuẩn', 'Write the system in standard form'),
      lines: augmented.map((row) => `${linearForm(row.slice(0, n), vars)} = ${num(row[n])}`),
    },
    {
      title: tr(n === 2 ? 'Tính các định thức (quy tắc Cramer)' : 'Tính các định thức cấp 3 (quy tắc Cramer)', "Compute the determinants (Cramer's rule)"),
      lines: detLines,
    },
  ];

  if (Math.abs(D) > 1e-12) {
    steps.push({
      title: tr('D ≠ 0: hệ có nghiệm duy nhất', 'D ≠ 0: unique solution'),
      lines: vars.map((v, k) => `${v} = ${name(k)} / D = ${num(Ds[k])} / ${paren(D)} = ${num(Ds[k] / D)}`),
    });
  } else {
    const allZero = Ds.every((v) => Math.abs(v) < 1e-12);
    steps.push({
      title: tr('D = 0: hệ không có nghiệm duy nhất', 'D = 0: no unique solution'),
      lines: [allZero
        ? tr('Mọi Dₓ đều bằng 0 ⇒ hệ có vô số nghiệm hoặc vô nghiệm (xem kết quả phía trên).', 'All Dᵢ are 0 ⇒ infinitely many or no solutions (see the result above).')
        : tr('Có Dₓ ≠ 0 ⇒ hệ vô nghiệm.', 'Some Dᵢ ≠ 0 ⇒ no solution.')],
    });
  }
  return steps;
}

function satisfies(sign: number, op: InequalityOp): boolean {
  if (op === '<') return sign < 0;
  if (op === '<=') return sign <= 0;
  if (op === '>') return sign > 0;
  return sign >= 0;
}

const OP_TEXT: Record<InequalityOp, string> = { '<': '<', '<=': '≤', '>': '>', '>=': '≥' };

/** Sign-table walkthrough for polynomial inequalities (degree 1–3) written as f(x) op 0. */
export function inequalitySteps(fn: RealFn, op: InequalityOp, tr: Tr): Step[] | null {
  const c = polynomialCoefficients(fn);
  if (!c) return null;
  const deg = degree(c);
  const lead = c[deg];
  const bound = 1 + Math.max(...c.slice(0, deg).map((v) => Math.abs(v / lead)), 0);
  const roots = findRoots(fn, -bound - 1, bound + 1, 8000);

  const points = [-Infinity, ...roots, Infinity];
  const pieces: { from: number; to: number; sign: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const lo = points[i];
    const hi = points[i + 1];
    const probe = lo === -Infinity ? (hi === Infinity ? 0 : hi - 1) : hi === Infinity ? lo + 1 : (lo + hi) / 2;
    pieces.push({ from: lo, to: hi, sign: Math.sign(fn(probe)) });
  }

  const end = (v: number) => (v === -Infinity ? '−∞' : v === Infinity ? '+∞' : num(v));
  const table = pieces.map((p) => `x ∈ (${end(p.from)}; ${end(p.to)}): f(x) ${p.sign > 0 ? '> 0  (+)' : '< 0  (−)'}`);
  if (roots.length) table.splice(0, 0, tr(`f(x) = 0 tại x = ${roots.map(num).join('; ')}`, `f(x) = 0 at x = ${roots.map(num).join('; ')}`));

  type Part = { from: number; to: number; closedFrom: boolean; closedTo: boolean };
  const parts: Part[] = [];
  const include = (from: number, to: number, closedFrom: boolean, closedTo: boolean) => {
    const last = parts[parts.length - 1];
    if (last && last.to === from && (last.closedTo || closedFrom)) {
      last.to = to;
      last.closedTo = closedTo;
    } else {
      parts.push({ from, to, closedFrom, closedTo });
    }
  };
  pieces.forEach((p, i) => {
    if (satisfies(p.sign, op)) include(p.from, p.to, false, false);
    const root = roots[i];
    if (root !== undefined && satisfies(0, op)) include(root, root, true, true);
  });

  const answer = parts.length === 0
    ? tr('Bất phương trình vô nghiệm', 'No solution')
    : parts.length === 1 && parts[0].from === -Infinity && parts[0].to === Infinity
      ? 'x ∈ ℝ'
      : `x ∈ ${parts.map((p) => (p.from === p.to
        ? `{${num(p.from)}}`
        : `${p.closedFrom ? '[' : '('}${end(p.from)}; ${end(p.to)}${p.closedTo ? ']' : ')'}`)).join(' ∪ ')}`;

  return [
    { title: tr('Chuyển vế về dạng f(x) so với 0', 'Move everything to one side'), lines: [`f(x) = ${polyText(c)} ${OP_TEXT[op]} 0`] },
    {
      title: tr('Giải f(x) = 0', 'Solve f(x) = 0'),
      lines: [roots.length ? roots.map((r, i) => `x${SUBSCRIPT[i] ?? i + 1} = ${num(r)}`).join(', ') : tr('f(x) = 0 vô nghiệm', 'f(x) = 0 has no real roots')],
    },
    { title: tr('Lập bảng xét dấu', 'Sign table'), lines: table },
    { title: tr(`Chọn các khoảng có f(x) ${OP_TEXT[op]} 0`, `Pick where f(x) ${OP_TEXT[op]} 0`), lines: [answer] },
  ];
}
