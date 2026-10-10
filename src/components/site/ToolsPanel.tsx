import { useEffect, useMemo, useState } from 'react';
import { useCalculatorStore } from '../../store/calculatorStore';
import type { Language } from '../../core/settings';
import type { VariableName } from '../../core/types';
import { formatNumber } from '../../core/format';
import { toNaturalDisplay } from '../../core/naturalDisplay';
import { NaturalLine } from '../display/NaturalLine';
import { PHYSICAL_CONSTANTS, numberToExpression } from '../../core/tools/constants';
import { UNIT_CATEGORIES, convertUnit } from '../../core/tools/units';
import {
  MAX_FACTOR_INPUT,
  divisorCount,
  divisorsFromFactors,
  formatFactorization,
  gcdInt,
  isPrime,
  lcmInt,
  primeFactorize,
} from '../../core/tools/numberTheory';
import { CALC_OPTIONS_1VAR, CALC_OPTIONS_2VAR, compute1Var, compute2Var } from '../../core/modes/statistics';
import { GraphTool } from './tools/GraphTool';
import { SolveTool } from './tools/SolveTool';
import { BaseTool, MatrixTool, TableTool } from './tools/MoreTools';

type TabId =
  | 'solve' | 'graph' | 'history' | 'variables' | 'more'
  | 'matrix' | 'table' | 'base' | 'constants' | 'units' | 'number' | 'stats';

interface TabDef {
  id: TabId;
  vi: string;
  en: string;
  icon: string;
  descVi?: string;
  descEn?: string;
}

const PRIMARY_TABS: TabDef[] = [
  { id: 'solve', vi: 'Giải', en: 'Solve', icon: 'ƒ' },
  { id: 'graph', vi: 'Đồ thị', en: 'Graph', icon: '∿' },
  { id: 'history', vi: 'Lịch sử', en: 'History', icon: '⟲' },
  { id: 'variables', vi: 'Biến', en: 'Variables', icon: 'x' },
];

const MORE_TABS: TabDef[] = [
  { id: 'matrix', vi: 'Ma trận', en: 'Matrix', icon: '▦', descVi: 'det, nghịch đảo, hạng, trị riêng, giải hệ', descEn: 'det, inverse, rank, eigenvalues, systems' },
  { id: 'table', vi: 'Bảng giá trị', en: 'Table', icon: '⊞', descVi: 'Bảng f(x), g(x) — chép sang Excel', descEn: 'f(x), g(x) table — copy to Excel' },
  { id: 'base', vi: 'Cơ số N', en: 'Base-N', icon: '⒉', descVi: 'DEC · HEX · OCT · BIN, bù 2', descEn: "DEC · HEX · OCT · BIN, two's complement" },
  { id: 'stats', vi: 'Thống kê', en: 'Statistics', icon: 'Σ', descVi: 'Dán dãy số → trung bình, σ, tứ phân vị', descEn: 'Paste data → mean, σ, quartiles' },
  { id: 'number', vi: 'Số học', en: 'Number theory', icon: '#', descVi: 'Phân tích thừa số, ước, ƯCLN, BCNN', descEn: 'Factorization, divisors, GCD, LCM' },
  { id: 'constants', vi: 'Hằng số', en: 'Constants', icon: 'ħ', descVi: '20 hằng số vật lý CODATA', descEn: '20 CODATA physical constants' },
  { id: 'units', vi: 'Đơn vị', en: 'Units', icon: '⇄', descVi: 'Đổi 12 loại đơn vị', descEn: 'Convert 12 kinds of units' },
];

const VAR_NAMES: VariableName[] = ['A', 'B', 'C', 'D', 'E', 'F', 'x', 'y', 'z'];

type Tr = (vi: string, en: string) => string;

function useAfterAction() {
  const setToolsOpen = useCalculatorStore((s) => s.setToolsOpen);
  return (fn: () => void) => {
    fn();
    if (window.matchMedia('(max-width: 768px)').matches) setToolsOpen(false);
    else document.querySelector<HTMLElement>('[data-calculator-shell]')?.focus({ preventScroll: true });
  };
}

