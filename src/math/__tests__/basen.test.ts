import { describe, expect, it } from 'vitest';
import { evaluateBaseExpression, formatBaseValue, parseBaseValue } from '../basen';

describe('basen', () => {
  it('parses hex without corrupting letters', () => {
    expect(parseBaseValue('FF', 16)).toBe(255);
    expect(formatBaseValue(256, 16)).toBe('100');
  });

  it('evaluates hex addition with precedence', () => {
    expect(evaluateBaseExpression('FF+1', 16)).toBe(256);
    expect(evaluateBaseExpression('10+2*3', 16)).toBe(22);
  });

  it('handles negative decimal values', () => {
    expect(formatBaseValue(-5, 10)).toBe('-5');
    expect(parseBaseValue('-5', 10)).toBe(-5);
  });
});
