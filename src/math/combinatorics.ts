export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) throw new Error('Invalid factorial');
  if (n > 170) throw new Error('Overflow');
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export function nPr(n: number, r: number): number {
  n = Math.trunc(n);
  r = Math.trunc(r);
  if (r < 0 || n < 0 || r > n) throw new Error('Invalid permutation');
  let out = 1;
  for (let i = 0; i < r; i++) out *= n - i;
  return out;
}

export function nCr(n: number, r: number): number {
  n = Math.trunc(n);
  r = Math.trunc(r);
  if (r < 0 || n < 0 || r > n) throw new Error('Invalid combination');
  r = Math.min(r, n - r);
  let out = 1;
  for (let i = 1; i <= r; i++) out = (out * (n - r + i)) / i;
  return out;
}
