import type { CalcValue } from '../math/ast';
import type { Matrix } from '../math/matrix';
import type { Vector } from '../math/vector';
import type { AngleUnit, CalculatorSettings, NumberFormat } from './settings';

export type { AngleUnit, NumberFormat };

export type ModeId =
  | 'home'
  | 'calculate'
  | 'statistics'
  | 'distribution'
  | 'spreadsheet'
  | 'table'
  | 'equation'
  | 'inequality'
  | 'complex'
  | 'basen'
  | 'matrix'
  | 'vector'
  | 'ratio'
  | 'mathbox';

export type PowerState = 'on' | 'off';

export type Overlay = 'none' | 'settings' | 'catalog' | 'tools' | 'menu' | 'qr';

export type KeyId =
  | 'ON'
  | 'HOME'
  | 'MENU'
  | 'SETTINGS'
  | 'EXIT'
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'OK'
  | 'SCROLL'
  | 'PAGEUP'
  | 'PAGEDOWN'
  | 'SHIFT'
  | 'ALPHA'
  | 'VARIABLE'
  | 'FUNCTION'
  | 'CATALOG'
  | 'TOOLS'
  | 'X'
  | 'FRAC'
  | 'SQRT'
  | 'POWER'
  | 'SQUARE'
  | 'LOG'
  | 'ANS'
  | 'SIN'
  | 'COS'
  | 'TAN'
  | 'LPAREN'
  | 'RPAREN'
  | 'DEL'
  | 'AC'
  | 'SEVEN'
  | 'EIGHT'
  | 'NINE'
  | 'FOUR'
  | 'FIVE'
  | 'SIX'
  | 'ONE'
  | 'TWO'
  | 'THREE'
  | 'ZERO'
  | 'DOT'
  | 'EXP10'
  | 'FORMAT'
  | 'EXE'
  | 'MULT'
  | 'DIV'
  | 'PLUS'
  | 'MINUS';

export type VariableName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'x' | 'y' | 'z';

export interface HistoryEntry {
  expression: string;
  result: string;
  value: number;
}

export interface KeyContext {
  shiftActive: boolean;
  alphaActive: boolean;
  angleUnit: AngleUnit;
  ans: number;
  preAns: number;
  variables: Record<VariableName, number>;
  matrices: Record<string, Matrix>;
  vectors: Record<string, Vector>;
  numberFormat: NumberFormat;
  settings: CalculatorSettings;
  history: HistoryEntry[];
  language: 'vi' | 'en';
}

export interface DisplayLine {
  text: string;
  align?: 'left' | 'right';
  size?: 'normal' | 'small' | 'large';
}

export type HomeIcon = ModeId;

export interface HomeMenuItem {
  id: ModeId;
  label: string;
  icon: HomeIcon;
}

export interface DisplayState {
  lines: DisplayLine[];
  title?: string;
  showShift?: boolean;
  showAlpha?: boolean;
  showHome?: boolean;
  menuItems?: HomeMenuItem[];
  selectedMenuIndex?: number;
  gridData?: string[][];
  highlightCell?: { row: number; col: number };
  overlay?: Overlay;
  qrImageDataUrl?: string;
}

export interface ModeResult {
  handled: boolean;
  switchMode?: ModeId;
  setAns?: CalcValue | number;
  setVariable?: { name: VariableName; value: number };
  setMatrix?: { name: string; value: Matrix };
  setVector?: { name: string; value: Vector };
  addHistory?: HistoryEntry;
  consumeShift?: boolean;
  consumeAlpha?: boolean;
  openQr?: boolean;
  qrPayload?: string;
  toggleApprox?: boolean;
}

export interface ModeState {
  calculate: CalculateState;
  statistics: StatisticsState;
  distribution: DistributionState;
  table: TableState;
  equation: EquationState;
  spreadsheet: SpreadsheetState;
  home: HomeState;
  inequality: InequalityState;
  complex: ComplexAppState;
  basen: BaseNState;
  matrix: MatrixAppState;
  vector: VectorAppState;
  ratio: RatioState;
  mathbox: MathBoxState;
}

