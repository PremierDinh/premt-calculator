import type { DisplayState, KeyContext, KeyId, ModeResult, SpreadsheetState } from '../../types';
import { createEvalContext, evaluateExpression } from '../../../math/evaluator';

const ROWS = 45;
const COLS = 5;
const COL_LABELS = ['A', 'B', 'C', 'D', 'E'];

function colLabel(col: number): string {
  return COL_LABELS[col] ?? '?';
}

function cellRef(row: number, col: number): string {
  return `${colLabel(col)}${row + 1}`;
}

function createEmptyGrid(): string[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(''));
}

export function createSpreadsheetState(): SpreadsheetState {
  return {
    rows: ROWS,
    cols: COLS,
    cells: createEmptyGrid(),
    selectedRow: 0,
    selectedCol: 0,
    editing: false,
    editBuffer: '',
  };
}

function getCellValue(cells: string[][], row: number, col: number, visited = new Set<string>()): number {
  const ref = cellRef(row, col);
  if (visited.has(ref)) return NaN;
  visited.add(ref);

  const raw = cells[row]?.[col] ?? '';
  if (!raw.startsWith('=')) return parseFloat(raw) || 0;

  let expr = raw.slice(1);
  const rangeValues = (start: string, end: string): number[] => {
    const s = parseRef(start);
    const e = parseRef(end);
    if (!s || !e) return [];
    const vals: number[] = [];
    for (let r = s.row; r <= e.row; r++) {
      for (let c = s.col; c <= e.col; c++) {
        vals.push(getCellValue(cells, r, c, new Set(visited)));
      }
    }
    return vals;
  };

  expr = expr.replace(/SUM\(([A-E]\d+):([A-E]\d+)\)/gi, (_m, start: string, end: string) => {
    const vals = rangeValues(start, end);
    return String(vals.reduce((a, b) => a + b, 0));
  });
  expr = expr.replace(/AVG\(([A-E]\d+):([A-E]\d+)\)/gi, (_m, start: string, end: string) => {
    const vals = rangeValues(start, end);
    return vals.length ? String(vals.reduce((a, b) => a + b, 0) / vals.length) : '0';
  });
  expr = expr.replace(/MIN\(([A-E]\d+):([A-E]\d+)\)/gi, (_m, start: string, end: string) => {
    const vals = rangeValues(start, end);
    return vals.length ? String(Math.min(...vals)) : '0';
  });
  expr = expr.replace(/MAX\(([A-E]\d+):([A-E]\d+)\)/gi, (_m, start: string, end: string) => {
    const vals = rangeValues(start, end);
    return vals.length ? String(Math.max(...vals)) : '0';
  });

  expr = expr.replace(/[A-E]\d+/gi, (ref) => {
    const parsed = parseRef(ref);
    if (!parsed) return '0';
    return String(getCellValue(cells, parsed.row, parsed.col, new Set(visited)));
  });

  try {
    return evaluateExpression(expr, createEvalContext());
  } catch {
    return NaN;
  }
}

function parseRef(ref: string): { row: number; col: number } | null {
  const m = ref.match(/^([A-E])(\d+)$/i);
  if (!m) return null;
  const col = COL_LABELS.indexOf(m[1].toUpperCase());
  const row = parseInt(m[2], 10) - 1;
  if (col < 0 || row < 0 || row >= ROWS) return null;
  return { row, col };
}

function displayCellValue(state: SpreadsheetState, row: number, col: number): string {
  const raw = state.cells[row][col];
  if (!raw) return '';
  if (raw.startsWith('=')) {
    const val = getCellValue(state.cells, row, col);
    return Number.isNaN(val) ? 'ERROR' : String(parseFloat(val.toPrecision(10)));
  }
  return raw;
}

