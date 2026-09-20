import type { CatalogGroup, ModeId } from './types';
import type { Language } from './settings';

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
      title: 'Spreadsheet',
      items: [{ id: 'sum', insert: '=SUM(A1:A3)', label: 'SUM()' }],
    }];
  }
  if (mode === 'statistics') {
    return [{
      id: 'stat',
      title: vi ? 'Thống kê' : 'Statistics',
      items: [{ id: 'calc', insert: '__STATCALC__', label: 'CALC' }],
    }];
  }
  return [common];
}
