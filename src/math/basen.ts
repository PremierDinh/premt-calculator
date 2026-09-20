export type BaseNBase = 2 | 8 | 10 | 16;

export function parseBaseValue(text: string, base: BaseNBase): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  if (base === 10) return parseInt(cleaned, 10);
  const negative = cleaned.startsWith('-');
  const body = negative ? cleaned.slice(1) : cleaned;
  const value = parseInt(body, base);
  if (Number.isNaN(value)) throw new Error('Invalid number');
  return negative ? -value : value;
}

export function formatBaseValue(n: number, base: BaseNBase): string {
  if (base === 10) return String(n | 0);
  const negative = n < 0;
  const abs = Math.abs(n);
  const body = abs.toString(base).toUpperCase();
  return negative ? `-${body}` : body;
}

export function evaluateBaseExpression(expr: string, base: BaseNBase): number {
  const tokens = tokenizeBaseExpr(expr);
  if (tokens.length === 0) return 0;
  let i = 0;

  function parseExpr(): number {
    let value = parseTerm();
    while (i < tokens.length && (tokens[i] === '+' || tokens[i] === '-')) {
      const op = tokens[i++];
      const rhs = parseTerm();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseUnary();
    while (i < tokens.length && (tokens[i] === '*' || tokens[i] === '/')) {
      const op = tokens[i++];
      const rhs = parseUnary();
      if (op === '*') value *= rhs;
      else value = Math.trunc(value / rhs);
    }
    return value;
  }

  function parseUnary(): number {
    if (tokens[i] === '-') {
      i++;
      return -parsePrimary();
    }
    if (tokens[i] === '+') {
      i++;
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    const token = tokens[i++];
    if (!token) throw new Error('Unexpected end');
    if (token === '(') {
      const value = parseExpr();
      if (tokens[i] !== ')') throw new Error('Missing )');
      i++;
      return value;
    }
    if (token === ')') throw new Error('Unexpected )');
    return parseBaseValue(token, base);
  }

  const result = parseExpr();
  if (i !== tokens.length) throw new Error('Unexpected token');
  return result;
}

function tokenizeBaseExpr(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if ('+-*/()'.includes(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }
    let j = i;
    if (ch === '-' && (tokens.length === 0 || '+-*/('.includes(tokens[tokens.length - 1]!))) {
      j++;
    }
    while (j < expr.length && /[0-9A-Fa-f]/.test(expr[j]!)) j++;
    if (j === i) throw new Error(`Invalid token at ${i}`);
    tokens.push(expr.slice(i, j));
    i = j;
  }
  return tokens;
}
