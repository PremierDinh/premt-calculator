import type { AstNode, CalcValue } from './ast';
import { real, toReal } from './ast';
import { parse } from './parser';
import { addFrac, divFrac, gcd, lcm, mulFrac, simplify, subFrac, toFraction } from './fraction';
import { cAdd, cArg, cConj, cDiv, cMul, cPow, cSub, fromPolar, type Complex } from './complex';
import { det, inverse, matAdd, matMul, matScale, matSub, trace, type Matrix } from './matrix';
import { cross, dot, formatVector, norm, vecAdd, vecScale, vecSub, type Vector } from './vector';
import { factorial, nCr, nPr } from './combinatorics';
import { derivative, integrate, product, summation } from './calculus';
import type { AngleUnit, VariableName } from '../core/types';

export interface EvalContext {
  ans: number;
  preAns: number;
  variables: Record<VariableName, number>;
  matrices: Record<string, Matrix>;
  vectors: Record<string, Vector>;
  angleUnit: AngleUnit;
}

export function createEvalContext(partial?: Partial<EvalContext>): EvalContext {
  return {
    ans: partial?.ans ?? 0,
    preAns: partial?.preAns ?? 0,
    variables: {
      A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, x: 0, y: 0, z: 0,
      ...partial?.variables,
    },
    matrices: partial?.matrices ?? {},
    vectors: partial?.vectors ?? {},
    angleUnit: partial?.angleUnit ?? 'deg',
  };
}

export function evaluate(expr: string, ctx: EvalContext): CalcValue {
  return evalNode(parse(expr), ctx);
}

export function evaluateExpression(expr: string, ctx: EvalContext): number {
  return toReal(evaluate(expr, ctx));
}

export function evaluateFunction(expr: string, x: number, ctx: EvalContext): number {
  return evaluateExpression(expr, { ...ctx, variables: { ...ctx.variables, x } });
}

export function evalNode(node: AstNode, ctx: EvalContext): CalcValue {
  switch (node.type) {
    case 'number':
      return real(node.value);
    case 'ident':
      return evalIdent(node.name, ctx);
    case 'unary':
      return evalUnary(node.op, evalNode(node.argument, ctx));
    case 'binary':
      return evalBinary(node.op, evalNode(node.left, ctx), evalNode(node.right, ctx));
    case 'call':
      return evalCall(node.callee, node.args, ctx);
    case 'list': {
      const items = node.items.map((item) => toReal(evalNode(item, ctx)));
      return { kind: 'vector', data: items };
    }
    default:
      throw new Error('Unknown AST node');
  }
}

function evalIdent(name: string, ctx: EvalContext): CalcValue {
  const key = name;
  if (key === 'pi' || key === 'π') return real(Math.PI);
  if (key === 'e') return real(Math.E);
  if (key === 'i') return { kind: 'complex', re: 0, im: 1 };
  if (key === 'Ans') return real(ctx.ans);
  if (key === 'PreAns') return real(ctx.preAns);
  if (key in ctx.variables) return real(ctx.variables[key as VariableName]);
  if (ctx.matrices[key]) return { kind: 'matrix', data: ctx.matrices[key] };
  if (ctx.vectors[key]) return { kind: 'vector', data: ctx.vectors[key] };
  throw new Error(`Undefined ${name}`);
}

function evalUnary(op: '+' | '-' | '!' | '%', value: CalcValue): CalcValue {
  if (op === '+') return value;
  if (op === '!') return real(factorial(toReal(value)));
  if (op === '%') return real(toReal(value) / 100);
  if (value.kind === 'complex') return { kind: 'complex', re: -value.re, im: -value.im };
  if (value.kind === 'fraction') return { kind: 'fraction', num: -value.num, den: value.den };
  if (value.kind === 'vector') return { kind: 'vector', data: vecScale(value.data, -1) };
  if (value.kind === 'matrix') return { kind: 'matrix', data: matScale(value.data, -1) };
  return real(-toReal(value));
}

function evalBinary(op: string, left: CalcValue, right: CalcValue): CalcValue {
  if (left.kind === 'complex' || right.kind === 'complex') {
    return evalComplexBinary(op, toComplex(left), toComplex(right));
  }
  if (left.kind === 'matrix' || right.kind === 'matrix') {
    return evalMatrixBinary(op, left, right);
  }
  if (left.kind === 'vector' || right.kind === 'vector') {
    return evalVectorBinary(op, left, right);
  }
  if (left.kind === 'fraction' || right.kind === 'fraction') {
    return evalFracBinary(op, toFrac(left), toFrac(right));
  }
  const a = toReal(left);
  const b = toReal(right);
  switch (op) {
    case '+': return real(a + b);
    case '-': return real(a - b);
    case '*': return real(a * b);
    case '/': {
      if (b === 0) throw new Error('Division by zero');
      const frac = toFraction(a / b);
      if (frac && frac.den !== 1 && Number.isInteger(a) && Number.isInteger(b)) {
        return { kind: 'fraction', ...frac };
      }
      return real(a / b);
    }
    case '^': return real(a ** b);
    case ':': return real(a / b);
    default: throw new Error(`Unknown operator ${op}`);
  }
}

