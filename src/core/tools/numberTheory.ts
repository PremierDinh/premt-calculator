export const MAX_FACTOR_INPUT = 1e12;

export interface PrimePower {
  prime: number;
  exp: number;
}

export function primeFactorize(n: number): PrimePower[] {
  const factors: PrimePower[] = [];
  let rest = Math.abs(Math.trunc(n));
  if (rest < 2) return factors;
  const take = (p: number) => {
    let exp = 0;
    while (rest % p === 0) {
      rest /= p;
      exp++;
    }
    if (exp) factors.push({ prime: p, exp });
  };
  take(2);
  take(3);
  for (let p = 5; p * p <= rest; p += 6) {
    take(p);
    take(p + 2);
  }
  if (rest > 1) factors.push({ prime: rest, exp: 1 });
  return factors;
}

export function isPrime(n: number): boolean {
  const f = primeFactorize(n);
  return f.length === 1 && f[0].exp === 1 && Math.abs(n) === f[0].prime;
}

export function divisorsFromFactors(factors: PrimePower[]): number[] {
  let divisors = [1];
  for (const { prime, exp } of factors) {
    const next: number[] = [];
    for (const d of divisors) {
      let power = 1;
      for (let i = 0; i <= exp; i++) {
        next.push(d * power);
        power *= prime;
      }
    }
    divisors = next;
  }
  return divisors.sort((a, b) => a - b);
}

export function divisorCount(factors: PrimePower[]): number {
  return factors.reduce((acc, f) => acc * (f.exp + 1), 1);
}

export function formatFactorization(factors: PrimePower[]): string {
  if (!factors.length) return '1';
  const sup = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const toSup = (n: number) => String(n).split('').map((d) => sup[Number(d)]).join('');
  return factors.map(({ prime, exp }) => (exp > 1 ? `${prime}${toSup(exp)}` : String(prime))).join(' × ');
}

export function gcdInt(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y) [x, y] = [y, x % y];
  return x;
}

export function lcmInt(a: number, b: number): number {
  if (!a || !b) return 0;
  return Math.abs(Math.trunc(a) / gcdInt(a, b) * Math.trunc(b));
}
