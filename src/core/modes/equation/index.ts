import type { DisplayState, EquationState, EqnType, KeyContext, KeyId, ModeResult } from '../../types';
import { DEFAULT_SETTINGS, prefersMathInput, type CalculatorSettings, type Language } from '../../settings';
import { formatNumber, formatValue, localizeNumber, shouldPreferFraction } from '../../format';
import { exactQuadraticRoots } from '../../exactForm';
import { toFraction } from '../../../math/fraction';

export function createEquationState(): EquationState {
  return {
    screen: 'type',
    eqnType: 'quadratic',
    coefficients: coefficientsFor('quadratic'),
    coeffIndex: 0,
    inputBuffer: '',
    resultText: '',
  };
}

const COEFF_LABELS: Record<EqnType, string[]> = {
  quadratic: ['a', 'b', 'c'],
  cubic: ['a', 'b', 'c', 'd'],
  simultaneous: ['a1', 'b1', 'c1', 'a2', 'b2', 'c2'],
  simultaneous3: ['a1', 'b1', 'c1', 'd1', 'a2', 'b2', 'c2', 'd2', 'a3', 'b3', 'c3', 'd3'],
  general: ['a', 'b'],
};

const FORMULAS: Record<EqnType, (row: number) => string> = {
  quadratic: () => 'ax²+bx+c=0',
  cubic: () => 'ax³+bx²+cx+d=0',
  simultaneous: (row) => `a${row}x+b${row}y=c${row}`,
  simultaneous3: (row) => `a${row}x+b${row}y+c${row}z=d${row}`,
  general: () => 'ax=b',
};

const TYPE_NAMES: Record<EqnType, string> = {
  quadratic: 'ax²+bx+c=0',
  cubic: 'ax³+bx²+cx+d=0',
  simultaneous: '2 unknowns',
  simultaneous3: '3 unknowns',
  general: 'ax=b',
};

const EQN_TYPES: EqnType[] = ['quadratic', 'simultaneous', 'general', 'cubic', 'simultaneous3'];
const TYPE_KEYS: Partial<Record<KeyId, EqnType>> = {
  ONE: 'quadratic', TWO: 'simultaneous', THREE: 'general', FOUR: 'cubic', FIVE: 'simultaneous3',
};

export function coefficientsFor(type: EqnType): string[] {
  return COEFF_LABELS[type].map(() => '0');
}

function words(lang: Language) {
  return lang === 'vi'
    ? { all: 'Vô số nghiệm', none: 'Vô nghiệm', noUnique: 'Không có nghiệm duy nhất' }
    : { all: 'Infinite sol.', none: 'No solution', noUnique: 'No unique sol.' };
}

function real(value: number, settings: CalculatorSettings): string {
  return formatValue({ kind: 'real', value: Math.abs(value) < 1e-12 ? 0 : value }, settings);
}

function solveQuadratic(a: number, b: number, c: number, settings: CalculatorSettings, lang: Language): string {
  if (Math.abs(a) < 1e-12) return solveGeneral(b, -c, settings, lang);
  if (shouldPreferFraction(settings)) {
    const roots = exactQuadraticRoots(a, b, c);
    if (roots) {
      if (roots.length === 1) return `x=${localizeNumber(roots[0].text, settings)}`;
      return roots.map((r, i) => `x${i + 1}=${localizeNumber(r.text, settings)}`).join('\n');
    }
  }
  const delta = b * b - 4 * a * c;
  if (delta < 0) {
    const re = formatNumber(-b / (2 * a), settings);
    const im = formatNumber(Math.abs(Math.sqrt(-delta) / (2 * a)), settings);
    return `x1=${re}+${im}i\nx2=${re}-${im}i`;
  }
  if (Math.abs(delta) < 1e-10) {
    return `x=${formatNumber(-b / (2 * a), settings)}`;
  }
  const x1 = (-b + Math.sqrt(delta)) / (2 * a);
  const x2 = (-b - Math.sqrt(delta)) / (2 * a);
  return `x1=${formatNumber(x1, settings)}\nx2=${formatNumber(x2, settings)}`;
}

function divisors(n: number): number[] {
  const out: number[] = [];
  const m = Math.abs(n);
  for (let i = 1; i * i <= m; i++) {
    if (m % i === 0) {
      out.push(i);
      if (i * i !== m) out.push(m / i);
    }
  }
  return out;
}

function evalCubic(a: number, b: number, c: number, d: number, x: number): number {
  return ((a * x + b) * x + c) * x + d;
}

/** Rational root by the rational root theorem, for integer coefficients of moderate size. */
function rationalCubicRoot(a: number, b: number, c: number, d: number): number | null {
  if (![a, b, c, d].every((v) => Number.isInteger(v) && Math.abs(v) <= 1e6)) return null;
  if (d === 0) return 0;
  const ps = divisors(d);
  const qs = divisors(a);
  const scale = Math.max(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d));
  for (const q of qs) {
    for (const p of ps) {
      for (const r of [p / q, -p / q]) {
        if (Math.abs(evalCubic(a, b, c, d, r)) <= 1e-9 * scale * Math.max(1, Math.abs(r) ** 3)) return r;
      }
    }
  }
  return null;
}

