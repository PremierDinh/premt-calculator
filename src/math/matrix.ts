export type Matrix = number[][];

export function matRows(m: Matrix): number {
  return m.length;
}

export function matCols(m: Matrix): number {
  return m[0]?.length ?? 0;
}

export function matAdd(a: Matrix, b: Matrix): Matrix {
  assertSameSize(a, b);
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}

export function matSub(a: Matrix, b: Matrix): Matrix {
  assertSameSize(a, b);
  return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}

export function matScale(a: Matrix, k: number): Matrix {
  return a.map((row) => row.map((v) => v * k));
}

export function matMul(a: Matrix, b: Matrix): Matrix {
  if (matCols(a) !== matRows(b)) throw new Error('Matrix size mismatch');
  const out: Matrix = [];
  for (let i = 0; i < matRows(a); i++) {
    out[i] = [];
    for (let j = 0; j < matCols(b); j++) {
      let s = 0;
      for (let k = 0; k < matCols(a); k++) s += a[i][k] * b[k][j];
      out[i][j] = s;
    }
  }
  return out;
}

export function transpose(m: Matrix): Matrix {
  return m[0].map((_, j) => m.map((row) => row[j]));
}

export function trace(m: Matrix): number {
  const n = matRows(m);
  if (n !== matCols(m)) throw new Error('Not square');
  let sum = 0;
  for (let i = 0; i < n; i++) sum += m[i][i];
  return sum;
}

export function det(m: Matrix): number {
  const n = matRows(m);
  if (n !== matCols(m)) throw new Error('Not square');
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  if (n === 3) {
    return (
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
      - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
      + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    );
  }
  let sum = 0;
  for (let j = 0; j < n; j++) {
    sum += ((j % 2 === 0 ? 1 : -1) * m[0][j] * det(minor(m, 0, j)));
  }
  return sum;
}

export function inverse(m: Matrix): Matrix {
  const n = matRows(m);
  const d = det(m);
  if (Math.abs(d) < 1e-12) throw new Error('Singular matrix');
  if (n === 1) return [[1 / m[0][0]]];
  const adj: Matrix = [];
  for (let i = 0; i < n; i++) {
    adj[i] = [];
    for (let j = 0; j < n; j++) {
      adj[i][j] = ((i + j) % 2 === 0 ? 1 : -1) * det(minor(m, j, i));
    }
  }
  return matScale(adj, 1 / d);
}

export function identity(n: number): Matrix {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
}

function minor(m: Matrix, row: number, col: number): Matrix {
  return m.filter((_, i) => i !== row).map((r) => r.filter((_, j) => j !== col));
}

function assertSameSize(a: Matrix, b: Matrix): void {
  if (matRows(a) !== matRows(b) || matCols(a) !== matCols(b)) {
    throw new Error('Matrix size mismatch');
  }
}

export function formatMatrix(m: Matrix): string {
  return m.map((row) => `[${row.map((v) => parseFloat(v.toPrecision(6))).join(' ')}]`).join('\n');
}
