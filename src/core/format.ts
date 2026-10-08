import { formatFraction, toFraction } from '../math/fraction';
import { formatComplex } from '../math/complex';
import { formatMatrix } from '../math/matrix';
import { formatVector } from '../math/vector';
import type { CalcValue } from '../math/ast';
import type { CalculatorSettings, NumberFormat } from './settings';
import { DEFAULT_SETTINGS, prefersDecimalOutput } from './settings';
import { exactRealString } from './exactForm';

const ENG_SYMBOLS: Array<{ exp: number; symbol: string }> = [
  { exp: 12, symbol: 'T' },
  { exp: 9, symbol: 'G' },
  { exp: 6, symbol: 'M' },
  { exp: 3, symbol: 'k' },
  { exp: 0, symbol: '' },
  { exp: -3, symbol: 'm' },
  { exp: -6, symbol: 'μ' },
  { exp: -9, symbol: 'n' },
  { exp: -12, symbol: 'p' },
];

export function formatValue(value: CalcValue, settings: CalculatorSettings): string {
  switch (value.kind) {
    case 'fraction':
      if (!shouldPreferFraction(settings)) return formatNumber(value.num / value.den, settings);
      return localizeNumber(formatFraction(value, settings.fractionForm === 'mixed'), settings);
    case 'complex':
      return localizeNumber(formatComplex(value, settings.complexForm, settings.angleUnit), settings);
    case 'matrix':
      return formatMatrix(value.data);
    case 'vector':
      return formatVector(value.data);
    case 'string':
      return value.value;
    default:
      if (shouldPreferFraction(settings)) {
        const exact = exactRealString(value.value, settings.fractionForm === 'mixed');
        if (exact) return localizeNumber(exact, settings);
      }
      return formatNumber(value.value, settings);
  }
}

export function shouldPreferFraction(settings: CalculatorSettings): boolean {
  return settings.fractionOutput && !prefersDecimalOutput(settings);
}

export function formatNumber(value: number, settingsOrFormat: CalculatorSettings | NumberFormat = 'norm'): string {
  const settings: CalculatorSettings = typeof settingsOrFormat === 'string'
    ? { ...DEFAULT_SETTINGS, numberFormat: settingsOrFormat }
    : settingsOrFormat;
  if (!Number.isFinite(value)) return 'Math ERROR';

  if (shouldPreferFraction(settings) && settings.numberFormat === 'norm') {
    const frac = toFraction(value);
    if (frac && frac.den <= 10000) {
      return localizeNumber(formatFraction(frac, settings.fractionForm === 'mixed'), settings);
    }
  }

  let raw: string;
  switch (settings.numberFormat) {
    case 'fix':
      raw = value.toFixed(settings.fixDigits);
      break;
    case 'sci':
      raw = timesTenPower(value.toExponential(Math.max(0, settings.sciDigits - 1)), false);
      break;
    case 'eng': {
      if (value === 0) {
        raw = '0';
        break;
      }
      const exp = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
      const mantissa = value / 10 ** exp;
      if (settings.engineerSymbol) {
        const sym = ENG_SYMBOLS.find((s) => s.exp === exp);
        raw = sym ? `${mantissa.toPrecision(6)}${sym.symbol}` : `${mantissa.toPrecision(6)}×10${superscript(exp)}`;
      } else {
        raw = `${mantissa.toPrecision(6)}×10${superscript(exp)}`;
      }
      break;
    }
    default:
      if (Math.abs(value) >= 1e10 || (Math.abs(value) > 0 && Math.abs(value) < 1e-9)) {
        raw = timesTenPower(value.toExponential(9));
      } else {
        raw = String(parseFloat(value.toPrecision(10)));
      }
  }

  return localizeNumber(raw, settings);
}

const SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

function superscript(n: number): string {
  return String(n).replace('-', '⁻').replace(/\d/g, (d) => SUPERSCRIPT_DIGITS[Number(d)]);
}

/** "1.2345e+18" → "1.2345×10¹⁸"; Norm drops trailing mantissa zeros, Sci keeps the requested digits. */
function timesTenPower(exponential: string, trimZeros = true): string {
  const [mantissa, exp] = exponential.split('e');
  const shown = trimZeros && mantissa.includes('.') ? mantissa.replace(/\.?0+$/, '') : mantissa;
  return `${shown}×10${superscript(Number(exp))}`;
}

export function localizeNumber(raw: string, settings: CalculatorSettings): string {
  let out = raw;
  if (settings.digitSeparator) {
    out = out.replace(/-?\d+(?=\.\d+)?/, (intPart) => {
      const sign = intPart.startsWith('-') ? '-' : '';
      const digits = intPart.replace('-', '');
      return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    });
  }
  if (settings.decimalMark === ',') {
    out = out.replace(/\./g, ',');
  }
  return out;
}

export function cycleFormat(current: CalculatorSettings['numberFormat']): CalculatorSettings['numberFormat'] {
  const order: CalculatorSettings['numberFormat'][] = ['norm', 'fix', 'sci', 'eng'];
  return order[(order.indexOf(current) + 1) % order.length];
}

export function formatFormatLabel(format: CalculatorSettings['numberFormat']): string {
  switch (format) {
    case 'fix': return 'Fix';
    case 'sci': return 'Sci';
    case 'eng': return 'Eng';
    default: return 'Norm';
  }
}
