const OPERATORS = new Set(['+', '-', '*', '/', '^']);

export function normalizeExpression(expr: string): string {
  return expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√\(/g, 'sqrt(')
    .replace(/√(\d)/g, 'sqrt($1')
    .replace(/∛\(/g, 'cbrt(')
    .replace(/²/g, '^2')
    .replace(/⁻¹/g, '^(-1)')
    .replace(/\^/g, '^')
    .replace(/Ans/gi, '__ANS__');
}

export function insertAtCursor(text: string, insert: string, cursor: number, overwrite = false): { text: string; cursor: number } {
  const before = text.slice(0, cursor);
  const after = overwrite && cursor < text.length
    ? text.slice(cursor + 1)
    : text.slice(cursor);
  return { text: before + insert + after, cursor: cursor + insert.length };
}

export function deleteAtCursor(text: string, cursor: number): { text: string; cursor: number } {
  if (cursor <= 0) return { text, cursor: 0 };
  return { text: text.slice(0, cursor - 1) + text.slice(cursor), cursor: cursor - 1 };
}

export function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let num = ch;
      i++;
      while (i < expr.length && /[0-9.eE]/.test(expr[i])) {
        num += expr[i];
        i++;
      }
      tokens.push(num);
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let name = ch;
      i++;
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        name += expr[i];
        i++;
      }
      tokens.push(name);
      continue;
    }
    if ('+-*/^(),'.includes(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }
    i++;
  }
  return tokens;
}

export function isOperator(token: string): boolean {
  return OPERATORS.has(token);
}

export function validateExpression(expr: string): boolean {
  if (!expr.trim()) return false;
  try {
    const normalized = normalizeExpression(expr);
    const open = (normalized.match(/\(/g) || []).length;
    const close = (normalized.match(/\)/g) || []).length;
    return open === close;
  } catch {
    return false;
  }
}