export interface HomeState {
  selectedIndex: number;
  scrollRow: number;
}

export interface CalculateState {
  expression: string;
  result: string;
  cursorPos: number;
  showResult: boolean;
  variableMode: 'none' | 'sto' | 'rcl';
  selectedVar: VariableName | null;
  historyIndex: number;
  insertMode: boolean;
}

export interface StatRow {
  x: number;
  y?: number;
  freq: number;
}

export type StatScreen = 'menu' | 'type-select' | 'data-input' | 'calc-menu' | 'result';

export interface StatisticsState {
  screen: StatScreen;
  dataType: '1-var' | '2-var';
  data: StatRow[];
  inputBuffer: string;
  inputField: 'x' | 'y' | 'freq';
  selectedCalc: number;
  calcOptions: string[];
  resultText: string;
}

export type DistType = 'normal' | 'binomial' | 'poisson';
export type DistFunc = 'pd' | 'cd' | 'inv';

export interface DistributionState {
  screen: 'type' | 'func' | 'input' | 'result';
  distType: DistType;
  distFunc: DistFunc;
  params: Record<string, string>;
  paramIndex: number;
  paramLabels: string[];
  inputBuffer: string;
  resultText: string;
}

export interface TableState {
  screen: 'func' | 'start' | 'end' | 'step' | 'table';
  functionExpr: string;
  start: string;
  end: string;
  step: string;
  tableData: { x: number; fx: number }[];
  scrollIndex: number;
  inputBuffer: string;
}

export type EqnType = 'quadratic' | 'simultaneous' | 'general';

export interface EquationState {
  screen: 'type' | 'input' | 'result';
  eqnType: EqnType;
  coefficients: string[];
  coeffIndex: number;
  inputBuffer: string;
  resultText: string;
}

export interface SpreadsheetState {
  rows: number;
  cols: number;
  cells: string[][];
  selectedRow: number;
  selectedCol: number;
  editing: boolean;
  editBuffer: string;
}

export interface InequalityState {
  screen: 'type' | 'kind' | 'input' | 'result';
  ineqType: 'linear' | 'quadratic';
  kind: '>' | '<' | '>=' | '<=';
  coefficients: string[];
  coeffIndex: number;
  inputBuffer: string;
  resultText: string;
}

export interface ComplexAppState {
  expression: string;
  result: string;
  cursorPos: number;
  showResult: boolean;
}

export type BaseNBase = 2 | 8 | 10 | 16;

export interface BaseNState {
  base: BaseNBase;
  expression: string;
  result: string;
}

export interface MatrixAppState {
  screen: 'menu' | 'size' | 'edit' | 'op' | 'result';
  target: 'MatA' | 'MatB' | 'MatC';
  rows: number;
  cols: number;
  editRow: number;
  editCol: number;
  inputBuffer: string;
  op: 'det' | 'inv' | 'tr' | 'add' | 'sub' | 'mul';
  resultText: string;
}

export interface VectorAppState {
  screen: 'menu' | 'size' | 'edit' | 'op' | 'result';
  target: 'VctA' | 'VctB' | 'VctC';
  dim: 2 | 3;
  editIndex: number;
  inputBuffer: string;
  op: 'dot' | 'cross' | 'norm' | 'add' | 'sub';
  resultText: string;
}

export interface RatioState {
  values: [string, string, string, string];
  index: number;
  inputBuffer: string;
  resultText: string;
  screen: 'input' | 'result';
}

export interface MathBoxState {
  screen: 'menu' | 'run' | 'result';
  tool: 'dice' | 'coin' | 'rand' | 'gcd' | 'lcm';
  inputBuffer: string;
  resultText: string;
}

export interface KeyDefinition {
  id: KeyId;
  label: string;
  shiftLabel?: string;
  alphaLabel?: string;
  caption?: string;
  cornerLabel?: string;
  variant?: 'default' | 'shift' | 'alpha' | 'gray' | 'exe' | 'nav' | 'system';
}

export interface CatalogItem {
  id: string;
  insert: string;
  label: string;
}

export interface CatalogGroup {
  id: string;
  title: string;
  items: CatalogItem[];
}
