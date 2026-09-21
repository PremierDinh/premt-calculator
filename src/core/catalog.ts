import type { BaseNBase, CatalogGroup, ModeId, ModeState } from './types';
import type { Language } from './settings';
import { createEquationState } from './modes/equation';
import { createDistributionState } from './modes/distribution';

export type CatalogApplyResult =
  | { kind: 'modeState'; modeState: ModeState }
  | { kind: 'insert'; field: 'expression' | 'inputBuffer' | 'basenExpr' }
  | { kind: 'none' };

export function getCatalog(mode: ModeId, lang: Language): CatalogGroup[] {
  const vi = lang === 'vi';
  const calc: CatalogGroup[] = [
    {
      id: 'trig',
      title: vi ? 'Lượng giác' : 'Trigonometry',
      items: [
        { id: 'sin', insert: 'sin(', label: 'sin(' },
        { id: 'cos', insert: 'cos(', label: 'cos(' },
        { id: 'tan', insert: 'tan(', label: 'tan(' },
        { id: 'asin', insert: 'asin(', label: 'sin⁻¹(' },
      ],
    },
    {
      id: 'calc',
      title: vi ? 'Giải tích' : 'Calculus',
      items: [
        { id: 'd', insert: 'd(x^2,1)', label: 'd/dx' },
        { id: 'int', insert: 'int(x,0,1)', label: '∫' },
        { id: 'sum', insert: 'sum(1,10,x)', label: 'Σ' },
      ],
    },
    {
      id: 'prob',
      title: vi ? 'Tổ hợp' : 'Probability',
      items: [
        { id: 'nPr', insert: 'nPr(5,2)', label: 'nPr' },
        { id: 'nCr', insert: 'nCr(5,2)', label: 'nCr' },
        { id: 'fact', insert: 'fact(5)', label: 'n!' },
        { id: 'gcd', insert: 'gcd(12,18)', label: 'GCD' },
        { id: 'lcm', insert: 'lcm(12,18)', label: 'LCM' },
      ],
    },
  ];

  if (mode === 'complex') {
    return [{
      id: 'cplx',
      title: vi ? 'Số phức' : 'Complex',
      items: [
        { id: 'i', insert: 'i', label: 'i' },
        { id: 're', insert: 're(', label: 'Re(' },
        { id: 'im', insert: 'im(', label: 'Im(' },
        { id: 'arg', insert: 'arg(', label: 'arg(' },
        { id: 'conj', insert: 'conj(', label: 'conj(' },
        { id: 'polar', insert: 'polar(', label: 'r∠θ' },
      ],
    }];
  }
  if (mode === 'matrix') {
    return [{
      id: 'mat',
      title: vi ? 'Ma trận' : 'Matrix',
      items: [
        { id: 'det', insert: 'det', label: 'det' },
        { id: 'inv', insert: 'inv', label: 'Inv' },
        { id: 'tr', insert: 'tr', label: 'Tr' },
      ],
    }];
  }
  if (mode === 'vector') {
    return [{
      id: 'vct',
      title: vi ? 'Vectơ' : 'Vector',
      items: [
        { id: 'dot', insert: 'dot', label: 'Dot' },
        { id: 'cross', insert: 'cross', label: 'Cross' },
        { id: 'norm', insert: 'norm', label: '|v|' },
      ],
    }];
  }
  if (mode === 'table') {
    return [{
      id: 'tbl',
      title: vi ? 'Hàm mẫu' : 'Sample f(x)',
      items: [
        { id: 'x2', insert: 'x^2', label: 'x²' },
        { id: 'sin', insert: 'sin(x)', label: 'sin(x)' },
        { id: 'cos', insert: 'cos(x)', label: 'cos(x)' },
        { id: 'sqrt', insert: 'sqrt(x)', label: '√x' },
        { id: 'log', insert: 'log(x)', label: 'log(x)' },
        { id: 'exp', insert: 'e^x', label: 'eˣ' },
      ],
    }];
  }
  if (mode === 'equation') {
    return [{
      id: 'eqn',
      title: vi ? 'Loại PT' : 'Equation type',
      items: [
        { id: 'quad', insert: '__EQN_QUAD__', label: vi ? 'Bậc 2' : 'Quadratic' },
        { id: 'simul', insert: '__EQN_SIMUL__', label: vi ? 'Hệ 2 ẩn' : 'Simultaneous' },
        { id: 'linear', insert: '__EQN_LINEAR__', label: vi ? 'Bậc 1' : 'Linear' },
      ],
    }];
  }
  if (mode === 'distribution') {
    return [{
      id: 'dist',
      title: vi ? 'Phân phối' : 'Distribution',
      items: [
        { id: 'norm', insert: '__DIST_NORMAL__', label: 'Normal' },
        { id: 'binom', insert: '__DIST_BINOM__', label: 'Binomial' },
        { id: 'pois', insert: '__DIST_POISSON__', label: 'Poisson' },
      ],
    }];
  }
  if (mode === 'basen') {
    return [{
      id: 'base',
      title: vi ? 'Cơ số' : 'Base',
      items: [
        { id: 'dec', insert: '__BASE_10__', label: 'DEC' },
        { id: 'hex', insert: '__BASE_16__', label: 'HEX' },
        { id: 'oct', insert: '__BASE_8__', label: 'OCT' },
        { id: 'bin', insert: '__BASE_2__', label: 'BIN' },
      ],
    }];
  }
  if (mode === 'inequality') {
    return [{
      id: 'ineq',
      title: vi ? 'Loại BPT' : 'Inequality type',
      items: [
        { id: 'lin', insert: '__INEQ_LINEAR__', label: vi ? 'Tuyến tính' : 'Linear' },
        { id: 'quad', insert: '__INEQ_QUAD__', label: vi ? 'Bậc 2' : 'Quadratic' },
      ],
    }];
  }
  if (mode === 'mathbox') {
    return [{
      id: 'box',
      title: vi ? 'Công cụ' : 'Tools',
      items: [
        { id: 'dice', insert: '__MBOX_DICE__', label: vi ? 'Xúc xắc' : 'Dice' },
        { id: 'coin', insert: '__MBOX_COIN__', label: vi ? 'Đồng xu' : 'Coin' },
        { id: 'rand', insert: '__MBOX_RAND__', label: vi ? 'Ngẫu nhiên' : 'Random' },
      ],
    }];
  }
  return calc;
}