function shortNumber(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  if (abs !== 0 && (abs >= 1e10 || abs < 1e-4)) return v.toExponential(6).replace(/\.?0+e/, 'e');
  return Number(v.toPrecision(10)).toString();
}

function HistoryTool({ tr }: { tr: Tr }) {
  const history = useCalculatorStore((s) => s.history);
  const loadExpression = useCalculatorStore((s) => s.loadExpression);
  const insertText = useCalculatorStore((s) => s.insertText);
  const clearHistory = useCalculatorStore((s) => s.clearHistory);
  const after = useAfterAction();
  const [copied, setCopied] = useState(false);
  const items = [...history].reverse();

  const copyAll = () => {
    const text = history.map((h) => `${h.expression} = ${h.result}`).join('\n');
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  const downloadCsv = () => {
    const cell = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const csv = ['expression,result,value', ...history.map((h) => [cell(h.expression), cell(h.result), h.value].join(','))].join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'premt-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!items.length) {
    return (
      <p className="toolEmpty">
        {tr('Chưa có phép tính nào. Bấm EXE trong chế độ Tính toán để lưu lịch sử.', 'No calculations yet. Press EXE in Calculate to record history.')}
      </p>
    );
  }

  return (
    <div className="toolBody">
      <div className="toolRow">
        <span className="toolMuted">{items.length} {tr('phép tính', 'entries')}</span>
        <span className="toolSpacer" />
        <button type="button" className="toolLink" onClick={copyAll}>{copied ? tr('Đã chép ✓', 'Copied ✓') : tr('Sao chép', 'Copy')}</button>
        <button type="button" className="toolLink" onClick={downloadCsv}>CSV</button>
        <button type="button" className="toolLink toolDanger" onClick={clearHistory}>{tr('Xóa hết', 'Clear')}</button>
      </div>
      <ul className="toolList">
        {items.map((item, i) => (
          <li className="historyItem" key={`${history.length - i}`}>
            <div className="historyExpr"><NaturalLine text={toNaturalDisplay(item.expression)} /></div>
            <div className="historyResult">= {item.result}</div>
            <div className="toolRow">
              <button type="button" className="toolChip" onClick={() => after(() => loadExpression(item.expression))}>
                {tr('Dùng biểu thức', 'Use input')}
              </button>
              <button type="button" className="toolChip" onClick={() => after(() => insertText(numberToExpression(item.value)))}>
                {tr('Dùng kết quả', 'Use result')}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VariablesTool({ tr }: { tr: Tr }) {
  const variables = useCalculatorStore((s) => s.variables);
  const ans = useCalculatorStore((s) => s.ans);
  const preAns = useCalculatorStore((s) => s.preAns);
  const settings = useCalculatorStore((s) => s.settings);
  const setVariable = useCalculatorStore((s) => s.setVariable);
  const insertText = useCalculatorStore((s) => s.insertText);
  const after = useAfterAction();
  const [editing, setEditing] = useState<{ name: VariableName; text: string } | null>(null);

  const commit = () => {
    if (!editing) return;
    const value = Number(editing.text.replace(',', '.'));
    if (editing.text.trim() && Number.isFinite(value)) setVariable(editing.name, value);
    setEditing(null);
  };

  const rows: { name: string; value: number; token: string; editable?: VariableName }[] = [
    ...VAR_NAMES.map((name) => ({ name, value: variables[name], token: name, editable: name })),
    { name: 'Ans', value: ans, token: 'Ans' },
    { name: 'PreAns', value: preAns, token: 'PreAns' },
  ];

  return (
    <div className="toolBody">
      <p className="toolHint">{tr('Chạm vào giá trị để sửa, "Chèn" để đưa tên biến vào biểu thức.', 'Tap a value to edit it, "Insert" puts the variable into the expression.')}</p>
      <ul className="toolList">
        {rows.map((row) => (
          <li className="varRow" key={row.name}>
            <span className="varName">{row.name}</span>
            {editing && editing.name === row.editable ? (
              <input
                className="toolInput"
                autoFocus
                inputMode="decimal"
                value={editing.text}
                onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') setEditing(null);
                }}
              />
            ) : (
              <button
                type="button"
                className="varValue"
                disabled={!row.editable}
                onClick={() => row.editable && setEditing({ name: row.editable, text: String(row.value) })}
              >
                {formatNumber(row.value, settings)}
              </button>
            )}
            <button type="button" className="toolChip" onClick={() => after(() => insertText(row.token))}>
              {tr('Chèn', 'Insert')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConstantsTool({ tr, language }: { tr: Tr; language: Language }) {
  const insertText = useCalculatorStore((s) => s.insertText);
  const after = useAfterAction();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const list = PHYSICAL_CONSTANTS.filter((c) => !q || `${c.symbol} ${c.vi} ${c.en}`.toLowerCase().includes(q));

  return (
    <div className="toolBody">
      <input
        className="toolInput"
        placeholder={tr('Tìm hằng số…', 'Search constants…')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="toolList">
        {list.map((c) => (
          <li key={c.symbol}>
            <button
              type="button"
              className="constRow"
              onClick={() => after(() => insertText(numberToExpression(c.value)))}
              title={tr('Chèn vào máy', 'Insert into calculator')}
            >
              <span className="constSymbol">{c.symbol}</span>
              <span className="constInfo">
                <span className="constName">{language === 'vi' ? c.vi : c.en}</span>
                <span className="constValue">{shortNumber(c.value)} {c.unit}</span>
              </span>
              <span className="toolChip">{tr('Chèn', 'Insert')}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UnitsTool({ tr, language }: { tr: Tr; language: Language }) {
  const insertText = useCalculatorStore((s) => s.insertText);
  const after = useAfterAction();
  const [categoryId, setCategoryId] = useState('length');
  const category = UNIT_CATEGORIES.find((c) => c.id === categoryId) ?? UNIT_CATEGORIES[0];
  const [from, setFrom] = useState(category.units[0].id);
  const [to, setTo] = useState(category.units[1].id);
  const [value, setValue] = useState('1');

  const changeCategory = (id: string) => {
    const next = UNIT_CATEGORIES.find((c) => c.id === id) ?? UNIT_CATEGORIES[0];
    setCategoryId(next.id);
    setFrom(next.units[0].id);
    setTo(next.units[1].id);
  };

  const input = Number(value.replace(',', '.'));
  const result = value.trim() && Number.isFinite(input) ? convertUnit(input, category.id, from, to) : NaN;

  return (
    <div className="toolBody">
      <label className="toolField">
        <span>{tr('Loại', 'Category')}</span>
        <select className="toolInput" value={category.id} onChange={(e) => changeCategory(e.target.value)}>
          {UNIT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{language === 'vi' ? c.vi : c.en}</option>)}
        </select>
      </label>
      <div className="unitGrid">
        <input className="toolInput" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
        <select className="toolInput" value={from} onChange={(e) => setFrom(e.target.value)}>
          {category.units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
        </select>
        <button
          type="button"
          className="toolIconBtn"
          aria-label={tr('Đổi chiều', 'Swap')}
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
        >
          ⇅
        </button>
        <select className="toolInput" value={to} onChange={(e) => setTo(e.target.value)}>
          {category.units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
        </select>
      </div>
      <div className="toolResult">
        <span className="toolResultValue">{shortNumber(result)}</span>
        <span className="toolMuted">{category.units.find((u) => u.id === to)?.label}</span>
        <span className="toolSpacer" />
        <button
          type="button"
          className="toolChip"
          disabled={!Number.isFinite(result)}
          onClick={() => after(() => insertText(numberToExpression(result)))}
        >
          {tr('Chèn', 'Insert')}
        </button>
      </div>
    </div>
  );
}

function NumberTool({ tr }: { tr: Tr }) {
  const insertText = useCalculatorStore((s) => s.insertText);
  const after = useAfterAction();
  const [a, setA] = useState('360');
  const [b, setB] = useState('84');

  const parseInt_ = (s: string) => {
    const n = Number(s.trim());
    return s.trim() && Number.isInteger(n) && n !== 0 && Math.abs(n) <= MAX_FACTOR_INPUT ? n : null;
  };
  const na = parseInt_(a);
  const nb = parseInt_(b);
  const factors = useMemo(() => (na !== null ? primeFactorize(na) : []), [na]);
  const divisors = useMemo(() => (na !== null && divisorCount(factors) <= 400 ? divisorsFromFactors(factors) : null), [na, factors]);

  const insertable = (label: string, value: number) => (
    <div className="toolResult" key={label}>
      <span className="toolMuted">{label}</span>
      <span className="toolResultValue">{value}</span>
      <span className="toolSpacer" />
      <button type="button" className="toolChip" onClick={() => after(() => insertText(String(value)))}>{tr('Chèn', 'Insert')}</button>
    </div>
  );

  return (
    <div className="toolBody">
      <div className="unitGrid unitGrid2">
        <label className="toolField">
          <span>{tr('Số A', 'Number A')}</span>
          <input className="toolInput" inputMode="numeric" value={a} onChange={(e) => setA(e.target.value)} />
        </label>
        <label className="toolField">
          <span>{tr('Số B (cho ƯCLN / BCNN)', 'Number B (GCD / LCM)')}</span>
          <input className="toolInput" inputMode="numeric" value={b} onChange={(e) => setB(e.target.value)} />
        </label>
      </div>
      {na === null ? (
        <p className="toolHint">{tr('Nhập số nguyên khác 0, tối đa 10¹².', 'Enter a non-zero integer up to 10¹².')}</p>
      ) : (
        <>
          <div className="toolResult">
            <span className="toolMuted">{tr('Thừa số nguyên tố', 'Prime factors')}</span>
            <span className="toolResultValue">
              {na < 0 ? '−' : ''}{formatFactorization(factors)}
              {isPrime(na) && <em className="toolBadge">{tr('số nguyên tố', 'prime')}</em>}
            </span>
          </div>
          <div className="toolResultBlock">
            <span className="toolMuted">{tr('Ước dương', 'Positive divisors')} ({divisorCount(factors)})</span>
            <p className="toolMono">{divisors ? divisors.join(', ') : tr('Quá nhiều ước để liệt kê.', 'Too many divisors to list.')}</p>
          </div>
        </>
      )}
      {na !== null && nb !== null && (
        <>
          {insertable(tr('ƯCLN (GCD)', 'GCD'), gcdInt(na, nb))}
          {insertable(tr('BCNN (LCM)', 'LCM'), lcmInt(na, nb))}
        </>
      )}
    </div>
  );
}

function StatsTool({ tr }: { tr: Tr }) {
  const insertText = useCalculatorStore((s) => s.insertText);
  const loadStatData = useCalculatorStore((s) => s.loadStatData);
  const after = useAfterAction();
  const [kind, setKind] = useState<'1' | '2'>('1');
  const [text, setText] = useState('2 4 4 4 5 5 7 9');
  const [pairsText, setPairsText] = useState('1 2.1\n2 3.9\n3 6.2\n4 7.8\n5 10.1');
  const [predictX, setPredictX] = useState('6');

  const values = useMemo(
    () => text.split(/[\s;,]+/).map((s) => s.trim()).filter(Boolean).map(Number).filter(Number.isFinite),
    [text],
  );
  const rows = useMemo(() => values.map((x) => ({ x, freq: 1 })), [values]);
  const pairs = useMemo(
    () =>
      pairsText
        .split('\n')
        .map((line) => line.trim().split(/[\s;,]+/).map(Number))
        .filter((p) => p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]))
        .map(([x, y]) => ({ x, y, freq: 1 })),
    [pairsText],
  );

  const kindSwitch = (
    <div className="solveModes solveModes2" role="radiogroup">
      {(['1', '2'] as const).map((k) => (
        <button
          type="button"
          role="radio"
          key={k}
          aria-checked={kind === k}
          className={`solveMode ${kind === k ? 'solveModeActive' : ''}`}
          onClick={() => setKind(k)}
        >
          {k === '1' ? tr('1 biến', '1-variable') : tr('2 biến · hồi quy', '2-variable · regression')}
        </button>
      ))}
    </div>
  );

  if (kind === '2') {
    const a = compute2Var(pairs, 'a');
    const b = compute2Var(pairs, 'b');
    const px = Number(predictX.replace(',', '.'));
    const predicted = predictX.trim() && Number.isFinite(px) ? a + b * px : NaN;
    return (
      <div className="toolBody">
        {kindSwitch}
        <label className="toolField">
          <span>{tr('Cặp số x y — mỗi dòng một cặp (dán từ Excel được)', 'x y pairs — one per line (paste from Excel works)')}</span>
          <textarea className="toolInput toolTextarea" rows={5} value={pairsText} onChange={(e) => setPairsText(e.target.value)} />
        </label>
        {pairs.length >= 2 ? (
          <>
            <div className="toolResult">
              <span className="toolMuted">{tr('Hồi quy', 'Regression')}</span>
              <span className="toolResultValue">
                y = {shortNumber(a)} {b < 0 ? '−' : '+'} {shortNumber(Math.abs(b))}x
              </span>
            </div>
            <div className="statGrid">
              {CALC_OPTIONS_2VAR.map((opt) => {
                const v = compute2Var(pairs, opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    className="statCell"
                    disabled={!Number.isFinite(v)}
                    title={tr('Chèn vào máy', 'Insert into calculator')}
                    onClick={() => after(() => insertText(numberToExpression(v)))}
                  >
                    <span className="toolMuted">{opt}</span>
                    <span className="statValue">{shortNumber(v)}</span>
                  </button>
                );
              })}
            </div>
            <div className="toolResult">
              <span className="toolMuted">ŷ ({tr('dự đoán', 'predict')}) x =</span>
              <input className="toolInput solvePredict" inputMode="decimal" value={predictX} onChange={(e) => setPredictX(e.target.value)} />
              <span className="toolResultValue">→ {shortNumber(predicted)}</span>
              <span className="toolSpacer" />
              <button type="button" className="toolChip" disabled={!Number.isFinite(predicted)} onClick={() => after(() => insertText(numberToExpression(predicted)))}>
                {tr('Chèn', 'Insert')}
              </button>
            </div>
          </>
        ) : (
          <p className="toolHint">{tr('Nhập ít nhất hai cặp số.', 'Enter at least two pairs.')}</p>
        )}
      </div>
    );
  }

  return (
    <div className="toolBody">
      {kindSwitch}
      <label className="toolField">
        <span>{tr('Dãy số (cách nhau bởi dấu cách, phẩy hoặc xuống dòng)', 'Data (space, comma or newline separated)')}</span>
        <textarea className="toolInput toolTextarea" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      {values.length > 0 ? (
        <>
          <div className="statGrid">
            {CALC_OPTIONS_1VAR.map((opt) => {
              const v = compute1Var(rows, opt);
              return (
                <button
                  type="button"
                  key={opt}
                  className="statCell"
                  disabled={!Number.isFinite(v)}
                  title={tr('Chèn vào máy', 'Insert into calculator')}
                  onClick={() => after(() => insertText(numberToExpression(v)))}
                >
                  <span className="toolMuted">{opt}</span>
                  <span className="statValue">{shortNumber(v)}</span>
                </button>
              );
            })}
          </div>
          <button type="button" className="toolChip toolChipPrimary" onClick={() => after(() => loadStatData(values))}>
            {tr(`Nạp ${values.length} số vào chế độ Thống kê`, `Load ${values.length} values into Statistics`)}
          </button>
        </>
      ) : (
        <p className="toolHint">{tr('Nhập ít nhất một số.', 'Enter at least one number.')}</p>
      )}
    </div>
  );
}

export function ToolsPanel({ language }: { language: Language }) {
  const tr: Tr = (vi, en) => (language === 'vi' ? vi : en);
  const [tab, setTab] = useState<TabId>('solve');
  const open = useCalculatorStore((s) => s.toolsOpen);
  const setToolsOpen = useCalculatorStore((s) => s.setToolsOpen);
  const after = useAfterAction();
  const [graphSeed, setGraphSeed] = useState<{ key: number; exprs: string[] } | null>(null);
  const moreTab = MORE_TABS.find((t) => t.id === tab);

  useEffect(() => {
    if (location.hash.startsWith('#solve=')) setToolsOpen(true);
  }, [setToolsOpen]);

  const plot = (exprs: string[]) => {
    setGraphSeed({ key: Date.now(), exprs });
    setTab('graph');
  };

  return (
    <>
      <div className={`toolsBackdrop ${open ? 'toolsBackdropOpen' : ''}`} onClick={() => setToolsOpen(false)} />
      <section className={`toolsPanel ${open ? 'toolsPanelOpen' : ''}`} aria-label={tr('Công cụ', 'Tools')}>
        <div className="toolsHeader">
          <span className="toolsGrip" aria-hidden="true" />
          <strong>{tr('Công cụ', 'Tools')}</strong>
          <button type="button" className="toolIconBtn toolsClose" aria-label={tr('Đóng', 'Close')} onClick={() => setToolsOpen(false)}>×</button>
        </div>
        <div className="toolsTabs" role="tablist">
          {PRIMARY_TABS.map((t) => (
            <button
              type="button"
              role="tab"
              key={t.id}
              aria-selected={tab === t.id}
              className={`toolsTab ${tab === t.id ? 'toolsTabActive' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="toolsTabIcon" aria-hidden="true">{t.icon}</span>
              {language === 'vi' ? t.vi : t.en}
            </button>
          ))}
          <button
            type="button"
            role="tab"
            aria-selected={!!moreTab || tab === 'more'}
            className={`toolsTab toolsTabMore ${moreTab || tab === 'more' ? 'toolsTabActive' : ''}`}
            onClick={() => setTab('more')}
          >
            <span className="toolsTabIcon" aria-hidden="true">{moreTab ? moreTab.icon : '⋯'}</span>
            {moreTab ? (language === 'vi' ? moreTab.vi : moreTab.en) : tr('Thêm', 'More')}
            <span aria-hidden="true" className="toolsTabCaret">▾</span>
          </button>
        </div>
        <div className="toolsContent">
          {tab === 'more' && (
            <div className="moreGrid">
              {MORE_TABS.map((t) => (
                <button type="button" key={t.id} className="moreCard" onClick={() => setTab(t.id)}>
                  <span className="moreIcon" aria-hidden="true">{t.icon}</span>
                  <span className="moreText">
                    <strong>{language === 'vi' ? t.vi : t.en}</strong>
                    <span>{language === 'vi' ? t.descVi : t.descEn}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {tab === 'solve' && <SolveTool language={language} onDone={after} onPlot={plot} />}
          {tab === 'history' && <HistoryTool tr={tr} />}
          {tab === 'variables' && <VariablesTool tr={tr} />}
          {tab === 'graph' && <GraphTool key={graphSeed?.key} seed={graphSeed?.exprs} language={language} />}
          {tab === 'matrix' && <MatrixTool tr={tr} />}
          {tab === 'table' && <TableTool tr={tr} />}
          {tab === 'base' && <BaseTool tr={tr} after={after} />}
          {tab === 'constants' && <ConstantsTool tr={tr} language={language} />}
          {tab === 'units' && <UnitsTool tr={tr} language={language} />}
          {tab === 'number' && <NumberTool tr={tr} />}
          {tab === 'stats' && <StatsTool tr={tr} />}
        </div>
      </section>
    </>
  );
}
