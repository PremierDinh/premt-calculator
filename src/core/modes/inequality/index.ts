import type { DisplayState, InequalityState, KeyContext, KeyId, ModeResult } from '../../types';
import type { InequalityKind } from '../../../math/equations';
import { formatNumber, localizeNumber, shouldPreferFraction } from '../../format';
import { exactQuadraticRoots } from '../../exactForm';
import { prefersMathInput, type CalculatorSettings, type Language } from '../../settings';

export function createInequalityState(): InequalityState {
  return {
    screen: 'type',
    ineqType: 'linear',
    kind: '>',
    coefficients: ['1', '0'],
    coeffIndex: 0,
    inputBuffer: '',
    resultText: '',
  };
}

const SYMBOL: Record<InequalityKind, string> = { '>': '>', '<': '<', '>=': '≥', '<=': '≤' };
const FLIP: Record<InequalityKind, InequalityKind> = { '>': '<', '<': '>', '>=': '<=', '<=': '>=' };

function words(lang: Language) {
  return lang === 'vi'
    ? { or: 'hoặc ', all: 'Mọi x', none: 'Vô nghiệm' }
    : { or: 'or ', all: 'All real', none: 'No solution' };
}

function formLabel(state: InequalityState): string {
  const lhs = state.ineqType === 'linear' ? 'ax+b' : 'ax²+bx+c';
  return `${lhs}${SYMBOL[state.kind]}0`;
}

export function getInequalityDisplay(state: InequalityState, settings?: CalculatorSettings): DisplayState {
  if (state.screen === 'type') {
    return { lines: [{ text: 'Inequality', size: 'small' }, { text: `▶ ${state.ineqType}` }, { text: '1:Linear 2:Quad', size: 'small' }] };
  }
  if (state.screen === 'kind') {
    return { lines: [{ text: formLabel(state), size: 'small' }, { text: `▶ ${SYMBOL[state.kind]}` }, { text: '1:> 2:< 3:≥ 4:≤', size: 'small' }] };
  }
  if (state.screen === 'input') {
    const labels = state.ineqType === 'linear' ? ['a', 'b'] : ['a', 'b', 'c'];
    return {
      lines: [
        { text: formLabel(state), size: 'small' },
        { text: `${labels[state.coeffIndex]}=?`, size: 'small' },
        { text: state.inputBuffer || '0', align: 'right' },
      ],
    };
  }
  const natural = settings ? prefersMathInput(settings) : true;
  return {
    lines: [
      { text: formLabel(state), size: 'small' },
      ...state.resultText.split('\n').map((text) => ({ text, align: 'right' as const, natural })),
    ],
  };
}

function holds(value: number, kind: InequalityKind): boolean {
  switch (kind) {
    case '>': return value > 0;
    case '<': return value < 0;
    case '>=': return value >= 0;
    case '<=': return value <= 0;
  }
}

export function solveLinear(a: number, b: number, kind: InequalityKind, settings: CalculatorSettings, lang: Language): string {
  const w = words(lang);
  if (Math.abs(a) < 1e-12) return holds(b, kind) ? w.all : w.none;
  const op = a < 0 ? FLIP[kind] : kind;
  return `x${SYMBOL[op]}${formatNumber(-b / a, settings)}`;
}

export function solveQuadratic(
  a: number, b: number, c: number, kind: InequalityKind, settings: CalculatorSettings, lang: Language,
): string {
  if (Math.abs(a) < 1e-12) return solveLinear(b, c, kind, settings, lang);
  const w = words(lang);
  const disc = b * b - 4 * a * c;
  const outsideWanted = (a > 0) === (kind === '>' || kind === '>=');
  const strict = kind === '>' || kind === '<';

  if (disc < -1e-12) return outsideWanted ? w.all : w.none;

  const exact = shouldPreferFraction(settings) ? exactQuadraticRoots(a, b, c) : null;
  const roots = exact
    ? exact.map((r) => ({ value: r.re, text: localizeNumber(r.text, settings) }))
    : [(-b - Math.sqrt(Math.max(0, disc))) / (2 * a), (-b + Math.sqrt(Math.max(0, disc))) / (2 * a)]
      .map((value) => ({ value, text: formatNumber(value, settings) }));
  roots.sort((p, q) => p.value - q.value);

  if (Math.abs(disc) <= 1e-12 || roots.length === 1 || roots[0].text === roots[1]?.text) {
    const r = roots[0].text;
    if (outsideWanted) return strict ? `x≠${r}` : w.all;
    return strict ? w.none : `x=${r}`;
  }

  const [lo, hi] = roots.map((r) => r.text);
  const lt = strict ? '<' : '≤';
  const gt = strict ? '>' : '≥';
  if (outsideWanted) return `x${lt}${lo}\n${w.or}x${gt}${hi}`;
  return `${lo}${lt}x${lt}${hi}`;
}

