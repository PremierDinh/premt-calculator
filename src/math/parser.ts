import type { AstNode } from './ast';
import { tokenize, type Token } from './tokenizer';

const FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh',
  'log', 'ln', 'log10', 'log2',
  'sqrt', 'cbrt', 'root', 'abs', 'exp', 'floor', 'ceil', 'round',
  'gcd', 'lcm', 'nPr', 'nCr', 'fact',
  'sum', 'prod', 'd', 'int',
  're', 'im', 'arg', 'conj', 'absC',
  'det', 'inv', 'tr', 'dot', 'cross', 'norm', 'dms',
  'min', 'max', 'mod',
]);

export function parse(input: string): AstNode {
  const tokens = tokenize(input);
  const p = new Parser(tokens);
  const node = p.parseExpression();
  p.expect('eof');
  return node;
}

class Parser {
  private i = 0;
  private tokens: Token[];
  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  peek(): Token {
    return this.tokens[this.i];
  }

  eat(): Token {
    const t = this.tokens[this.i];
    this.i++;
    return t;
  }

  expect(type: Token['type'], value?: string): Token {
    const t = this.peek();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new Error(`Expected ${value ?? type}, got ${t.value || t.type}`);
    }
    return this.eat();
  }

  parseExpression(): AstNode {
    return this.parseAdd();
  }

  parseAdd(): AstNode {
    let left = this.parseMul();
    while (this.peek().type === 'op' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.eat().value as '+' | '-';
      left = { type: 'binary', op, left, right: this.parseMul() };
    }
    return left;
  }

  parseMul(): AstNode {
    let left = this.parsePower();
    while (
      this.peek().type === 'op' && (this.peek().value === '*' || this.peek().value === '/' || this.peek().value === ':')
      || this.isImplicitMul()
    ) {
      if (this.isImplicitMul()) {
        left = { type: 'binary', op: '*', left, right: this.parsePower() };
      } else {
        const op = this.eat().value as '*' | '/' | ':';
        left = { type: 'binary', op, left, right: this.parsePower() };
      }
    }
    return left;
  }

  isImplicitMul(): boolean {
    const t = this.peek();
    if (t.type === 'number' || t.type === 'ident' || t.type === 'lparen' || t.type === 'lbracket') {
      return true;
    }
    return false;
  }

  parsePower(): AstNode {
    const left = this.parseUnary();
    if (this.peek().type === 'op' && this.peek().value === '^') {
      this.eat();
      return { type: 'binary', op: '^', left, right: this.parsePower() };
    }
    return left;
  }

  parseUnary(): AstNode {
    if (this.peek().type === 'op' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.eat().value as '+' | '-';
      return { type: 'unary', op, argument: this.parseUnary() };
    }
    return this.parsePostfix();
  }

  parsePostfix(): AstNode {
    let node = this.parsePrimary();
    while (this.peek().type === 'op' && (this.peek().value === '!' || this.peek().value === '%')) {
      const op = this.eat().value as '!' | '%';
      node = { type: 'unary', op, argument: node };
    }
    return node;
  }

  parsePrimary(): AstNode {
    const t = this.peek();

    if (t.type === 'number') {
      this.eat();
      return { type: 'number', value: Number(t.value) };
    }

    if (t.type === 'ident') {
      this.eat();
      const name = normalizeIdent(t.value);
      if (this.peek().type === 'lparen' || FUNCTIONS.has(name)) {
        if (this.peek().type === 'lparen') {
          this.eat();
          const args = this.parseArgList('rparen');
          this.expect('rparen');
          return { type: 'call', callee: name, args };
        }
      }
      return { type: 'ident', name };
    }

    if (t.type === 'lparen') {
      this.eat();
      const inner = this.parseExpression();
      this.expect('rparen');
      return inner;
    }

    if (t.type === 'lbracket') {
      this.eat();
      const items = this.parseArgList('rbracket');
      this.expect('rbracket');
      return { type: 'list', items };
    }

    throw new Error(`Unexpected token ${t.value || t.type}`);
  }

  parseArgList(end: Token['type']): AstNode[] {
    const args: AstNode[] = [];
    if (this.peek().type === end) return args;
    args.push(this.parseExpression());
    while (this.peek().type === 'comma') {
      this.eat();
      args.push(this.parseExpression());
    }
    return args;
  }
}

function normalizeIdent(name: string): string {
  const map: Record<string, string> = {
    'sin^-1': 'asin',
    'cos^-1': 'acos',
    'tan^-1': 'atan',
    log: 'log10',
    PreAns: 'PreAns',
    Ans: 'Ans',
  };
  return map[name] ?? name;
}