function evalFracBinary(op: string, a: { num: number; den: number }, b: { num: number; den: number }): CalcValue {
  switch (op) {
    case '+': return { kind: 'fraction', ...addFrac(a, b) };
    case '-': return { kind: 'fraction', ...subFrac(a, b) };
    case '*': return { kind: 'fraction', ...mulFrac(a, b) };
    case '/': return { kind: 'fraction', ...divFrac(a, b) };
    case '^': return real((a.num / a.den) ** (b.num / b.den));
    default: return real(NaN);
  }
}

function evalComplexBinary(op: string, a: Complex, b: Complex): CalcValue {
  let z: Complex;
  switch (op) {
    case '+': z = cAdd(a, b); break;
    case '-': z = cSub(a, b); break;
    case '*': z = cMul(a, b); break;
    case '/': z = cDiv(a, b); break;
    case '^': z = cPow(a, toReal({ kind: 'complex', ...b })); break;
    default: throw new Error(`Unknown operator ${op}`);
  }
  if (Math.abs(z.im) < 1e-12) return real(z.re);
  return { kind: 'complex', ...z };
}

function evalMatrixBinary(op: string, left: CalcValue, right: CalcValue): CalcValue {
  if (left.kind === 'matrix' && right.kind === 'matrix') {
    if (op === '+') return { kind: 'matrix', data: matAdd(left.data, right.data) };
    if (op === '-') return { kind: 'matrix', data: matSub(left.data, right.data) };
    if (op === '*') return { kind: 'matrix', data: matMul(left.data, right.data) };
  }
  if (left.kind === 'matrix' && (right.kind === 'real' || right.kind === 'fraction')) {
    if (op === '*' || op === '/') {
      const k = op === '*' ? toReal(right) : 1 / toReal(right);
      return { kind: 'matrix', data: matScale(left.data, k) };
    }
  }
  if ((left.kind === 'real' || left.kind === 'fraction') && right.kind === 'matrix' && op === '*') {
    return { kind: 'matrix', data: matScale(right.data, toReal(left)) };
  }
  throw new Error('Invalid matrix operation');
}

function evalVectorBinary(op: string, left: CalcValue, right: CalcValue): CalcValue {
  if (left.kind === 'vector' && right.kind === 'vector') {
    if (op === '+') return { kind: 'vector', data: vecAdd(left.data, right.data) };
    if (op === '-') return { kind: 'vector', data: vecSub(left.data, right.data) };
    if (op === '*') return real(dot(left.data, right.data));
  }
  if (left.kind === 'vector' && (right.kind === 'real' || right.kind === 'fraction')) {
    const k = op === '*' ? toReal(right) : op === '/' ? 1 / toReal(right) : null;
    if (k !== null) return { kind: 'vector', data: vecScale(left.data, k) };
  }
  if ((left.kind === 'real' || left.kind === 'fraction') && right.kind === 'vector' && op === '*') {
    return { kind: 'vector', data: vecScale(right.data, toReal(left)) };
  }
  throw new Error('Invalid vector operation');
}