export function getTools(mode: ModeId, lang: Language): CatalogGroup[] {
  const vi = lang === 'vi';
  const common: CatalogGroup = {
    id: 'tools',
    title: vi ? 'Công cụ' : 'Tools',
    items: [
      { id: 'format', insert: '__FORMAT__', label: vi ? 'Định dạng' : 'Format' },
      { id: 'sto', insert: '__STO__', label: vi ? 'Lưu Ans' : 'Store Ans' },
      { id: 'hist', insert: '__HIST__', label: vi ? 'Lịch sử' : 'History' },
    ],
  };

  if (mode === 'spreadsheet') {
    return [{
      id: 'sheet',
      title: vi ? 'Bảng tính' : 'Spreadsheet',
      items: [
        { id: 'sum', insert: '__SHEET_SUM__', label: 'SUM()' },
        { id: 'avg', insert: '__SHEET_AVG__', label: 'AVG()' },
        { id: 'min', insert: '__SHEET_MIN__', label: 'MIN()' },
        { id: 'max', insert: '__SHEET_MAX__', label: 'MAX()' },
      ],
    }, common];
  }
  if (mode === 'statistics') {
    return [{
      id: 'stat',
      title: vi ? 'Thống kê' : 'Statistics',
      items: [
        { id: 'calc', insert: '__STATCALC__', label: 'CALC' },
        { id: '1var', insert: '__STAT_1VAR__', label: '1-Var' },
        { id: '2var', insert: '__STAT_2VAR__', label: '2-Var' },
      ],
    }, common];
  }
  if (mode === 'distribution') {
    return [{
      id: 'dfunc',
      title: vi ? 'Hàm' : 'Function',
      items: [
        { id: 'pd', insert: '__DIST_PD__', label: 'PD' },
        { id: 'cd', insert: '__DIST_CD__', label: 'CD' },
        { id: 'inv', insert: '__DIST_INV__', label: 'Inv' },
      ],
    }, common];
  }
  if (mode === 'table') {
    return [{
      id: 'trange',
      title: vi ? 'Khoảng mẫu' : 'Sample range',
      items: [
        { id: 'r1', insert: '__TABLE_RANGE1__', label: '1→5 step 1' },
        { id: 'r2', insert: '__TABLE_RANGE2__', label: '-2→2 step 0.5' },
      ],
    }, common];
  }
  if (mode === 'matrix' || mode === 'vector') {
    return [{
      id: 'mem',
      title: vi ? 'Bộ nhớ' : 'Memory',
      items: [
        { id: 'a', insert: '__MAT_A__', label: mode === 'matrix' ? 'MatA' : 'VctA' },
        { id: 'b', insert: '__MAT_B__', label: mode === 'matrix' ? 'MatB' : 'VctB' },
        { id: 'c', insert: '__MAT_C__', label: mode === 'matrix' ? 'MatC' : 'VctC' },
      ],
    }, common];
  }
  return [common];
}

