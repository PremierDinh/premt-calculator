import type { DisplayState, EquationState, EqnType, KeyContext, KeyId, ModeResult } from '../../types';
import type { CalculatorSettings } from '../../settings';
import { formatNumber } from '../../format';

export function createEquationState(): EquationState {
  return {
    screen: 'type',
    eqnType: 'quadratic',
    coefficients: ['0', '0', '0'],
    coeffIndex: 0,
    inputBuffer: '',
    resultText: '',
  };
}

const COEFF_LABELS: Record<EqnType, string[]> = {
  quadratic: ['a', 'b', 'c'],
  simultaneous: ['a1', 'b1', 'c1', 'a2', 'b2', 'c2'],
  general: ['coeff', 'constant'],
};

function solveQuadratic(a: number, b: number, c: number, settings: CalculatorSettings): string {
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) < 1e-12) return c === 0 ? 'All real' : 'No solution';
    return `x=${formatNumber(-c / b, settings)}`;
  }
  const delta = b * b - 4 * a * c;
  if (delta < 0) {
    const re = -b / (2 * a);
    const im = Math.sqrt(-delta) / (2 * a);
    return `x=${formatNumber(re, settings)}±${formatNumber(im, settings)}i`;
  }
  if (Math.abs(delta) < 1e-10) {
    return `x=${formatNumber(-b / (2 * a), settings)}`;
  }
  const x1 = (-b + Math.sqrt(delta)) / (2 * a);
  const x2 = (-b - Math.sqrt(delta)) / (2 * a);
  return `x1=${formatNumber(x1, settings)}\nx2=${formatNumber(x2, settings)}`;
}

function solveSimultaneous(coeffs: number[], settings: CalculatorSettings): string {
  const [a1, b1, c1, a2, b2, c2] = coeffs;
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 1e-12) return 'No unique sol.';
  const x = (c1 * b2 - c2 * b1) / det;
  const y = (a1 * c2 - a2 * c1) / det;
  return `x=${formatNumber(x, settings)}\ny=${formatNumber(y, settings)}`;
}

function solveGeneral(coeff: number, constant: number, settings: CalculatorSettings): string {
  if (Math.abs(coeff) < 1e-12) return constant === 0 ? 'All real' : 'No solution';
  return `x=${formatNumber(constant / coeff, settings)}`;
}

function computeResult(state: EquationState, settings: CalculatorSettings): string {
  const vals = state.coefficients.map((c) => parseFloat(c) || 0);
  switch (state.eqnType) {
    case 'quadratic':
      return solveQuadratic(vals[0], vals[1], vals[2], settings);
    case 'simultaneous':
      return solveSimultaneous(vals, settings);
    case 'general':
      return solveGeneral(vals[0], vals[1], settings);
    default:
      return 'ERROR';
  }
}

export function getEquationDisplay(state: EquationState): DisplayState {
  switch (state.screen) {
    case 'type':
      return {
        lines: [
          { text: 'Equation', size: 'small' },
          { text: `▶ ${state.eqnType}` },
          { text: '1:Quad 2:Simul 3:Linear', size: 'small' },
        ],
      };
    case 'input': {
      const labels = COEFF_LABELS[state.eqnType];
      return {
        lines: [
          { text: `${labels[state.coeffIndex]}=?`, size: 'small' },
          { text: state.inputBuffer || '0', align: 'right' },
          { text: `${state.coeffIndex + 1}/${labels.length}`, size: 'small' },
        ],
      };
    }
    case 'result':
      return {
        lines: state.resultText.split('\n').map((text) => ({ text, align: 'right' as const })),
      };
    default:
      return { lines: [{ text: 'Equation' }] };
  }
}

const EQN_TYPES: EqnType[] = ['quadratic', 'simultaneous', 'general'];

export function handleEquationKey(
  state: EquationState,
  key: KeyId,
  ctx: KeyContext,
): { state: EquationState; result: ModeResult } {
  const numKeys: Partial<Record<KeyId, string>> = {
    ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
    FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9', DOT: '.',
  };

  if (key === 'AC') return { state: createEquationState(), result: { handled: true } };

  if (state.screen === 'type') {
    if (key === 'UP' || key === 'DOWN') {
      const idx = EQN_TYPES.indexOf(state.eqnType);
      const next = key === 'UP'
        ? (idx - 1 + EQN_TYPES.length) % EQN_TYPES.length
        : (idx + 1) % EQN_TYPES.length;
      const eqnType = EQN_TYPES[next];
      return {
        state: {
          ...state,
          eqnType,
          coefficients: COEFF_LABELS[eqnType].map(() => '0'),
        },
        result: { handled: true },
      };
    }
    if (key === 'ONE') return { state: { ...state, eqnType: 'quadratic', coefficients: ['0', '0', '0'] }, result: { handled: true } };
    if (key === 'TWO') return { state: { ...state, eqnType: 'simultaneous', coefficients: ['0', '0', '0', '0', '0', '0'] }, result: { handled: true } };
    if (key === 'THREE') return { state: { ...state, eqnType: 'general', coefficients: ['0', '0'] }, result: { handled: true } };
    if (key === 'EXE') {
      return {
        state: { ...state, screen: 'input', coeffIndex: 0, inputBuffer: '' },
        result: { handled: true },
      };
    }
  }

  if (state.screen === 'input') {
    if (key === 'DEL') {
      return { state: { ...state, inputBuffer: state.inputBuffer.slice(0, -1) }, result: { handled: true } };
    }
    if (numKeys[key]) {
      return { state: { ...state, inputBuffer: state.inputBuffer + numKeys[key] }, result: { handled: true } };
    }
    if (key === 'MINUS' && state.inputBuffer === '') {
      return { state: { ...state, inputBuffer: '-' }, result: { handled: true } };
    }
    if (key === 'EXE') {
      const labels = COEFF_LABELS[state.eqnType];
      const coefficients = [...state.coefficients];
      coefficients[state.coeffIndex] = state.inputBuffer || '0';
      if (state.coeffIndex < labels.length - 1) {
        return {
          state: { ...state, coefficients, coeffIndex: state.coeffIndex + 1, inputBuffer: '' },
          result: { handled: true },
        };
      }
      const nextState = { ...state, coefficients, screen: 'result' as const, inputBuffer: '' };
      return {
        state: { ...nextState, resultText: computeResult(nextState, ctx.settings) },
        result: { handled: true },
      };
    }
  }

  if (state.screen === 'result' && key === 'EXIT') {
    return { state: { ...state, screen: 'input', coeffIndex: 0, inputBuffer: '' }, result: { handled: true } };
  }

  return { state, result: { handled: false } };
}
