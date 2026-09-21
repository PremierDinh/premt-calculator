import type { DisplayState, KeyContext, KeyId, ModeResult, StatisticsState } from '../../types';
import type { CalculatorSettings } from '../../settings';
import { formatNumber } from '../../format';

const CALC_OPTIONS_1VAR = ['n', 'Σx', 'x̄', 'σx', 'σ', 'minX', 'maxX', 'Med', 'Q1', 'Q3'];
const CALC_OPTIONS_2VAR = ['n', 'Σx', 'Σy', 'x̄', 'ȳ', 'A', 'B', 'r', 'ŷ'];

export function createStatisticsState(): StatisticsState {
  return {
    screen: 'menu',
    dataType: '1-var',
    data: [],
    inputBuffer: '',
    inputField: 'x',
    selectedCalc: 0,
    calcOptions: CALC_OPTIONS_1VAR,
    resultText: '',
  };
}

function expandedData(data: StatisticsState['data']): number[] {
  const result: number[] = [];
  for (const row of data) {
    for (let i = 0; i < row.freq; i++) result.push(row.x);
  }
  return result;
}

function percentile(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  if (n === 1) return sorted[0];
  const pos = (n - 1) * p;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function median(sorted: number[]): number {
  return percentile(sorted, 0.5);
}

function compute1Var(data: StatisticsState['data'], calc: string, settings: CalculatorSettings): string {
  const xs = expandedData(data);
  const n = xs.length;
  if (n === 0) return 'Data ERROR';

  const sum = xs.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const variance = xs.reduce((a, x) => a + (x - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  const sorted = [...xs].sort((a, b) => a - b);

  switch (calc) {
    case 'n': return String(n);
    case 'Σx': return formatNumber(sum, settings);
    case 'x̄': return formatNumber(mean, settings);
    case 'σx': return formatNumber(std, settings);
    case 'σ': return formatNumber(Math.sqrt(variance * n / (n - 1 || 1)), settings);
    case 'minX': return formatNumber(sorted[0], settings);
    case 'maxX': return formatNumber(sorted[n - 1], settings);
    case 'Med': return formatNumber(median(sorted), settings);
    case 'Q1': return formatNumber(percentile(sorted, 0.25), settings);
    case 'Q3': return formatNumber(percentile(sorted, 0.75), settings);
    default: return '—';
  }
}

function compute2Var(data: StatisticsState['data'], calc: string, settings: CalculatorSettings): string {
  const rows = data.filter((r) => r.y !== undefined);
  const n = rows.reduce((a, r) => a + r.freq, 0);
  if (n === 0) return 'Data ERROR';

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (const r of rows) {
    sumX += r.x * r.freq;
    sumY += (r.y ?? 0) * r.freq;
    sumXY += r.x * (r.y ?? 0) * r.freq;
    sumX2 += r.x * r.x * r.freq;
    sumY2 += (r.y ?? 0) * (r.y ?? 0) * r.freq;
  }

  const meanX = sumX / n;
  const meanY = sumY / n;
  const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const a = meanY - b * meanX;
  const r = (n * sumXY - sumX * sumY) /
    Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));

  switch (calc) {
    case 'n': return String(n);
    case 'Σx': return formatNumber(sumX, settings);
    case 'Σy': return formatNumber(sumY, settings);
    case 'x̄': return formatNumber(meanX, settings);
    case 'ȳ': return formatNumber(meanY, settings);
    case 'A': return formatNumber(a, settings);
    case 'B': return formatNumber(b, settings);
    case 'r': return formatNumber(r, settings);
    case 'ŷ': return formatNumber(a + b * meanX, settings);
    default: return '—';
  }
}

export function getStatisticsDisplay(state: StatisticsState): DisplayState {
  switch (state.screen) {
    case 'menu':
      return {
        lines: [
          { text: 'Statistics', size: 'small' },
          { text: '1: 1-Variable' },
          { text: '2: 2-Variable' },
        ],
        title: 'Statistics',
      };
    case 'type-select':
      return {
        lines: [
          { text: state.dataType === '1-var' ? '1-Variable Data' : '2-Variable Data' },
          { text: `Entries: ${state.data.length}` },
        ],
      };
    case 'data-input':
      return {
        lines: [
          { text: `Input ${state.inputField.toUpperCase()}:`, size: 'small' },
          { text: state.inputBuffer || '0', align: 'right' },
          { text: `Row ${state.data.length + (state.inputField === 'x' ? 1 : 0)}`, size: 'small' },
        ],
      };
    case 'calc-menu':
      return {
        lines: [
          { text: 'CALC', size: 'small' },
          { text: `▶ ${state.calcOptions[state.selectedCalc]}` },
        ],
      };
    case 'result':
      return {
        lines: [
          { text: state.calcOptions[state.selectedCalc], size: 'small' },
          { text: state.resultText, align: 'right', size: 'large' },
        ],
      };
    default:
      return { lines: [{ text: 'Statistics' }] };
  }
}

export function handleStatisticsKey(
  state: StatisticsState,
  key: KeyId,
  ctx: KeyContext,
): { state: StatisticsState; result: ModeResult } {
  const numKeys: Partial<Record<KeyId, string>> = {
    ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
    FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9', DOT: '.',
  };

  if (key === 'AC') {
    return { state: createStatisticsState(), result: { handled: true } };
  }

  if (state.screen === 'menu') {
    if (key === 'ONE') {
      return {
        state: { ...state, screen: 'type-select', dataType: '1-var', data: [], calcOptions: CALC_OPTIONS_1VAR },
        result: { handled: true },
      };
    }
    if (key === 'TWO') {
      return {
        state: { ...state, screen: 'type-select', dataType: '2-var', data: [], calcOptions: CALC_OPTIONS_2VAR },
        result: { handled: true },
      };
    }
    if (key === 'EXE') {
      return {
        state: { ...state, screen: 'data-input', inputBuffer: '', inputField: 'x' },
        result: { handled: true },
      };
    }
  }

  if (state.screen === 'type-select') {
    if (key === 'EXE') {
      return {
        state: { ...state, screen: 'data-input', inputBuffer: '', inputField: 'x' },
        result: { handled: true },
      };
    }
    if (key === 'FUNCTION') {
      return {
        state: { ...state, screen: 'calc-menu', selectedCalc: 0 },
        result: { handled: true },
      };
    }
  }

  if (state.screen === 'data-input') {
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
      const val = parseFloat(state.inputBuffer) || 0;
      if (state.dataType === '2-var' && state.inputField === 'x') {
        return {
          state: { ...state, inputField: 'y', inputBuffer: '', data: [...state.data, { x: val, y: 0, freq: 1 }] },
          result: { handled: true },
        };
      }
      if (state.dataType === '2-var' && state.inputField === 'y') {
        const data = [...state.data];
        if (data.length > 0) data[data.length - 1] = { ...data[data.length - 1], y: val };
        return {
          state: { ...state, inputField: 'freq', inputBuffer: '', data },
          result: { handled: true },
        };
      }
      if (state.inputField === 'freq') {
        const data = [...state.data];
        const freq = Math.max(1, Math.round(val) || 1);
        if (data.length > 0) data[data.length - 1] = { ...data[data.length - 1], freq };
        return {
          state: { ...state, inputField: 'x', inputBuffer: '', data },
          result: { handled: true },
        };
      }
      return {
        state: {
          ...state,
          data: [...state.data, { x: val, freq: 1 }],
          inputBuffer: '',
          inputField: state.dataType === '1-var' ? 'freq' : 'x',
        },
        result: { handled: true },
      };
    }
  }

  if (state.screen === 'calc-menu') {
    if (key === 'UP') {
      const sel = Math.max(0, state.selectedCalc - 1);
      return { state: { ...state, selectedCalc: sel }, result: { handled: true } };
    }
    if (key === 'DOWN') {
      const sel = Math.min(state.calcOptions.length - 1, state.selectedCalc + 1);
      return { state: { ...state, selectedCalc: sel }, result: { handled: true } };
    }
    if (key === 'EXE') {
      const calc = state.calcOptions[state.selectedCalc];
      const resultText = state.dataType === '1-var'
        ? compute1Var(state.data, calc, ctx.settings)
        : compute2Var(state.data, calc, ctx.settings);
      return {
        state: { ...state, screen: 'result', resultText },
        result: { handled: true },
      };
    }
  }

  if (state.screen === 'result' && key === 'EXIT') {
    return { state: { ...state, screen: 'calc-menu' }, result: { handled: true } };
  }

  return { state, result: { handled: false } };
}