export function applyCatalogItem(
  mode: ModeId,
  modeState: ModeState,
  insert: string,
): CatalogApplyResult {
  if (insert.startsWith('__')) {
    return applySpecialAction(mode, modeState, insert);
  }

  if (mode === 'calculate' || mode === 'complex') {
    return { kind: 'insert', field: 'expression' };
  }
  if (mode === 'table' && modeState.table.screen === 'func') {
    return { kind: 'insert', field: 'inputBuffer' };
  }
  if (mode === 'basen') {
    return { kind: 'insert', field: 'basenExpr' };
  }
  return { kind: 'none' };
}

function applySpecialAction(
  mode: ModeId,
  modeState: ModeState,
  insert: string,
): CatalogApplyResult {
  switch (insert) {
    case '__EQN_QUAD__':
      return {
        kind: 'modeState',
        modeState: {
          ...modeState,
          equation: { ...createEquationState(), eqnType: 'quadratic', screen: 'input', coeffIndex: 0 },
        },
      };
    case '__EQN_SIMUL__':
      return {
        kind: 'modeState',
        modeState: {
          ...modeState,
          equation: { ...createEquationState(), eqnType: 'simultaneous', screen: 'input', coeffIndex: 0 },
        },
      };
    case '__EQN_LINEAR__':
      return {
        kind: 'modeState',
        modeState: {
          ...modeState,
          equation: { ...createEquationState(), eqnType: 'general', screen: 'input', coeffIndex: 0 },
        },
      };
    case '__DIST_NORMAL__':
      return distType(modeState, 'normal');
    case '__DIST_BINOM__':
      return distType(modeState, 'binomial');
    case '__DIST_POISSON__':
      return distType(modeState, 'poisson');
    case '__DIST_PD__':
      return distFunc(modeState, 'pd');
    case '__DIST_CD__':
      return distFunc(modeState, 'cd');
    case '__DIST_INV__':
      return distFunc(modeState, 'inv');
    case '__BASE_10__':
      return setBase(modeState, 10);
    case '__BASE_16__':
      return setBase(modeState, 16);
    case '__BASE_8__':
      return setBase(modeState, 8);
    case '__BASE_2__':
      return setBase(modeState, 2);
    case '__INEQ_LINEAR__':
      return {
        kind: 'modeState',
        modeState: {
          ...modeState,
          inequality: { ...modeState.inequality, ineqType: 'linear', screen: 'input' },
        },
      };
    case '__INEQ_QUAD__':
      return {
        kind: 'modeState',
        modeState: {
          ...modeState,
          inequality: { ...modeState.inequality, ineqType: 'quadratic', screen: 'input' },
        },
      };
    case '__MBOX_DICE__':
      return mathboxTool(modeState, 'dice');
    case '__MBOX_COIN__':
      return mathboxTool(modeState, 'coin');
    case '__MBOX_RAND__':
      return mathboxTool(modeState, 'rand');
    case '__STAT_1VAR__':
      return {
        kind: 'modeState',
        modeState: {
          ...modeState,
          statistics: {
            ...modeState.statistics,
            dataType: '1-var',
            screen: 'data-input',
            data: [],
            calcOptions: ['n', 'Σx', 'x̄', 'σx', 'σ', 'minX', 'maxX', 'Med', 'Q1', 'Q3'],
            inputBuffer: '',
            inputField: 'x',
          },
        },
      };
    case '__STAT_2VAR__':
      return {
        kind: 'modeState',
        modeState: {
          ...modeState,
          statistics: {
            ...modeState.statistics,
            dataType: '2-var',
            screen: 'data-input',
            data: [],
            calcOptions: ['n', 'Σx', 'Σy', 'x̄', 'ȳ', 'A', 'B', 'r', 'ŷ'],
            inputBuffer: '',
            inputField: 'x',
          },
        },
      };
    case '__SHEET_SUM__':
      return sheetFormula(modeState, '=SUM(A1:A3)');
    case '__SHEET_AVG__':
      return sheetFormula(modeState, '=AVG(A1:A3)');
    case '__SHEET_MIN__':
      return sheetFormula(modeState, '=MIN(A1:A3)');
    case '__SHEET_MAX__':
      return sheetFormula(modeState, '=MAX(A1:A3)');
    case '__TABLE_RANGE1__':
      return tableRange(modeState, '1', '5', '1');
    case '__TABLE_RANGE2__':
      return tableRange(modeState, '-2', '2', '0.5');
    case '__MAT_A__':
      return matrixTarget(modeState, mode, 'A');
    case '__MAT_B__':
      return matrixTarget(modeState, mode, 'B');
    case '__MAT_C__':
      return matrixTarget(modeState, mode, 'C');
    default:
      return { kind: 'none' };
  }
}

