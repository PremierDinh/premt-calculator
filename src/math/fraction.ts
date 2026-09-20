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

export function toFraction(value: number, maxDen = 10000): Fraction | null {
  if (!Number.isFinite(value)) return null;
  if (Math.abs(value - Math.round(value)) < 1e-12) {
    return { num: Math.round(value), den: 1 };
  }

  let best: Fraction = { num: Math.round(value), den: 1 };
  let bestErr = Math.abs(value - best.num);

  for (let den = 1; den <= maxDen; den++) {
    const num = Math.round(value * den);
    const err = Math.abs(value - num / den);
    if (err < bestErr) {
      best = { num, den };
      bestErr = err;
    }
    if (bestErr < 1e-12) break;
  }

  if (bestErr > 1e-8) return null;
  return simplify(best);
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
