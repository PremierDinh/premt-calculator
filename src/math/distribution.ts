const SQRT_2PI = Math.sqrt(2 * Math.PI);

export function normalPdf(x: number, mean: number, std: number): number {
  const z = (x - mean) / std;
  return Math.exp(-0.5 * z * z) / (std * SQRT_2PI);
}

export function normalCdf(x: number, mean: number, std: number): number {
  return standardNormalCdf((x - mean) / std);
}

export function normalInv(p: number, mean: number, std: number): number {
  return mean + std * standardNormalInv(p);
}

export function binomialPdf(k: number, n: number, p: number): number {
  if (!Number.isInteger(k) || k < 0 || k > n) return 0;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  return Math.exp(logCombinations(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p));
}

export function binomialCdf(k: number, n: number, p: number): number {
  if (k < 0) return 0;
  if (k >= n) return 1;
  let sum = 0;
  for (let i = 0; i <= k; i++) sum += binomialPdf(i, n, p);
  return Math.min(1, sum);
}

const INV_TOLERANCE = 1e-12;

export function binomialInv(target: number, n: number, p: number): number {
  let sum = 0;
  for (let k = 0; k < n; k++) {
    sum += binomialPdf(k, n, p);
    if (sum >= target - INV_TOLERANCE) return k;
  }
  return n;
}

export function poissonPdf(k: number, lambda: number): number {
  if (!Number.isInteger(k) || k < 0) return 0;
  if (lambda === 0) return k === 0 ? 1 : 0;
  return Math.exp(k * Math.log(lambda) - lambda - logGamma(k + 1));
}

export function poissonCdf(k: number, lambda: number): number {
  if (k < 0) return 0;
  let sum = 0;
  for (let i = 0; i <= k; i++) sum += poissonPdf(i, lambda);
  return Math.min(1, sum);
}

export function poissonInv(target: number, lambda: number): number {
  const limit = Math.ceil(lambda + 40 * Math.sqrt(lambda) + 100);
  let sum = 0;
  for (let k = 0; k < limit; k++) {
    sum += poissonPdf(k, lambda);
    if (sum >= target - INV_TOLERANCE) return k;
  }
  return limit;
}

const LANCZOS_G = 7;
const LANCZOS_COEFFS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

function logGamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - logGamma(1 - x);
  const z = x - 1;
  let a = LANCZOS_COEFFS[0];
  const t = z + LANCZOS_G + 0.5;
  for (let i = 1; i < LANCZOS_COEFFS.length; i++) a += LANCZOS_COEFFS[i] / (z + i);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

function logCombinations(n: number, k: number): number {
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
}

// Hart algorithm 5666 as published by G. West (2005); absolute error ~1e-15.
function standardNormalCdf(z: number): number {
  const x = Math.abs(z);
  let tail: number;
  if (x > 37) {
    tail = 0;
  } else {
    const e = Math.exp(-0.5 * x * x);
    if (x < 7.07106781186547) {
      let num = 3.52624965998911e-2 * x + 0.700383064443688;
      num = num * x + 6.37396220353165;
      num = num * x + 33.912866078383;
      num = num * x + 112.079291497871;
      num = num * x + 221.213596169931;
      num = num * x + 220.206867912376;
      let den = 8.83883476483184e-2 * x + 1.75566716318264;
      den = den * x + 16.064177579207;
      den = den * x + 86.7807322029461;
      den = den * x + 296.564248779674;
      den = den * x + 637.333633378831;
      den = den * x + 793.826512519948;
      den = den * x + 440.413735824752;
      tail = (e * num) / den;
    } else {
      let b = x + 0.65;
      b = x + 4 / b;
      b = x + 3 / b;
      b = x + 2 / b;
      b = x + 1 / b;
      tail = e / b / SQRT_2PI;
    }
  }
  return z > 0 ? 1 - tail : tail;
}

const ACKLAM_A = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
const ACKLAM_B = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
const ACKLAM_C = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
const ACKLAM_D = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
const P_LOW = 0.02425;

// Acklam's rational approximation (rel. error 1.15e-9), polished with one Halley step.
function standardNormalInv(p: number): number {
  if (!(p > 0 && p < 1)) return NaN;
  const [a0, a1, a2, a3, a4, a5] = ACKLAM_A;
  const [b0, b1, b2, b3, b4] = ACKLAM_B;
  const [c0, c1, c2, c3, c4, c5] = ACKLAM_C;
  const [d0, d1, d2, d3] = ACKLAM_D;
  let x: number;
  if (p < P_LOW) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c0 * q + c1) * q + c2) * q + c3) * q + c4) * q + c5) / ((((d0 * q + d1) * q + d2) * q + d3) * q + 1);
  } else if (p <= 1 - P_LOW) {
    const q = p - 0.5;
    const r = q * q;
    x = ((((((a0 * r + a1) * r + a2) * r + a3) * r + a4) * r + a5) * q) /
      (((((b0 * r + b1) * r + b2) * r + b3) * r + b4) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log1p(-p));
    x = -(((((c0 * q + c1) * q + c2) * q + c3) * q + c4) * q + c5) / ((((d0 * q + d1) * q + d2) * q + d3) * q + 1);
  }
  const e = standardNormalCdf(x) - p;
  const u = e * SQRT_2PI * Math.exp(0.5 * x * x);
  return x - u / (1 + 0.5 * x * u);
}