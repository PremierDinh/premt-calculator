export interface Complex {
  re: number;
  im: number;
}

export function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function cSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function cMul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

export function cDiv(a: Complex, b: Complex): Complex {
  const d = b.re * b.re + b.im * b.im;
  if (d === 0) throw new Error('Division by zero');
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
}

export function cAbs(z: Complex): number {
  return Math.hypot(z.re, z.im);
}

export function cArg(z: Complex): number {
  return Math.atan2(z.im, z.re);
}

export function cConj(z: Complex): Complex {
  return { re: z.re, im: -z.im };
}

export function cPow(z: Complex, n: number): Complex {
  const r = cAbs(z) ** n;
  const t = cArg(z) * n;
  return { re: r * Math.cos(t), im: r * Math.sin(t) };
}

export function fromPolar(r: number, theta: number): Complex {
  return { re: r * Math.cos(theta), im: r * Math.sin(theta) };
}

export function formatComplex(
  z: Complex,
  form: 'rect' | 'polar',
  angleUnit: 'deg' | 'rad' | 'gra',
): string {
  if (form === 'polar') {
    let arg = cArg(z);
    if (angleUnit === 'deg') arg = (arg * 180) / Math.PI;
    if (angleUnit === 'gra') arg = (arg * 200) / Math.PI;
    return `${round(cAbs(z))}∠${round(arg)}`;
  }
  const re = round(z.re);
  const im = round(z.im);
  if (Math.abs(z.im) < 1e-12) return String(re);
  const sign = z.im >= 0 ? '+' : '-';
  return `${re}${sign}${Math.abs(im)}i`;
}

function round(n: number): number {
  return parseFloat(n.toPrecision(10));
}