function distType(modeState: ModeState, distType: 'normal' | 'binomial' | 'poisson'): CatalogApplyResult {
  return {
    kind: 'modeState',
    modeState: {
      ...modeState,
      distribution: {
        ...createDistributionState(),
        distType,
        screen: 'func',
        distFunc: modeState.distribution.distFunc,
      },
    },
  };
}

function distFunc(modeState: ModeState, distFunc: 'pd' | 'cd' | 'inv'): CatalogApplyResult {
  return {
    kind: 'modeState',
    modeState: {
      ...modeState,
      distribution: {
        ...modeState.distribution,
        distFunc,
        screen: 'input',
        paramIndex: 0,
        inputBuffer: '',
      },
    },
  };
}

function setBase(modeState: ModeState, base: BaseNBase): CatalogApplyResult {
  return {
    kind: 'modeState',
    modeState: {
      ...modeState,
      basen: { ...modeState.basen, base, result: '' },
    },
  };
}

function mathboxTool(
  modeState: ModeState,
  tool: 'dice' | 'coin' | 'rand',
): CatalogApplyResult {
  return {
    kind: 'modeState',
    modeState: {
      ...modeState,
      mathbox: { ...modeState.mathbox, tool, screen: 'run', inputBuffer: '' },
    },
  };
}

function sheetFormula(modeState: ModeState, formula: string): CatalogApplyResult {
  const sheet = modeState.spreadsheet;
  return {
    kind: 'modeState',
    modeState: {
      ...modeState,
      spreadsheet: { ...sheet, editBuffer: formula, editing: true },
    },
  };
}

function tableRange(
  modeState: ModeState,
  start: string,
  end: string,
  step: string,
): CatalogApplyResult {
  return {
    kind: 'modeState',
    modeState: {
      ...modeState,
      table: {
        ...modeState.table,
        start,
        end,
        step,
        screen: 'func',
        inputBuffer: modeState.table.functionExpr || modeState.table.inputBuffer,
      },
    },
  };
}

function matrixTarget(modeState: ModeState, mode: ModeId, target: 'A' | 'B' | 'C'): CatalogApplyResult {
  if (mode === 'matrix') {
    return {
      kind: 'modeState',
      modeState: {
        ...modeState,
        matrix: { ...modeState.matrix, target: `Mat${target}` as 'MatA' | 'MatB' | 'MatC', screen: 'menu' },
      },
    };
  }
  if (mode === 'vector') {
    return {
      kind: 'modeState',
      modeState: {
        ...modeState,
        vector: { ...modeState.vector, target: `Vct${target}` as 'VctA' | 'VctB' | 'VctC', screen: 'menu' },
      },
    };
  }
  return { kind: 'none' };
}
