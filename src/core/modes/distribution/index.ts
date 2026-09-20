import type { DisplayState, DistFunc, DistType, DistributionState, KeyContext, KeyId, ModeResult } from '../../types';
import {
  binomialCdf, binomialInv, binomialPdf,
  normalCdf, normalInv, normalPdf,
  poissonCdf, poissonInv, poissonPdf,
} from '../../../math/distribution';
import { formatNumber } from '../../format';

const DIST_TYPES: DistType[] = ['normal', 'binomial', 'poisson'];
const DIST_FUNCS: DistFunc[] = ['pd', 'cd', 'inv'];

const PARAM_LABELS: Record<DistType, string[]> = {
  normal: ['x', 'μ', 'σ'],
  binomial: ['x', 'n', 'p'],
  poisson: ['x', 'λ'],
};

const INV_PARAM_LABELS: Record<DistType, string[]> = {
  normal: ['area', 'μ', 'σ'],
  binomial: ['area', 'n', 'p'],
  poisson: ['area', 'λ'],
};

function labelsFor(state: DistributionState): string[] {
  return state.distFunc === 'inv' ? INV_PARAM_LABELS[state.distType] : PARAM_LABELS[state.distType];
}

export function createDistributionState(): DistributionState {
  return {
    screen: 'type',
    distType: 'normal',
    distFunc: 'pd',
    params: {},
    paramIndex: 0,
    paramLabels: PARAM_LABELS.normal,
    inputBuffer: '',
    resultText: '',
  };
}

function computeResult(state: DistributionState): string {
  const labels = labelsFor(state);
  const vals = labels.map((l) => parseFloat(state.params[l] ?? '0'));
  try {
    switch (state.distType) {
      case 'normal': {
        const [x, mean, std] = vals;
        if (std <= 0) return 'Domain ERROR';
        if (state.distFunc === 'pd') return formatNumber(normalPdf(x, mean, std), 'norm');
        if (state.distFunc === 'cd') return formatNumber(normalCdf(x, mean, std), 'norm');
        if (x <= 0 || x >= 1) return 'Domain ERROR';
        return formatNumber(normalInv(x, mean, std), 'norm');
      }
      case 'binomial': {
        const [x, n, p] = vals;
        const k = Math.round(x);
        const ni = Math.round(n);
        if (p < 0 || p > 1 || ni < 0) return 'Domain ERROR';
        if (state.distFunc === 'pd') return formatNumber(binomialPdf(k, ni, p), 'norm');
        if (state.distFunc === 'cd') return formatNumber(binomialCdf(k, ni, p), 'norm');
        if (x <= 0 || x >= 1) return 'Domain ERROR';
        return formatNumber(binomialInv(x, ni, p), 'norm');
      }
      case 'poisson': {
        const [x, lambda] = vals;
        const k = Math.round(x);
        if (lambda <= 0) return 'Domain ERROR';
        if (state.distFunc === 'pd') return formatNumber(poissonPdf(k, lambda), 'norm');
        if (state.distFunc === 'cd') return formatNumber(poissonCdf(k, lambda), 'norm');
        if (x <= 0 || x >= 1) return 'Domain ERROR';
        return formatNumber(poissonInv(x, lambda), 'norm');
      }
      default:
        return 'ERROR';
    }
  } catch {
    return 'Math ERROR';
  }
}

export function getDistributionDisplay(state: DistributionState): DisplayState {
  switch (state.screen) {
    case 'type':
      return {
        lines: [
          { text: 'Distribution', size: 'small' },
          { text: `▶ ${state.distType}` },
          { text: '1:Normal 2:Binomial 3:Poisson', size: 'small' },
        ],
      };
    case 'func':
      return {
        lines: [
          { text: state.distType, size: 'small' },
          { text: `▶ ${state.distFunc === 'pd' ? 'P(' : state.distFunc === 'cd' ? 'Q(' : 'Inv'}` },
          { text: '1:PD 2:CD 3:Inv', size: 'small' },
        ],
      };
    case 'input':
      return {
        lines: [
          { text: `${state.paramLabels[state.paramIndex]}=?`, size: 'small' },
          { text: state.inputBuffer || '0', align: 'right' },
          { text: `${state.paramIndex + 1}/${state.paramLabels.length}`, size: 'small' },
        ],
      };
    case 'result':
      return {
        lines: [
          { text: `${state.distType} ${state.distFunc}`, size: 'small' },
          { text: state.resultText, align: 'right', size: 'large' },
        ],
      };
    default:
      return { lines: [{ text: 'Distribution' }] };
  }
}

export function handleDistributionKey(
  state: DistributionState,
  key: KeyId,
  _ctx: KeyContext,
): { state: DistributionState; result: ModeResult } {
  const numKeys: Partial<Record<KeyId, string>> = {
    ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
    FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9', DOT: '.',
  };

  if (key === 'AC') return { state: createDistributionState(), result: { handled: true } };

  if (state.screen === 'type') {
    if (key === 'UP' || key === 'DOWN') {
      const idx = DIST_TYPES.indexOf(state.distType);
      const next = key === 'UP'
        ? (idx - 1 + DIST_TYPES.length) % DIST_TYPES.length
        : (idx + 1) % DIST_TYPES.length;
      const distType = DIST_TYPES[next];
      return {
        state: { ...state, distType, paramLabels: PARAM_LABELS[distType] },
        result: { handled: true },
      };
    }
    if (key === 'ONE') return { state: { ...state, distType: 'normal', paramLabels: PARAM_LABELS.normal }, result: { handled: true } };
    if (key === 'TWO') return { state: { ...state, distType: 'binomial', paramLabels: PARAM_LABELS.binomial }, result: { handled: true } };
    if (key === 'THREE') return { state: { ...state, distType: 'poisson', paramLabels: PARAM_LABELS.poisson }, result: { handled: true } };
    if (key === 'EXE') return { state: { ...state, screen: 'func' }, result: { handled: true } };
  }

  if (state.screen === 'func') {
    if (key === 'UP' || key === 'DOWN') {
      const idx = DIST_FUNCS.indexOf(state.distFunc);
      const next = key === 'UP'
        ? (idx - 1 + DIST_FUNCS.length) % DIST_FUNCS.length
        : (idx + 1) % DIST_FUNCS.length;
      return { state: { ...state, distFunc: DIST_FUNCS[next] }, result: { handled: true } };
    }
    if (key === 'ONE') return { state: { ...state, distFunc: 'pd' }, result: { handled: true } };
    if (key === 'TWO') return { state: { ...state, distFunc: 'cd' }, result: { handled: true } };
    if (key === 'THREE') return { state: { ...state, distFunc: 'inv' }, result: { handled: true } };
    if (key === 'EXE') {
      const paramLabels = labelsFor(state);
      return {
        state: { ...state, screen: 'input', paramIndex: 0, inputBuffer: '', params: {}, paramLabels },
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
      const label = state.paramLabels[state.paramIndex];
      const params = { ...state.params, [label]: state.inputBuffer || '0' };
      if (state.paramIndex < state.paramLabels.length - 1) {
        return {
          state: { ...state, params, paramIndex: state.paramIndex + 1, inputBuffer: '' },
          result: { handled: true },
        };
      }
      const nextState = { ...state, params, inputBuffer: '', screen: 'result' as const };
      return {
        state: { ...nextState, resultText: computeResult(nextState) },
        result: { handled: true },
      };
    }
  }

  if (state.screen === 'result' && key === 'EXIT') {
    return { state: { ...state, screen: 'input', paramIndex: 0, inputBuffer: '' }, result: { handled: true } };
  }

  return { state, result: { handled: false } };
}
