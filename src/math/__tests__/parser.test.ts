import { describe, expect, it } from 'vitest';
import { tokenize } from '../tokenizer';
import { parse } from '../parser';

describe('tokenizer', () => {
  it('splits numbers, operators and identifiers', () => {
    const values = tokenize('2+sin(30)').map((t) => t.value).filter(Boolean);
    expect(values).toEqual(['2', '+', 'sin', '(', '30', ')']);
  });

  it('normalizes unicode operators', () => {
    const values = tokenize('2×3÷4').map((t) => t.value).filter(Boolean);
    expect(values).toEqual(['2', '*', '3', '/', '4']);
  });
});

describe('parser', () => {
  it('respects operator precedence', () => {
    expect(parse('2+3*4')).toMatchObject({
      type: 'binary',
      op: '+',
      right: { type: 'binary', op: '*' },
    });
  });

  it('treats exponent as right-associative', () => {
    const node = parse('2^3^2');
    expect(node).toMatchObject({
      type: 'binary',
      op: '^',
      right: { type: 'binary', op: '^' },
    });
  });

  it('parses function calls', () => {
    expect(parse('gcd(12,18)')).toMatchObject({
      type: 'call',
      callee: 'gcd',
      args: [{ type: 'number', value: 12 }, { type: 'number', value: 18 }],
    });
  });
});
