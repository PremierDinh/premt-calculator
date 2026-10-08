export interface Fraction {
  num: number;
  den: number;
}

export function gcd(a: number, b: number): number {
  a = Math.trunc(Math.abs(a));
  b = Math.trunc(Math.abs(b));
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(Math.trunc(a) * Math.trunc(b)) / gcd(a, b);
}

export function simplify(frac: Fraction): Fraction {
  if (frac.den === 0) throw new Error('Division by zero');
  let { num, den } = frac;
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

export function addFrac(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.den + b.num * a.den, den: a.den * b.den });
}

export function subFrac(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.den - b.num * a.den, den: a.den * b.den });
}

export function mulFrac(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.num, den: a.den * b.den });
}

export function divFrac(a: Fraction, b: Fraction): Fraction {
  return simplify({ num: a.num * b.den, den: a.den * b.num });
}

export function toFraction(value: number, maxDen = 10000, relTol = 1e-10): Fraction | null {
  if (!Number.isFinite(value)) return null;
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const tol = relTol * Math.max(1, x);
  if (x > Number.MAX_SAFE_INTEGER) return null;
  if (Math.abs(x - Math.round(x)) <= tol) return { num: sign * Math.round(x), den: 1 };

  // Continued-fraction convergents: h/k are the best rational approximations for each denominator size.
  let h = 1, hPrev = 0;
  let k = 0, kPrev = 1;
  let y = x;
  for (let i = 0; i < 64; i++) {
    const a = Math.floor(y);
    const hNext = a * h + hPrev;
    const kNext = a * k + kPrev;
    if (kNext > maxDen) break;
    hPrev = h; h = hNext;
    kPrev = k; k = kNext;
    if (Math.abs(x - h / k) <= tol) return simplify({ num: sign * h, den: k });
    const rest = y - a;
    if (rest < 1e-15) break;
    y = 1 / rest;
  }
  return null;
}

export function toMixed(frac: Fraction): { whole: number; num: number; den: number } {
  const s = simplify(frac);
  const whole = Math.trunc(s.num / s.den);
  return { whole, num: Math.abs(s.num % s.den), den: s.den };
}

export function formatFraction(frac: Fraction, mixed = false): string {
  const s = simplify(frac);
  if (s.den === 1) return String(s.num);
  if (mixed) {
    const m = toMixed(s);
    if (m.whole === 0) return `${s.num < 0 ? '-' : ''}${m.num}/${m.den}`;
    if (m.num === 0) return String(m.whole);
    const sign = s.num < 0 && m.whole === 0 ? '-' : '';
    return `${sign}${m.whole} ${m.num}/${m.den}`;
  }
  return `${s.num}/${s.den}`;
}
