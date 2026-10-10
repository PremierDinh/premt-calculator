import type { Matrix } from '../../math/matrix';

export interface ComplexRoot {
  re: number;
  im: number;
}

const EPS = 1e-10;

const clean = (v: number) => (Math.abs(v) < 1e-12 ? 0 : Number(v.toPrecision(12)));

/** Reduced row echelon form with partial pivoting. */
export function rref(m: Matrix): { matrix: Matrix; rank: number; pivots: number[] } {
  const a = m.map((row) => [...row]);
  const rows = a.length;
  const cols = rows ? a[0].length : 0;
  const scale = Math.max(1, ...a.flat().map(Math.abs));
  const pivots: number[] = [];
  let r = 0;
  for (let c = 0; c < cols && r < rows; c++) {
    let best = r;
    for (let i = r + 1; i < rows; i++) if (Math.abs(a[i][c]) > Math.abs(a[best][c])) best = i;
    if (Math.abs(a[best][c]) <= EPS * scale) continue;
    [a[r], a[best]] = [a[best], a[r]];
    const p = a[r][c];
    for (let j = 0; j < cols; j++) a[r][j] /= p;
    for (let i = 0; i < rows; i++) {
      if (i === r) continue;
      const f = a[i][c];
      if (f !== 0) for (let j = 0; j < cols; j++) a[i][j] -= f * a[r][j];
    }
    pivots.push(c);
    r++;
  }
  return { matrix: a.map((row) => row.map(clean)), rank: r, pivots };
}

/** Characteristic polynomial coefficients of a square matrix, highest degree first (Faddeev–LeVerrier). */
export function characteristicPolynomial(m: Matrix): number[] {
  const n = m.length;
  const coeffs = [1];
  let mk: Matrix = m.map((row) => row.map(() => 0));
  for (let k = 1; k <= n; k++) {
    const prev = mk.map((row, i) => row.map((v, j) => v + (i === j ? coeffs[k - 1] : 0)));
    mk = m.map((row) => prev[0].map((_, j) => row.reduce((s, v, t) => s + v * prev[t][j], 0)));
    const tr = mk.reduce((s, row, i) => s + row[i], 0);
    coeffs.push(-tr / k);
  }
  return coeffs;
}

/** All complex roots of a polynomial (highest degree first) via Durand–Kerner, polished. */
export function polynomialRoots(coeffs: number[]): ComplexRoot[] {
  let c = [...coeffs];
  while (c.length > 1 && Math.abs(c[0]) < 1e-14) c = c.slice(1);
  const n = c.length - 1;
  if (n < 1) return [];
  const monic = c.map((v) => v / c[0]);
  const radius = 1 + Math.max(...monic.slice(1).map(Math.abs));
  let roots: ComplexRoot[] = Array.from({ length: n }, (_, k) => {
    const angle = (2 * Math.PI * k) / n + 0.4;
    return { re: radius * Math.cos(angle), im: radius * Math.sin(angle) };
  });
  const evalAt = (z: ComplexRoot): ComplexRoot => {
    let re = 0;
    let im = 0;
    for (const a of monic) {
      const nre = re * z.re - im * z.im + a;
      im = re * z.im + im * z.re;
      re = nre;
    }
    return { re, im };
  };
  for (let iter = 0; iter < 500; iter++) {
    let delta = 0;
    roots = roots.map((z, i) => {
      let dre = 1;
      let dim = 0;
      roots.forEach((w, j) => {
        if (i === j) return;
        const ere = z.re - w.re;
        const eim = z.im - w.im;
        const nre = dre * ere - dim * eim;
        dim = dre * eim + dim * ere;
        dre = nre;
      });
      const p = evalAt(z);
      const den = dre * dre + dim * dim || 1e-300;
      const qre = (p.re * dre + p.im * dim) / den;
      const qim = (p.im * dre - p.re * dim) / den;
      delta = Math.max(delta, Math.hypot(qre, qim));
      return { re: z.re - qre, im: z.im - qim };
    });
    if (delta < 1e-14) break;
  }
  return roots
    .map((z) => ({ re: clean(z.re), im: Math.abs(z.im) < 1e-7 * Math.max(1, Math.abs(z.re)) ? 0 : clean(z.im) }))
    .sort((p, q) => p.re - q.re || p.im - q.im);
}

export function eigenvalues(m: Matrix): ComplexRoot[] {
  return polynomialRoots(characteristicPolynomial(m));
}

export function formatComplexRoot(z: ComplexRoot): string {
  const num = (v: number) => String(Number(v.toPrecision(10))).replace('-', '−');
  if (z.im === 0) return num(z.re);
  const im = Math.abs(z.im) === 1 ? '' : num(Math.abs(z.im));
  if (z.re === 0) return `${z.im < 0 ? '−' : ''}${im}i`;
  return `${num(z.re)} ${z.im < 0 ? '−' : '+'} ${im}i`;
}
