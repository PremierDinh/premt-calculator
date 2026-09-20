export type Vector = number[];

export function vecAdd(a: Vector, b: Vector): Vector {
  assertSame(a, b);
  return a.map((v, i) => v + b[i]);
}

export function vecSub(a: Vector, b: Vector): Vector {
  assertSame(a, b);
  return a.map((v, i) => v - b[i]);
}

export function vecScale(a: Vector, k: number): Vector {
  return a.map((v) => v * k);
}

export function dot(a: Vector, b: Vector): number {
  assertSame(a, b);
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

export function cross(a: Vector, b: Vector): Vector {
  if (a.length === 2 && b.length === 2) {
    return [0, 0, a[0] * b[1] - a[1] * b[0]];
  }
  if (a.length !== 3 || b.length !== 3) throw new Error('Cross product needs 2D or 3D');
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function norm(a: Vector): number {
  return Math.sqrt(dot(a, a));
}

export function formatVector(v: Vector): string {
  return `(${v.map((x) => parseFloat(x.toPrecision(6))).join(', ')})`;
}

function assertSame(a: Vector, b: Vector): void {
  if (a.length !== b.length) throw new Error('Vector size mismatch');
}
