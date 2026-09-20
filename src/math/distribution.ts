import { create, all } from 'mathjs';

const math = create(all, {});

export function normalPdf(x: number, mean: number, std: number): number {
  const z = (x - mean) / std;
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
}

export function normalCdf(x: number, mean: number, std: number): number {
  return 0.5 * (1 + erf((x - mean) / (std * Math.SQRT2)));
}

export function normalInv(p: number, mean: number, std: number): number {
  return mean + std * Math.SQRT2 * erfInv(2 * p - 1);
}

export function binomialPdf(k: number, n: number, p: number): number {
  return math.combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

export function binomialCdf(k: number, n: number, p: number): number {
  let sum = 0;
  for (let i = 0; i <= k; i++) sum += binomialPdf(i, n, p);
  return sum;
}

export function binomialInv(target: number, n: number, p: number): number {
  for (let k = 0; k <= n; k++) {
    if (binomialCdf(k, n, p) >= target) return k;
  }
  return n;
}

export function poissonPdf(k: number, lambda: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

export function poissonCdf(k: number, lambda: number): number {
  let sum = 0;
  for (let i = 0; i <= k; i++) sum += poissonPdf(i, lambda);
  return sum;
}

export function poissonInv(target: number, lambda: number): number {
  for (let k = 0; k <= 1000; k++) {
    if (poissonCdf(k, lambda) >= target) return k;
  }
  return 1000;
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
  return sign * y;
}

function erfInv(x: number): number {
  const a = 0.147;
  const ln = Math.log(1 - x * x);
  const first = 2 / (Math.PI * a) + ln / 2;
  return Math.sign(x) * Math.sqrt(Math.sqrt(first * first - ln / a) - first);
}
