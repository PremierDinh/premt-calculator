import type { DisplayState, KeyContext, KeyId, ModeResult, StatisticsState } from '../../types';
import { DEFAULT_SETTINGS, prefersMathInput, type CalculatorSettings } from '../../settings';
import { formatNumber } from '../../format';

export const CALC_OPTIONS_1VAR = ['n', 'x̄', 'Σx', 'Σx²', 'σx', 'sx', 'minX', 'Q1', 'Med', 'Q3', 'maxX'];
export const CALC_OPTIONS_2VAR = ['n', 'x̄', 'ȳ', 'Σx', 'Σy', 'Σxy', 'σx', 'σy', 'a', 'b', 'r'];

const VISIBLE_RESULTS = 3;

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

function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  const mid = Math.floor(n / 2);
  return n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Quartiles as on Casio calculators: medians of the lower/upper halves, excluding the middle value when n is odd. */
function quartiles(sorted: number[]): { q1: number; q3: number } {
  const n = sorted.length;
  if (n === 1) return { q1: sorted[0], q3: sorted[0] };
  const half = Math.floor(n / 2);
  return { q1: median(sorted.slice(0, half)), q3: median(sorted.slice(n - half)) };
}

export function compute1Var(data: StatisticsState['data'], calc: string): number {
  const xs = expandedData(data);
  const n = xs.length;
  if (n === 0) return NaN;
  const sum = xs.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const ss = xs.reduce((a, x) => a + (x - mean) ** 2, 0);
  const sorted = [...xs].sort((a, b) => a - b);
  switch (calc) {
    case 'n': return n;
    case 'x̄': return mean;
    case 'Σx': return sum;
    case 'Σx²': return xs.reduce((a, x) => a + x * x, 0);
    case 'σx': return Math.sqrt(ss / n);
    case 'sx': return n > 1 ? Math.sqrt(ss / (n - 1)) : NaN;
    case 'minX': return sorted[0];
    case 'Q1': return quartiles(sorted).q1;
    case 'Med': return median(sorted);
    case 'Q3': return quartiles(sorted).q3;
    case 'maxX': return sorted[n - 1];
    default: return NaN;
  }
}

export function compute2Var(data: StatisticsState['data'], calc: string): number {
  const rows = data.filter((r) => r.y !== undefined);
  const n = rows.reduce((a, r) => a + r.freq, 0);
  if (n === 0) return NaN;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (const r of rows) {
    const y = r.y ?? 0;
    sumX += r.x * r.freq;
    sumY += y * r.freq;
    sumXY += r.x * y * r.freq;
    sumX2 += r.x * r.x * r.freq;
    sumY2 += y * y * r.freq;
  }

  const meanX = sumX / n;
  const meanY = sumY / n;
  const sxx = n * sumX2 - sumX ** 2;
  const syy = n * sumY2 - sumY ** 2;
  const sxy = n * sumXY - sumX * sumY;
  const b = sxy / sxx;

  switch (calc) {
    case 'n': return n;
    case 'x̄': return meanX;
    case 'ȳ': return meanY;
    case 'Σx': return sumX;
    case 'Σy': return sumY;
    case 'Σxy': return sumXY;
    case 'σx': return Math.sqrt(sxx) / n;
    case 'σy': return Math.sqrt(syy) / n;
    case 'a': return meanY - b * meanX;
    case 'b': return b;
    case 'r': return sxy / Math.sqrt(sxx * syy);
    default: return NaN;
  }
}

function computeValue(state: StatisticsState, calc: string): number {
  return state.dataType === '1-var' ? compute1Var(state.data, calc) : compute2Var(state.data, calc);
}

function formatStat(value: number, settings: CalculatorSettings): string {
  return Number.isFinite(value) ? formatNumber(value, settings) : 'ERROR';
}

function completeRows(state: StatisticsState): number {
  return state.data.filter((r) => state.dataType === '1-var' || r.y !== undefined).length;
}