function evalCall(name: string, args: AstNode[], ctx: EvalContext): CalcValue {
  const nums = () => args.map((a) => toReal(evalNode(a, ctx)));
  const toRad = (x: number) => {
    if (ctx.angleUnit === 'deg') return (x * Math.PI) / 180;
    if (ctx.angleUnit === 'gra') return (x * Math.PI) / 200;
    return x;
  };
  const fromRad = (x: number) => {
    if (ctx.angleUnit === 'deg') return (x * 180) / Math.PI;
    if (ctx.angleUnit === 'gra') return (x * 200) / Math.PI;
    return x;
  };

  switch (name) {
    case 'sin': return real(Math.sin(toRad(nums()[0])));
    case 'cos': return real(Math.cos(toRad(nums()[0])));
    case 'tan': return real(Math.tan(toRad(nums()[0])));
    case 'asin': return real(fromRad(Math.asin(nums()[0])));
    case 'acos': return real(fromRad(Math.acos(nums()[0])));
    case 'atan': return real(fromRad(Math.atan(nums()[0])));
    case 'sinh': return real(Math.sinh(nums()[0]));
    case 'cosh': return real(Math.cosh(nums()[0]));
    case 'tanh': return real(Math.tanh(nums()[0]));
    case 'log10':
    case 'log': {
      const v = nums();
      if (v.length >= 2) return real(Math.log(v[1]) / Math.log(v[0]));
      return real(Math.log10(v[0]));
    }
    case 'ln': return real(Math.log(nums()[0]));
    case 'log2': return real(Math.log2(nums()[0]));
    case 'sqrt': return real(Math.sqrt(nums()[0]));
    case 'cbrt': return real(Math.cbrt(nums()[0]));
    case 'root': {
      const v = nums();
      return real(v[1] ** (1 / v[0]));
    }
    case 'abs': return real(Math.abs(nums()[0]));
    case 'exp': return real(Math.exp(nums()[0]));
    case 'floor': return real(Math.floor(nums()[0]));
    case 'ceil': return real(Math.ceil(nums()[0]));
    case 'round': return real(Math.round(nums()[0]));
    case 'min': return real(Math.min(...nums()));
    case 'max': return real(Math.max(...nums()));
    case 'mod': return real(nums()[0] % nums()[1]);
    case 'gcd': return real(gcd(nums()[0], nums()[1]));
    case 'lcm': return real(lcm(nums()[0], nums()[1]));
    case 'nPr': return real(nPr(nums()[0], nums()[1]));
    case 'nCr': return real(nCr(nums()[0], nums()[1]));
    case 'fact': return real(factorial(nums()[0]));
    case 'sum': {
      const [start, end] = nums();
      const body = args[2];
      return real(summation((k) => toReal(evalNode(body, withX(ctx, k))), start, end));
    }
    case 'prod': {
      const [start, end] = nums();
      const body = args[2];
      return real(product((k) => toReal(evalNode(body, withX(ctx, k))), start, end));
    }
    case 'd': {
      const x0 = toReal(evalNode(args[1], ctx));
      const body = args[0];
      return real(derivative((x) => toReal(evalNode(body, withX(ctx, x))), x0));
    }
    case 'int': {
      const a = toReal(evalNode(args[1], ctx));
      const b = toReal(evalNode(args[2], ctx));
      const body = args[0];
      return real(integrate((x) => toReal(evalNode(body, withX(ctx, x))), a, b));
    }
    case 're': return real(toComplex(evalNode(args[0], ctx)).re);
    case 'im': return real(toComplex(evalNode(args[0], ctx)).im);
    case 'arg': return real(fromRad(cArg(toComplex(evalNode(args[0], ctx)))));
    case 'conj': {
      const z = cConj(toComplex(evalNode(args[0], ctx)));
      return { kind: 'complex', ...z };
    }
    case 'polar': {
      const [r, th] = nums();
      const rad = toRad(th);
      const z = fromPolar(r, rad);
      return { kind: 'complex', ...z };
    }
    case 'det': {
      const v = evalNode(args[0], ctx);
      if (v.kind !== 'matrix') throw new Error('det needs matrix');
      return real(det(v.data));
    }
    case 'inv': {
      const v = evalNode(args[0], ctx);
      if (v.kind !== 'matrix') throw new Error('inv needs matrix');
      return { kind: 'matrix', data: inverse(v.data) };
    }
    case 'tr': {
      const v = evalNode(args[0], ctx);
      if (v.kind !== 'matrix') throw new Error('tr needs matrix');
      return real(trace(v.data));
    }
    case 'dms': {
      const deg = toReal(evalNode(args[0], ctx));
      const d = Math.trunc(deg);
      const mFloat = Math.abs(deg - d) * 60;
      const m = Math.trunc(mFloat);
      const s = (mFloat - m) * 60;
      return real(d + m / 100 + s / 10000);
    }
    case 'dot': {
      const a = evalNode(args[0], ctx);
      const b = evalNode(args[1], ctx);
      if (a.kind !== 'vector' || b.kind !== 'vector') throw new Error('dot needs vectors');
      return real(dot(a.data, b.data));
    }
    case 'cross': {
      const a = evalNode(args[0], ctx);
      const b = evalNode(args[1], ctx);
      if (a.kind !== 'vector' || b.kind !== 'vector') throw new Error('cross needs vectors');
      return { kind: 'vector', data: cross(a.data, b.data) };
    }
    case 'norm': {
      const a = evalNode(args[0], ctx);
      if (a.kind !== 'vector') throw new Error('norm needs vector');
      return real(norm(a.data));
    }
    default:
      throw new Error(`Unknown function ${name}`);
  }
}

function withX(ctx: EvalContext, x: number): EvalContext {
  return { ...ctx, variables: { ...ctx.variables, x } };
}

function toComplex(v: CalcValue): Complex {
  if (v.kind === 'complex') return { re: v.re, im: v.im };
  if (v.kind === 'real') return { re: v.value, im: 0 };
  if (v.kind === 'fraction') return { re: v.num / v.den, im: 0 };
  throw new Error('Expected complex');
}

function toFrac(v: CalcValue): { num: number; den: number } {
  if (v.kind === 'fraction') return simplify(v);
  if (v.kind === 'real') {
    const f = toFraction(v.value);
    if (f) return f;
    return { num: v.value, den: 1 };
  }
  throw new Error('Expected fraction');
}

export function valueToNumber(v: CalcValue): number {
  return toReal(v);
}

export { formatVector };