const KINDS: InequalityKind[] = ['>', '<', '>=', '<='];

export function handleInequalityKey(
  state: InequalityState,
  key: KeyId,
  ctx: KeyContext,
): { state: InequalityState; result: ModeResult } {
  const nums: Partial<Record<KeyId, string>> = {
    ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
    FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9', DOT: '.',
  };
  if (key === 'AC') return { state: createInequalityState(), result: { handled: true } };

  if (state.screen === 'type') {
    if (key === 'ONE') return { state: { ...state, ineqType: 'linear', coefficients: ['1', '0'] }, result: { handled: true } };
    if (key === 'TWO') return { state: { ...state, ineqType: 'quadratic', coefficients: ['1', '0', '0'] }, result: { handled: true } };
    if (key === 'UP' || key === 'DOWN') {
      const ineqType = state.ineqType === 'linear' ? 'quadratic' : 'linear';
      return {
        state: { ...state, ineqType, coefficients: ineqType === 'linear' ? ['1', '0'] : ['1', '0', '0'] },
        result: { handled: true },
      };
    }
    if (key === 'EXE') return { state: { ...state, screen: 'kind' }, result: { handled: true } };
  }

  if (state.screen === 'kind') {
    if (key === 'ONE') return { state: { ...state, kind: '>' }, result: { handled: true } };
    if (key === 'TWO') return { state: { ...state, kind: '<' }, result: { handled: true } };
    if (key === 'THREE') return { state: { ...state, kind: '>=' }, result: { handled: true } };
    if (key === 'FOUR') return { state: { ...state, kind: '<=' }, result: { handled: true } };
    if (key === 'UP' || key === 'DOWN') {
      const i = KINDS.indexOf(state.kind);
      const next = KINDS[(i + (key === 'DOWN' ? 1 : -1) + 4) % 4];
      return { state: { ...state, kind: next }, result: { handled: true } };
    }
    if (key === 'EXE') return { state: { ...state, screen: 'input', coeffIndex: 0, inputBuffer: '' }, result: { handled: true } };
  }

  if (state.screen === 'input') {
    if (key === 'DEL') return { state: { ...state, inputBuffer: state.inputBuffer.slice(0, -1) }, result: { handled: true } };
    if (nums[key]) return { state: { ...state, inputBuffer: state.inputBuffer + nums[key] }, result: { handled: true } };
    if (key === 'MINUS' && !state.inputBuffer) return { state: { ...state, inputBuffer: '-' }, result: { handled: true } };
    if (key === 'EXE') {
      const coefficients = [...state.coefficients];
      coefficients[state.coeffIndex] = state.inputBuffer || '0';
      const done = state.coeffIndex >= coefficients.length - 1;
      if (!done) {
        return { state: { ...state, coefficients, coeffIndex: state.coeffIndex + 1, inputBuffer: '' }, result: { handled: true } };
      }
      const vals = coefficients.map((c) => parseFloat(c) || 0);
      const resultText = state.ineqType === 'linear'
        ? solveLinear(vals[0], vals[1], state.kind, ctx.settings, ctx.language)
        : solveQuadratic(vals[0], vals[1], vals[2], state.kind, ctx.settings, ctx.language);
      return { state: { ...state, coefficients, screen: 'result', resultText }, result: { handled: true } };
    }
  }

  if (state.screen === 'result' && (key === 'EXIT' || key === 'EXE')) {
    return { state: { ...state, screen: 'input', coeffIndex: 0, inputBuffer: '' }, result: { handled: true } };
  }

  return { state, result: { handled: false } };
}