export function getStatisticsDisplay(state: StatisticsState, settings: CalculatorSettings = DEFAULT_SETTINGS): DisplayState {
  const natural = prefersMathInput(settings);
  const title = state.dataType === '1-var' ? '1-Var' : '2-Var';
  switch (state.screen) {
    case 'menu':
    case 'type-select':
      return {
        lines: [
          { text: 'Statistics', size: 'small' },
          { text: '1: 1-Variable (x)' },
          { text: '2: 2-Variable (x,y)  y=a+bx' },
        ],
        title: 'Statistics',
      };
    case 'data-input': {
      const row = completeRows(state) + 1;
      const field = state.inputField === 'y' ? 'y' : 'x';
      const recent = state.data.slice(-2);
      const header = state.dataType === '1-var' ? ['#', 'x'] : ['#', 'x', 'y'];
      const firstIndex = state.data.length - recent.length + 1;
      const rows = recent.map((r, i) => {
        const cells = [String(firstIndex + i), formatNumber(r.x, settings)];
        if (state.dataType === '2-var') cells.push(r.y === undefined ? '' : formatNumber(r.y, settings));
        return cells;
      });
      return {
        lines: [
          { text: `${title}  n=${completeRows(state)}  f(x):CALC`, size: 'small' },
          { text: `${field}${row}= ${state.inputBuffer}`, align: 'right' },
        ],
        ...(rows.length ? { gridData: [header, ...rows], gridVariant: 'table' as const } : {}),
      };
    }
    case 'calc-menu': {
      const start = Math.min(
        Math.max(0, state.selectedCalc - 1),
        Math.max(0, state.calcOptions.length - VISIBLE_RESULTS),
      );
      const visible = state.calcOptions.slice(start, start + VISIBLE_RESULTS);
      return {
        lines: [
          { text: `${title}  ▲▼  =:Ans`, size: 'small' },
          ...visible.map((calc, i) => ({
            text: `${start + i === state.selectedCalc ? '▶' : ' '}${calc}=${formatStat(computeValue(state, calc), settings)}`,
            natural,
          })),
        ],
      };
    }
    case 'result':
      return {
        lines: [
          { text: state.calcOptions[state.selectedCalc], size: 'small' },
          { text: state.resultText, align: 'right', size: 'large', natural },
        ],
      };
    default:
      return { lines: [{ text: 'Statistics' }] };
  }
}

function startInput(state: StatisticsState, dataType: StatisticsState['dataType']): StatisticsState {
  return {
    ...state,
    screen: 'data-input',
    dataType,
    data: dataType === state.dataType ? state.data : [],
    calcOptions: dataType === '1-var' ? CALC_OPTIONS_1VAR : CALC_OPTIONS_2VAR,
    selectedCalc: 0,
    inputBuffer: '',
    inputField: 'x',
  };
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
  const handled = (next: StatisticsState, extra: Partial<ModeResult> = {}) => ({ state: next, result: { handled: true, ...extra } });

  if (key === 'AC') return handled(createStatisticsState());

  if (state.screen === 'menu' || state.screen === 'type-select') {
    if (key === 'ONE') return handled(startInput(state, '1-var'));
    if (key === 'TWO') return handled(startInput(state, '2-var'));
    if (key === 'EXE' || key === 'OK') return handled(startInput(state, state.dataType));
  }

  if (state.screen === 'data-input') {
    if (key === 'DEL') {
      if (state.inputBuffer) return handled({ ...state, inputBuffer: state.inputBuffer.slice(0, -1) });
      if (state.inputField === 'y') return handled({ ...state, data: state.data.slice(0, -1), inputField: 'x' });
      return handled({ ...state, data: state.data.slice(0, -1) });
    }
    if (numKeys[key]) return handled({ ...state, inputBuffer: state.inputBuffer + numKeys[key] });
    if (key === 'MINUS' && state.inputBuffer === '') return handled({ ...state, inputBuffer: '-' });
    if (key === 'EXE') {
      if (!state.inputBuffer) return handled(state);
      const val = parseFloat(state.inputBuffer);
      if (!Number.isFinite(val)) return handled({ ...state, inputBuffer: '' });
      if (state.dataType === '2-var' && state.inputField === 'y') {
        const data = [...state.data];
        data[data.length - 1] = { ...data[data.length - 1], y: val };
        return handled({ ...state, data, inputField: 'x', inputBuffer: '' });
      }
      return handled({
        ...state,
        data: [...state.data, { x: val, freq: 1 }],
        inputField: state.dataType === '2-var' ? 'y' : 'x',
        inputBuffer: '',
      });
    }
    if (key === 'FUNCTION' || key === 'OK') {
      const data = state.inputField === 'y' ? state.data.slice(0, -1) : state.data;
      if (!data.length) return handled(state);
      return handled({ ...state, data, inputField: 'x', inputBuffer: '', screen: 'calc-menu' });
    }
  }

  if (state.screen === 'calc-menu') {
    if (key === 'UP') return handled({ ...state, selectedCalc: Math.max(0, state.selectedCalc - 1) });
    if (key === 'DOWN') return handled({ ...state, selectedCalc: Math.min(state.calcOptions.length - 1, state.selectedCalc + 1) });
    if (key === 'EXE' || key === 'OK') {
      const value = computeValue(state, state.calcOptions[state.selectedCalc]);
      return handled(
        { ...state, screen: 'result', resultText: formatStat(value, ctx.settings) },
        Number.isFinite(value) ? { setAns: value } : {},
      );
    }
    if (key === 'EXIT') return handled({ ...state, screen: 'data-input' });
  }

  if (state.screen === 'result' && (key === 'EXIT' || key === 'EXE')) {
    return handled({ ...state, screen: 'calc-menu' });
  }

  return { state, result: { handled: false } };
}