/** One real root of ax³+bx²+cx+d via Cardano / trigonometric form, polished with Newton steps. */
function realCubicRoot(a: number, b: number, c: number, d: number): number {
  const B = b / a, C = c / a, D = d / a;
  const p = C - (B * B) / 3;
  const q = (2 * B ** 3) / 27 - (B * C) / 3 + D;
  const disc = (q / 2) ** 2 + (p / 3) ** 3;
  let t: number;
  if (disc >= 0) {
    const s = Math.sqrt(disc);
    t = Math.cbrt(-q / 2 + s) + Math.cbrt(-q / 2 - s);
  } else {
    const m = 2 * Math.sqrt(-p / 3);
    const theta = Math.acos(Math.max(-1, Math.min(1, (3 * q) / (p * m)))) / 3;
    t = m * Math.cos(theta);
  }
  let x = t - B / 3;
  for (let i = 0; i < 8; i++) {
    const f = evalCubic(a, b, c, d, x);
    const df = (3 * a * x + 2 * b) * x + c;
    if (df === 0) break;
    const step = f / df;
    x -= step;
    if (Math.abs(step) < 1e-15 * Math.max(1, Math.abs(x))) break;
  }
  return x;
}

export function solveCubic(a: number, b: number, c: number, d: number, settings: CalculatorSettings, lang: Language): string {
  if (Math.abs(a) < 1e-12) return solveQuadratic(b, c, d, settings, lang);

  const exact = shouldPreferFraction(settings);
  const rational = exact ? rationalCubicRoot(a, b, c, d) : null;
  const r = rational ?? realCubicRoot(a, b, c, d);
  // Deflate: ax³+bx²+cx+d = (x−r)(ax²+ex+f)
  const e = b + a * r;
  const f = c + e * r;
  const rText = rational !== null ? real(r, settings) : formatNumber(r, settings);

  const rest: { value: number; text: string }[] = [];
  let complex: string[] = [];
  const quad = exact && rational !== null ? exactQuadraticRoots(a, e, f) : null;
  if (quad) {
    for (const root of quad) {
      if (Math.abs(root.im) > 1e-12) complex.push(localizeNumber(root.text, settings));
      else rest.push({ value: root.re, text: localizeNumber(root.text, settings) });
    }
  } else {
    const delta = e * e - 4 * a * f;
    if (delta < -1e-12 * Math.max(1, e * e)) {
      const re = formatNumber(-e / (2 * a), settings);
      const im = formatNumber(Math.abs(Math.sqrt(-delta) / (2 * a)), settings);
      complex = [`${re}+${im}i`, `${re}-${im}i`];
    } else {
      const s = Math.sqrt(Math.max(0, delta));
      for (const v of [(-e + s) / (2 * a), (-e - s) / (2 * a)]) rest.push({ value: v, text: formatNumber(v, settings) });
    }
  }

  const reals = [{ value: r, text: rText }, ...rest].sort((p, q) => q.value - p.value);
  const distinct = reals.filter((root, i) => i === 0 || Math.abs(root.value - reals[i - 1].value) > 1e-9 * Math.max(1, Math.abs(root.value)));
  const all = [...distinct.map((root) => root.text), ...complex];
  if (all.length === 1) return `x=${all[0]}`;
  return all.map((text, i) => `x${i + 1}=${text}`).join('\n');
}

function solveSimultaneous(coeffs: number[], settings: CalculatorSettings, lang: Language): string {
  const [a1, b1, c1, a2, b2, c2] = coeffs;
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 1e-12) return words(lang).noUnique;
  const x = (c1 * b2 - c2 * b1) / det;
  const y = (a1 * c2 - a2 * c1) / det;
  return `x=${formatNumber(x, settings)}\ny=${formatNumber(y, settings)}`;
}

/** Gaussian elimination with partial pivoting on the 3×4 augmented matrix. */
export function solveLinearSystem3(coeffs: number[]): number[] | null {
  const m = [0, 1, 2].map((r) => coeffs.slice(r * 4, r * 4 + 4));
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let r = col + 1; r < 3; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    if (Math.abs(m[pivot][col]) < 1e-12) return null;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const factor = m[r][col] / m[col][col];
      for (let k = col; k < 4; k++) m[r][k] -= factor * m[col][k];
    }
  }
  return m.map((row, i) => row[3] / row[i]);
}

function solveSimultaneous3(coeffs: number[], settings: CalculatorSettings, lang: Language): string {
  const sol = solveLinearSystem3(coeffs);
  if (!sol) return words(lang).noUnique;
  return ['x', 'y', 'z'].map((name, i) => {
    const v = sol[i];
    const frac = toFraction(v);
    const clean = frac ? frac.num / frac.den : v;
    return `${name}=${formatNumber(Math.abs(clean) < 1e-12 ? 0 : clean, settings)}`;
  }).join('\n');
}

