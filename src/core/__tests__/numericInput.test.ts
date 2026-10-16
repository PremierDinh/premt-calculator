import { describe, expect, it } from 'vitest';
import { appendNumericKey, evalNumericInput } from '../numericInput';

describe('evalNumericInput', () => {
  it('accepts plain numbers and expressions', () => {
    expect(evalNumericInput('12.5')).toBe(12.5);
    expect(evalNumericInput('1/3')).toBeCloseTo(1 / 3);
    expect(evalNumericInput('2pi')).toBeCloseTo(2 * Math.PI);
    expect(evalNumericInput('sqrt(4)+1')).toBe(3);
    expect(evalNumericInput('')).toBeNull();
    expect(evalNumericInput('x+1')).toBeNull();
  });
});

describe('appendNumericKey', () => {
  it('builds expression buffers', () => {
    expect(appendNumericKey('', 'PI')).toBe('pi');
    expect(appendNumericKey('2', 'MULT')).toBe('2×');
    expect(appendNumericKey('2×', 'PI')).toBe('2×pi');
    expect(appendNumericKey('', 'MINUS')).toBe('-');
    expect(appendNumericKey('3', 'MINUS')).toBe('3-');
  });
});
