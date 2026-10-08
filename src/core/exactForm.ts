import { formatFraction, gcd, lcm, simplify, toFraction, type Fraction } from '../math/fraction';

const MAX_PI_DEN = 100;
const MAX_SURD_DEN = 1000;
const MAX_EXACT_INT = 1e7;

/** Splits a positive integer n into k²·m with m square-free. */
export function splitSquare(n: number): { k: number; m: number } {
  let k = 1;
  let m = n;
  for (let f = 2; f * f <= m; f++) {
    while (m % (f * f) === 0) {
      m /= f * f;
      k *= f;
    }
  }
  return { k, m };
}

function termWithCoef(coef: Fraction, symbol: string): string {
  const s = simplify(coef);
  const sign = s.num < 0 ? '-' : '';
  const abs = Math.abs(s.num);
  const head = abs === 1 ? symbol : `${abs}${symbol}`;
  return s.den === 1 ? `${sign}${head}` : `${sign}${head}/${s.den}`;
}

/** Exact textbook form of a real number (fraction, a√b/c or aπ/b), or null if none fits. */
export function exactRealString(value: number, mixed = false): string | null {
  if (!Number.isFinite(value)) return null;
  const frac = toFraction(value);
  if (frac) return formatFraction(frac, mixed);

  const piFrac = toFraction(value / Math.PI, MAX_PI_DEN);
  if (piFrac && Math.abs(piFrac.num) <= 1000) return termWithCoef(piFrac, 'π');

  const square = toFraction(value * value, MAX_SURD_DEN);
  if (square && square.num > 0 && square.num * square.den < 1e9) {
    const { k, m } = splitSquare(square.num * square.den);
    if (m > 1) return termWithCoef({ num: Math.sign(value) * k, den: square.den }, `√${m}`);
  }
  return null;
}

export interface ExactRoot {
  re: number;
  im: number;
  text: string;
}

function surdSum(p: number, q: number, m: number, d: number): string {
  if (p === 0) return termWithCoef({ num: q, den: d }, `√${m}`);
  const surd = termWithCoef({ num: Math.abs(q), den: 1 }, `√${m}`);
  const inner = `${p}${q < 0 ? '-' : '+'}${surd}`;
  return d === 1 ? inner : `(${inner})/${d}`;
}

/** Roots of ax²+bx+c=0 in exact form when a, b, c are rational; null otherwise. */
export function exactQuadraticRoots(a: number, b: number, c: number): ExactRoot[] | null {
  const fracs = [a, b, c].map((v) => toFraction(v));
  if (fracs.some((f) => !f)) return null;
  const [fa, fb, fc] = fracs as Fraction[];
  const scale = lcm(lcm(fa.den, fb.den), fc.den);
  const [A, B, C] = [fa, fb, fc].map((f) => (f.num * scale) / f.den);
  if (A === 0 || [A, B, C].some((v) => Math.abs(v) > MAX_EXACT_INT)) return null;

  const disc = B * B - 4 * A * C;
  const den = 2 * A;

  if (disc === 0) {
    const root = simplify({ num: -B, den });
    return [{ re: root.num / root.den, im: 0, text: formatFraction(root) }];
  }

  const { k, m } = splitSquare(Math.abs(disc));

  if (disc > 0) {
    return [1, -1].map((sigma) => {
      const re = (-B + sigma * k * Math.sqrt(m)) / den;
      if (m === 1) return { re, im: 0, text: formatFraction(simplify({ num: -B + sigma * k, den })) };
      const g = gcd(gcd(B, k), den);
      let p = -B / g;
      let q = (sigma * k) / g;
      let d = den / g;
      if (d < 0) {
        p = -p;
        q = -q;
        d = -d;
      }
      return { re, im: 0, text: surdSum(p, q, m, d) };
    });
  }

  const reFrac = simplify({ num: -B, den });
  const absDen = Math.abs(den);
  const imFrac = m === 1 ? formatFraction(simplify({ num: k, den: absDen })) : null;
  const imText = imFrac !== null
    ? (imFrac === '1' ? '' : imFrac)
    : termWithCoef({ num: k, den: absDen }, `√${m}`);
  const reVal = reFrac.num / reFrac.den;
  const imVal = (k * Math.sqrt(m)) / absDen;
  const reText = reFrac.num === 0 ? '' : formatFraction(reFrac);
  return [1, -1].map((sigma) => {
    const sign = sigma > 0 ? (reText ? '+' : '') : '-';
    return { re: reVal, im: sigma * imVal, text: `${reText}${sign}${imText}i` };
  });
}