function solveGeneral(coeff: number, constant: number, settings: CalculatorSettings, lang: Language): string {
  if (Math.abs(coeff) < 1e-12) return constant === 0 ? words(lang).all : words(lang).none;
  return `x=${formatNumber(constant / coeff, settings)}`;
}

function computeResult(state: EquationState, settings: CalculatorSettings, lang: Language): string {
  const vals = state.coefficients.map((c) => parseFloat(c) || 0);
  switch (state.eqnType) {
    case 'quadratic': return solveQuadratic(vals[0], vals[1], vals[2], settings, lang);
    case 'cubic': return solveCubic(vals[0], vals[1], vals[2], vals[3], settings, lang);
    case 'simultaneous': return solveSimultaneous(vals, settings, lang);
    case 'simultaneous3': return solveSimultaneous3(vals, settings, lang);
    case 'general': return solveGeneral(vals[0], vals[1], settings, lang);
    default: return 'ERROR';
  }
}

export function getEquationDisplay(state: EquationState, settings: CalculatorSettings = DEFAULT_SETTINGS): DisplayState {
  const natural = prefersMathInput(settings);
  switch (state.screen) {
    case 'type': {
      const index = EQN_TYPES.indexOf(state.eqnType);
      return {
        lines: [
          { text: `Equation ${index + 1}/${EQN_TYPES.length}`, size: 'small' },
          { text: `▶ ${TYPE_NAMES[state.eqnType]}`, natural },
          { text: '1:Quad 2:Sim2 3:ax=b 4:Cubic 5:Sim3', size: 'small' },
        ],
      };
    }
    case 'input': {
      const labels = COEFF_LABELS[state.eqnType];
      const label = labels[state.coeffIndex];
      const row = Number(label.slice(1)) || 1;
      return {
        lines: [
          { text: FORMULAS[state.eqnType](row), size: 'small', natural },
          { text: `${label}=  (${state.coeffIndex + 1}/${labels.length})`, size: 'small' },
          { text: state.inputBuffer || state.coefficients[state.coeffIndex] || '0', align: 'right' },
        ],
      };
    }
    case 'result':
      return {
        lines: state.resultText.split('\n').map((text) => ({ text, align: 'right' as const, natural })),
      };
    default:
      return { lines: [{ text: 'Equation' }] };
  }
}

export function handleEquationKey(
  state: EquationState,
  key: KeyId,
  ctx: KeyContext,
): { state: EquationState; result: ModeResult } {
  const numKeys: Partial<Record<KeyId, string>> = {
    ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
    FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9', DOT: '.',
  };
  const handled = (next: EquationState) => ({ state: next, result: { handled: true } });
  const withType = (eqnType: EqnType) => handled({ ...state, eqnType, coefficients: coefficientsFor(eqnType) });

  if (key === 'AC') return handled(createEquationState());

  if (state.screen === 'type') {
    if (key === 'UP' || key === 'DOWN') {
      const idx = EQN_TYPES.indexOf(state.eqnType);
      const next = (idx + (key === 'DOWN' ? 1 : -1) + EQN_TYPES.length) % EQN_TYPES.length;
      return withType(EQN_TYPES[next]);
    }
    const picked = TYPE_KEYS[key];
    if (picked) return withType(picked);
    if (key === 'EXE' || key === 'OK') return handled({ ...state, screen: 'input', coeffIndex: 0, inputBuffer: '' });
  }

  if (state.screen === 'input') {
    if (key === 'DEL') return handled({ ...state, inputBuffer: state.inputBuffer.slice(0, -1) });
    if (numKeys[key]) return handled({ ...state, inputBuffer: state.inputBuffer + numKeys[key] });
    if (key === 'MINUS' && state.inputBuffer === '') return handled({ ...state, inputBuffer: '-' });
    if (key === 'UP' || key === 'LEFT') {
      return handled({ ...state, coeffIndex: Math.max(0, state.coeffIndex - 1), inputBuffer: '' });
    }
    if (key === 'EXE' || key === 'DOWN' || key === 'RIGHT') {
      const labels = COEFF_LABELS[state.eqnType];
      const coefficients = [...state.coefficients];
      if (state.inputBuffer && Number.isFinite(parseFloat(state.inputBuffer))) {
        coefficients[state.coeffIndex] = state.inputBuffer;
      }
      if (state.coeffIndex < labels.length - 1) {
        return handled({ ...state, coefficients, coeffIndex: state.coeffIndex + 1, inputBuffer: '' });
      }
      if (key !== 'EXE') return handled({ ...state, coefficients, inputBuffer: '' });
      const nextState = { ...state, coefficients, screen: 'result' as const, inputBuffer: '' };
      return handled({ ...nextState, resultText: computeResult(nextState, ctx.settings, ctx.language) });
    }
    if (key === 'EXIT') return handled({ ...state, screen: 'type', inputBuffer: '' });
  }

  if (state.screen === 'result' && (key === 'EXIT' || key === 'EXE')) {
    return handled({ ...state, screen: 'input', coeffIndex: 0, inputBuffer: '' });
  }

  return { state, result: { handled: false } };
}
