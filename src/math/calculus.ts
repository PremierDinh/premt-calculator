export function derivative(fn: (x: number) => number, x: number, h = 1e-6): number {
  return (fn(x + h) - fn(x - h)) / (2 * h);
}

export function integrate(fn: (x: number) => number, a: number, b: number, n = 200): number {
  if (n % 2 === 1) n += 1;
  const h = (b - a) / n;
  let s = fn(a) + fn(b);
  for (let i = 1; i < n; i++) {
    s += fn(a + i * h) * (i % 2 === 0 ? 2 : 4);
  }
  return (h / 3) * s;
}

export function summation(fn: (k: number) => number, start: number, end: number): number {
  let s = 0;
  const a = Math.trunc(start);
  const b = Math.trunc(end);
  const step = a <= b ? 1 : -1;
  for (let k = a; step > 0 ? k <= b : k >= b; k += step) s += fn(k);
  return s;
}

export function product(fn: (k: number) => number, start: number, end: number): number {
  let p = 1;
  for (let k = Math.trunc(start); k <= Math.trunc(end); k++) p *= fn(k);
  return p;
}

export function newtonSolve(fn: (x: number) => number, guess = 0, iters = 40): number {
  let x = guess;
  for (let i = 0; i < iters; i++) {
    const y = fn(x);
    const yp = derivative(fn, x);
    if (Math.abs(yp) < 1e-12) break;
    const next = x - y / yp;
    if (Math.abs(next - x) < 1e-10) return next;
    x = next;
  }
  return x;
}