export function getSpreadsheetDisplay(state: SpreadsheetState): DisplayState {
  const { selectedRow, selectedCol } = state;
  const ref = cellRef(selectedRow, selectedCol);
  const raw = state.cells[selectedRow][selectedCol];

  if (state.editing) {
    return {
      lines: [
        { text: ref, size: 'small' },
        { text: state.editBuffer, align: 'right' },
      ],
      gridData: buildGridPreview(state),
      highlightCell: { row: selectedRow, col: selectedCol },
    };
  }

  return {
    lines: [
      { text: ref, size: 'small' },
      { text: raw || displayCellValue(state, selectedRow, selectedCol) || '—', align: 'right' },
      { text: `Row ${selectedRow + 1} Col ${colLabel(selectedCol)}`, size: 'small' },
    ],
    gridData: buildGridPreview(state),
    highlightCell: { row: selectedRow, col: selectedCol },
  };
}

function buildGridPreview(state: SpreadsheetState): string[][] {
  const startRow = Math.max(0, state.selectedRow - 1);
  const preview: string[][] = [];
  for (let r = startRow; r < Math.min(startRow + 4, ROWS); r++) {
    const row: string[] = [];
    for (let c = 0; c < COLS; c++) {
      const val = displayCellValue(state, r, c);
      row.push(val.slice(0, 6));
    }
    preview.push(row);
  }
  return preview;
}

export function handleSpreadsheetKey(
  state: SpreadsheetState,
  key: KeyId,
  _ctx: KeyContext,
): { state: SpreadsheetState; result: ModeResult } {
  const numKeys: Partial<Record<KeyId, string>> = {
    ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4',
    FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9', DOT: '.',
  };

  if (key === 'AC') return { state: createSpreadsheetState(), result: { handled: true } };

  if (state.editing) {
    if (key === 'DEL') {
      return { state: { ...state, editBuffer: state.editBuffer.slice(0, -1) }, result: { handled: true } };
    }
    if (numKeys[key]) {
      return { state: { ...state, editBuffer: state.editBuffer + numKeys[key] }, result: { handled: true } };
    }
    if (key === 'PLUS' || key === 'MINUS' || key === 'MULT' || key === 'DIV') {
      const map = { PLUS: '+', MINUS: '-', MULT: '*', DIV: '/' };
      return { state: { ...state, editBuffer: state.editBuffer + map[key] }, result: { handled: true } };
    }
    if (key === 'LPAREN' || key === 'RPAREN') {
      return { state: { ...state, editBuffer: state.editBuffer + (key === 'LPAREN' ? '(' : ')') }, result: { handled: true } };
    }
    if (key === 'FUNCTION' || key === 'TOOLS') {
      const prefix = state.editBuffer.startsWith('=') ? state.editBuffer : '=';
      const fn = key === 'TOOLS' ? 'AVG(A1:A1)' : 'SUM(A1:A1)';
      return { state: { ...state, editBuffer: prefix + fn }, result: { handled: true } };
    }
    if (key === 'EXE') {
      const cells = state.cells.map((row) => [...row]);
      cells[state.selectedRow][state.selectedCol] = state.editBuffer;
      return {
        state: { ...state, cells, editing: false, editBuffer: '' },
        result: { handled: true },
      };
    }
    if (key === 'EXIT') {
      return { state: { ...state, editing: false, editBuffer: '' }, result: { handled: true } };
    }
    return { state, result: { handled: true } };
  }

  if (key === 'UP') {
    return { state: { ...state, selectedRow: Math.max(0, state.selectedRow - 1) }, result: { handled: true } };
  }
  if (key === 'DOWN' || key === 'SCROLL') {
    return { state: { ...state, selectedRow: Math.min(ROWS - 1, state.selectedRow + 1) }, result: { handled: true } };
  }
  if (key === 'LEFT') {
    return { state: { ...state, selectedCol: Math.max(0, state.selectedCol - 1) }, result: { handled: true } };
  }
  if (key === 'RIGHT') {
    return { state: { ...state, selectedCol: Math.min(COLS - 1, state.selectedCol + 1) }, result: { handled: true } };
  }
  if (key === 'EXE') {
    const current = state.cells[state.selectedRow][state.selectedCol];
    return { state: { ...state, editing: true, editBuffer: current }, result: { handled: true } };
  }
  if (numKeys[key]) {
    return { state: { ...state, editing: true, editBuffer: numKeys[key]! }, result: { handled: true } };
  }
  if (key === 'FUNCTION') {
    return { state: { ...state, editing: true, editBuffer: '=' }, result: { handled: true } };
  }

  return { state, result: { handled: false } };
}
