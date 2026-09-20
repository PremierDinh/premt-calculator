export type InputOutputMode =
  | 'MathI/MathO'
  | 'MathI/DecimalO'
  | 'LineI/LineO'
  | 'LineI/DecimalO';

export type AngleUnit = 'deg' | 'rad' | 'gra';
export type NumberFormat = 'norm' | 'fix' | 'sci' | 'eng';
export type FractionForm = 'mixed' | 'improper';
export type ComplexForm = 'rect' | 'polar';
export type DecimalMark = '.' | ',';
export type Language = 'vi' | 'en';

export interface CalculatorSettings {
  inputOutput: InputOutputMode;
  angleUnit: AngleUnit;
  numberFormat: NumberFormat;
  fixDigits: number;
  sciDigits: number;
  engineerSymbol: boolean;
  fractionForm: FractionForm;
  complexForm: ComplexForm;
  decimalMark: DecimalMark;
  digitSeparator: boolean;
  contrast: number;
  autoPowerOffMin: number;
  language: Language;
}

export const DEFAULT_SETTINGS: CalculatorSettings = {
  inputOutput: 'MathI/MathO',
  angleUnit: 'deg',
  numberFormat: 'norm',
  fixDigits: 4,
  sciDigits: 6,
  engineerSymbol: false,
  fractionForm: 'improper',
  complexForm: 'rect',
  decimalMark: '.',
  digitSeparator: false,
  contrast: 3,
  autoPowerOffMin: 10,
  language: 'vi',
};

export const SETTINGS_ITEMS: Array<{ key: keyof CalculatorSettings; values?: unknown[] }> = [
  { key: 'inputOutput', values: ['MathI/MathO', 'MathI/DecimalO', 'LineI/LineO', 'LineI/DecimalO'] },
  { key: 'angleUnit', values: ['deg', 'rad', 'gra'] },
  { key: 'numberFormat', values: ['norm', 'fix', 'sci', 'eng'] },
  { key: 'fixDigits', values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { key: 'sciDigits', values: [2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { key: 'engineerSymbol', values: [false, true] },
  { key: 'fractionForm', values: ['improper', 'mixed'] },
  { key: 'complexForm', values: ['rect', 'polar'] },
  { key: 'decimalMark', values: ['.', ','] },
  { key: 'digitSeparator', values: [false, true] },
  { key: 'contrast', values: [1, 2, 3, 4, 5] },
  { key: 'autoPowerOffMin', values: [5, 10, 30, 60] },
  { key: 'language', values: ['vi', 'en'] },
];

export function cycleValue<T>(values: T[], current: T): T {
  const idx = values.findIndex((v) => v === current);
  return values[(idx + 1) % values.length];
}

export function applySetting<K extends keyof CalculatorSettings>(
  settings: CalculatorSettings,
  key: K,
): CalculatorSettings {
  const item = SETTINGS_ITEMS.find((s) => s.key === key);
  if (!item?.values) return settings;
  return { ...settings, [key]: cycleValue(item.values, settings[key]) };
}

export function prefersDecimalOutput(settings: CalculatorSettings): boolean {
  return settings.inputOutput.endsWith('DecimalO');
}

export function prefersLineInput(settings: CalculatorSettings): boolean {
  return settings.inputOutput.startsWith('LineI');
}
