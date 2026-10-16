import { createEvalContext, evaluateExpression, type EvalContext } from '../math/evaluator';
import type { KeyId } from './types';

const NO_FREE_VARS = { A: NaN, B: NaN, C: NaN, D: NaN, E: NaN, F: NaN, x: NaN, y: NaN, z: NaN };

/** Evaluate a short numeric expression (pi, e, 1/3, sqrt(2), 2π…). Returns null if invalid. */
export function evalNumericInput(text: string, ctx?: Partial<EvalContext>): number | null {
  const trimmed = text.trim().replace(/,/g, '.');
  if (!trimmed) return null;
  try {
    const v = evaluateExpression(
      trimmed,
      createEvalContext({
        ...ctx,
        // Free variables A–F / x,y,z stay NaN unless the caller supplies them (e.g. Variables tool).
        variables: { ...NO_FREE_VARS, ...(ctx?.variables ?? {}) },
      }),
    );
    if (Number.isFinite(v)) return v;
  } catch {
    /* fall through */
  }
  const plain = Number(trimmed);
  return Number.isFinite(plain) ? plain : null;
}

/** Keys that extend a numeric expression buffer (coefficients, matrix cells, …). */
export const NUMERIC_EXPR_KEYS: Partial<Record<KeyId, string>> = {
  ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
  FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9',
  DOT: '.', PLUS: '+', MULT: '×', DIV: '÷',
  LPAREN: '(', RPAREN: ')', PI: 'pi',
  SQRT: 'sqrt(', POWER: '^',
};

/** Append a key's token to a buffer; leading MINUS starts a negative number. */
export function appendNumericKey(buffer: string, key: KeyId): string | null {
  if (key === 'MINUS') return buffer === '' || /[+\-×÷^(]$/.test(buffer) ? `${buffer}-` : `${buffer}-`;
  const token = NUMERIC_EXPR_KEYS[key];
  return token === undefined ? null : buffer + token;
}
