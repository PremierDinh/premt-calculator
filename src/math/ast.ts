export type AstNode =
  | NumberNode
  | IdentifierNode
  | UnaryNode
  | BinaryNode
  | CallNode
  | ListNode;

export interface NumberNode {
  type: 'number';
  value: number;
}

export interface IdentifierNode {
  type: 'ident';
  name: string;
}

export interface UnaryNode {
  type: 'unary';
  op: '+' | '-' | '!' | '%';
  argument: AstNode;
}

export interface BinaryNode {
  type: 'binary';
  op: '+' | '-' | '*' | '/' | '^' | ':';
  left: AstNode;
  right: AstNode;
}

export interface CallNode {
  type: 'call';
  callee: string;
  args: AstNode[];
}

export interface ListNode {
  type: 'list';
  items: AstNode[];
}

export type CalcValue =
  | { kind: 'real'; value: number }
  | { kind: 'complex'; re: number; im: number }
  | { kind: 'fraction'; num: number; den: number }
  | { kind: 'matrix'; data: number[][] }
  | { kind: 'vector'; data: number[] }
  | { kind: 'string'; value: string };

export function real(value: number): CalcValue {
  return { kind: 'real', value };
}

export function isReal(v: CalcValue): v is { kind: 'real'; value: number } {
  return v.kind === 'real';
}

export function toReal(v: CalcValue): number {
  if (v.kind === 'real') return v.value;
  if (v.kind === 'fraction') return v.num / v.den;
  if (v.kind === 'complex' && Math.abs(v.im) < 1e-12) return v.re;
  throw new Error('Expected real number');
}
