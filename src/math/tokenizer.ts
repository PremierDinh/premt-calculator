export type TokenType =
  | 'number'
  | 'ident'
  | 'op'
  | 'lparen'
  | 'rparen'
  | 'lbracket'
  | 'rbracket'
  | 'comma'
  | 'eof';

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

const MULTI_OPS = ['<=', '>=', '!=', '==', '×', '÷', '−', '∠'];

export function tokenize(input: string): Token[] {
  const src = normalizeInput(input);
  const tokens: Token[] = [];
  let i = 0;

  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      const start = i;
      let raw = '';
      while (i < src.length && /[0-9.]/.test(src[i])) {
        raw += src[i];
        i++;
      }
      if (src[i] === 'e' || src[i] === 'E') {
        raw += src[i];
        i++;
        if (src[i] === '+' || src[i] === '-') {
          raw += src[i];
          i++;
        }
        while (i < src.length && /[0-9]/.test(src[i])) {
          raw += src[i];
          i++;
        }
      }
      tokens.push({ type: 'number', value: raw, start, end: i });
      continue;
    }

    if (/[A-Za-z_\u00C0-\u024Fπθλμσ]/.test(ch) || ch === '√' || ch === '∛') {
      const start = i;
      let name = ch;
      i++;
      while (i < src.length && /[A-Za-z0-9_⁻¹]/.test(src[i])) {
        name += src[i];
        i++;
      }
      tokens.push({ type: 'ident', value: name, start, end: i });
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'lparen', value: ch, start: i, end: i + 1 });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen', value: ch, start: i, end: i + 1 });
      i++;
      continue;
    }
    if (ch === '[') {
      tokens.push({ type: 'lbracket', value: ch, start: i, end: i + 1 });
      i++;
      continue;
    }
    if (ch === ']') {
      tokens.push({ type: 'rbracket', value: ch, start: i, end: i + 1 });
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'comma', value: ch, start: i, end: i + 1 });
      i++;
      continue;
    }

    const two = src.slice(i, i + 2);
    if (MULTI_OPS.includes(two) || MULTI_OPS.includes(ch)) {
      const value = MULTI_OPS.includes(two) ? two : ch;
      tokens.push({ type: 'op', value, start: i, end: i + value.length });
      i += value.length;
      continue;
    }

    if ('+-*/^!:%<>'.includes(ch)) {
      tokens.push({ type: 'op', value: ch, start: i, end: i + 1 });
      i++;
      continue;
    }

    throw new Error(`Unexpected character '${ch}' at ${i}`);
  }

  tokens.push({ type: 'eof', value: '', start: i, end: i });
  return tokens;
}

export function normalizeInput(expr: string): string {
  return expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/⁻¹/g, '^(-1)')
    .replace(/√\(/g, 'sqrt(')
    .replace(/∛\(/g, 'cbrt(')
    .replace(/π/g, 'pi')
    .replace(/θ/g, 'theta')
    .replace(/×10\^/g, '*10^')
    .replace(/×10ˣ/g, '*10^');
}
