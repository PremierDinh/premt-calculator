import { useMemo, useState } from 'react';
import { useCalculatorStore } from '../../../store/calculatorStore';
import { createEvalContext, evaluateExpression } from '../../../math/evaluator';
import { det, inverse, trace, transpose, type Matrix } from '../../../math/matrix';
import { RADIXES, formatInRadix, parseInRadix, twosComplement, type Radix } from '../../../core/tools/baseConvert';
import { eigenvalues, formatComplexRoot, rref } from '../../../core/tools/linalg';
import { compileFunction } from '../../../core/tools/solver';

type Tr = (vi: string, en: string) => string;
type After = (fn: () => void) => void;

function num(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  const s = abs !== 0 && (abs >= 1e10 || abs < 1e-6) ? v.toExponential(6).replace(/\.?0+e/, 'e') : String(Number(v.toPrecision(10)));
  return s.replace('-', '−');
}

function useCopy(): [string | null, (key: string, text: string) => void] {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, text: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1500);
    });
  };
  return [copied, copy];
}

export function BaseTool({ tr, after }: { tr: Tr; after: After }) {
  const insertText = useCalculatorStore((s) => s.insertText);
  const [radix, setRadix] = useState<Radix>(10);
  const [text, setText] = useState('2026');
  const [bits, setBits] = useState(16);
  const [copied, copy] = useCopy();
  const value = parseInRadix(text, radix);
  const twos = value !== null && value < 0n ? twosComplement(value, bits) : null;

  return (
    <div className="toolBody">
      <div className="solveModes solveModes4" role="radiogroup">
        {RADIXES.map((r) => (
          <button
            type="button"
            role="radio"
            key={r.radix}
            aria-checked={radix === r.radix}
            className={`solveMode ${radix === r.radix ? 'solveModeActive' : ''}`}
            onClick={() => {
              if (value !== null) setText(formatInRadix(value, r.radix, false).replace('−', '-'));
              setRadix(r.radix);
            }}
          >
            {r.label}
          </button>
        ))}
      </div>
      <input
        className="toolInput solveInput"
        value={text}
        spellCheck={false}
        autoCapitalize="off"
        onChange={(e) => setText(e.target.value)}
        aria-label={tr('Giá trị', 'Value')}
      />
      {value === null ? (
        <p className="toolHint solveError">{tr('Chữ số không hợp lệ cho cơ số này.', 'Invalid digit for this base.')}</p>
      ) : (
        <>
          {RADIXES.map((r) => {
            const shown = formatInRadix(value, r.radix);
            return (
              <div className="toolResult" key={r.radix}>
                <span className="toolMuted solveLabel">{r.label}</span>
                <span className="toolResultValue toolMono baseValue">{shown}</span>
                <span className="toolSpacer" />
                <button type="button" className="toolChip" onClick={() => copy(r.label, shown.replace(/ /g, ''))}>
                  {copied === r.label ? '✓' : tr('Chép', 'Copy')}
                </button>
              </div>
            );
          })}
          {value < 0n && (
            <div className="toolResult">
              <span className="toolMuted">{tr('Bù 2', "Two's compl.")}</span>
              <select className="toolInput solveStoreSelect" value={bits} onChange={(e) => setBits(Number(e.target.value))}>
                {[8, 16, 32, 64].map((b) => <option key={b} value={b}>{b}-bit</option>)}
              </select>
              <span className="toolResultValue toolMono baseValue">
                {twos === null ? tr('không vừa', 'overflow') : `${formatInRadix(twos, 16)}ₕ`}
              </span>
            </div>
          )}
          <p className="toolMuted">
            {tr('Số bit', 'Bit length')}: {(value < 0n ? -value : value).toString(2).length}
          </p>
          {Math.abs(Number(value)) <= Number.MAX_SAFE_INTEGER && (
            <button type="button" className="toolChip" onClick={() => after(() => insertText(String(value)))}>
              {tr('Chèn giá trị thập phân vào máy', 'Insert decimal value')}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function emptyMatrix(r: number, c: number): string[][] {
  return Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => (i === j ? '1' : '0')));
}

function MatrixView({ m }: { m: Matrix }) {
  return (
    <table className="matView">
      <tbody>
        {m.map((row, i) => (
          <tr key={i}>
            {row.map((v, j) => <td key={j}>{num(v)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function MatrixTool({ tr }: { tr: Tr }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [cells, setCells] = useState<string[][]>([
    ['2', '1', '-1'],
    ['-3', '-1', '2'],
    ['-2', '1', '2'],
  ]);

  const resize = (r: number, c: number) => {
    const next = emptyMatrix(r, c).map((row, i) => row.map((v, j) => cells[i]?.[j] ?? v));
    setRows(r);
    setCols(c);
    setCells(next);
  };

  const ctx = useMemo(() => createEvalContext({ angleUnit: 'rad' }), []);
  const parsed = useMemo<Matrix | null>(() => {
    try {
      const m = cells.map((row) => row.map((s) => evaluateExpression(s.trim() || '0', ctx)));
      return m.every((row) => row.every(Number.isFinite)) ? m : null;
    } catch {
      return null;
    }
  }, [cells, ctx]);

  const square = rows === cols;
  const results = useMemo(() => {
    if (!parsed) return null;
    const reduced = rref(parsed);
    const out: { title: string; scalar?: string; matrix?: Matrix; list?: string[] }[] = [
      { title: tr('Hạng', 'Rank'), scalar: String(reduced.rank) },
    ];
    if (square) {
      const d = det(parsed);
      out.push({ title: 'det', scalar: num(Math.abs(d) < 1e-12 ? 0 : d) });
      out.push({ title: tr('Vết (trace)', 'Trace'), scalar: num(trace(parsed)) });
      if (Math.abs(d) > 1e-12) out.push({ title: tr('Nghịch đảo A⁻¹', 'Inverse A⁻¹'), matrix: inverse(parsed) });
      else out.push({ title: tr('Nghịch đảo A⁻¹', 'Inverse A⁻¹'), scalar: tr('Không khả nghịch (det = 0)', 'Singular (det = 0)') });
      if (rows <= 4) out.push({ title: tr('Trị riêng', 'Eigenvalues'), list: eigenvalues(parsed).map(formatComplexRoot) });
    }
    out.push({ title: tr('Dạng bậc thang rút gọn (RREF)', 'Reduced row echelon form (RREF)'), matrix: reduced.matrix });
    out.push({ title: tr('Chuyển vị Aᵀ', 'Transpose Aᵀ'), matrix: transpose(parsed) });
    if (cols === rows + 1) {
      const solution = reduced.rank === rows && reduced.pivots.every((p, i) => p === i)
        ? reduced.matrix.map((row, i) => `x${'₁₂₃₄₅'[i]} = ${num(row[cols - 1])}`)
        : [tr('Hệ vô nghiệm hoặc vô số nghiệm — xem RREF.', 'No unique solution — see RREF.')];
      out.unshift({ title: tr('Nghiệm hệ (ma trận mở rộng)', 'System solution (augmented)'), list: solution });
    }
    return out;
  }, [parsed, square, rows, cols, tr]);

  return (
    <div className="toolBody">
      <div className="toolRow">
        <span className="toolMuted">{tr('Cỡ', 'Size')}</span>
        <select className="toolInput solveStoreSelect" value={rows} onChange={(e) => resize(Number(e.target.value), cols)}>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span>×</span>
        <select className="toolInput solveStoreSelect" value={cols} onChange={(e) => resize(rows, Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="toolSpacer" />
        <button type="button" className="toolLink" onClick={() => setCells(emptyMatrix(rows, cols))}>{tr('Đặt lại', 'Reset')}</button>
      </div>
      <p className="toolHint">
        {tr('Mẹo: cỡ n×(n+1) là ma trận mở rộng — tự giải hệ phương trình. Ô nhận biểu thức như 1/3, sqrt(2).', 'Tip: an n×(n+1) matrix is treated as an augmented system and solved. Cells accept expressions like 1/3, sqrt(2).')}
      </p>
      <div className="matGrid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {cells.map((row, i) =>
          row.map((v, j) => (
            <input
              key={`${i}-${j}`}
              className={`toolInput matCell ${cols === rows + 1 && j === cols - 1 ? 'matCellAug' : ''}`}
              value={v}
              inputMode="decimal"
              aria-label={`a${i + 1}${j + 1}`}
              onChange={(e) => setCells(cells.map((r, ri) => (ri === i ? r.map((c, ci) => (ci === j ? e.target.value : c)) : r)))}
            />
          )),
        )}
      </div>
      {!parsed && <p className="toolHint solveError">{tr('Có ô chưa hợp lệ.', 'Some cells are invalid.')}</p>}
      {results?.map((r) => (
        <div className="toolResultBlock" key={r.title}>
          <span className="toolMuted">{r.title}</span>
          {r.scalar !== undefined && <span className="toolResultValue">{r.scalar}</span>}
          {r.matrix && <MatrixView m={r.matrix} />}
          {r.list && <p className="toolMono">{r.list.join(';   ')}</p>}
        </div>
      ))}
    </div>
  );
}

export function TableTool({ tr }: { tr: Tr }) {
  const variables = useCalculatorStore((s) => s.variables);
  const ans = useCalculatorStore((s) => s.ans);
  const angleUnit = useCalculatorStore((s) => s.settings.angleUnit);
  const [f, setF] = useState('x^2-2x');
  const [g, setG] = useState('');
  const [start, setStart] = useState('-3');
  const [end, setEnd] = useState('3');
  const [step, setStep] = useState('0.5');
  const [copied, copy] = useCopy();

  const table = useMemo(() => {
    const ctx = createEvalContext({ ans, variables, angleUnit });
    try {
      const s = evaluateExpression(start, ctx);
      const e = evaluateExpression(end, ctx);
      const h = Math.abs(evaluateExpression(step, ctx));
      if (![s, e, h].every(Number.isFinite) || h === 0) return { error: true as const };
      const count = Math.floor(Math.abs(e - s) / h + 1e-9) + 1;
      if (count > 500) return { error: true as const, tooMany: true };
      const fn = f.trim() ? compileFunction(f, ctx) : null;
      const gn = g.trim() ? compileFunction(g, ctx) : null;
      const dir = e >= s ? 1 : -1;
      const rows = Array.from({ length: count }, (_, i) => {
        const x = Number((s + dir * i * h).toPrecision(12));
        return { x, f: fn ? fn(x) : NaN, g: gn ? gn(x) : NaN };
      });
      return { rows, hasG: Boolean(gn) };
    } catch {
      return { error: true as const };
    }
  }, [f, g, start, end, step, ans, variables, angleUnit]);

  const csv = 'rows' in table && table.rows
    ? ['x\tf(x)' + (table.hasG ? '\tg(x)' : ''), ...table.rows.map((r) => [r.x, r.f, ...(table.hasG ? [r.g] : [])].join('\t'))].join('\n')
    : '';

  return (
    <div className="toolBody">
      <div className="unitGrid unitGrid2">
        <label className="toolField">
          <span>f(x) =</span>
          <input className="toolInput solveInput" value={f} spellCheck={false} onChange={(e) => setF(e.target.value)} />
        </label>
        <label className="toolField">
          <span>g(x) = <em className="toolMuted">({tr('tuỳ chọn', 'optional')})</em></span>
          <input className="toolInput solveInput" value={g} spellCheck={false} onChange={(e) => setG(e.target.value)} />
        </label>
      </div>
      <div className="unitGrid unitGrid3">
        <label className="toolField"><span>{tr('Bắt đầu', 'Start')}</span><input className="toolInput" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label className="toolField"><span>{tr('Kết thúc', 'End')}</span><input className="toolInput" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
        <label className="toolField"><span>{tr('Bước', 'Step')}</span><input className="toolInput" value={step} onChange={(e) => setStep(e.target.value)} /></label>
      </div>
      {'error' in table ? (
        <p className="toolHint solveError">
          {'tooMany' in table ? tr('Quá 500 dòng — tăng bước nhảy.', 'More than 500 rows — increase the step.') : tr('Kiểm tra lại hàm số và khoảng.', 'Check the functions and range.')}
        </p>
      ) : (
        <>
          <div className="toolRow">
            <span className="toolMuted">{table.rows.length} {tr('dòng', 'rows')}</span>
            <span className="toolSpacer" />
            <button type="button" className="toolLink" onClick={() => copy('table', csv)}>
              {copied ? tr('Đã chép ✓', 'Copied ✓') : tr('Sao chép (dán vào Excel)', 'Copy (paste into Excel)')}
            </button>
          </div>
          <div className="valueTableWrap">
            <table className="valueTable">
              <thead>
                <tr><th>x</th><th>f(x)</th>{table.hasG && <th>g(x)</th>}</tr>
              </thead>
              <tbody>
                {table.rows.map((r) => (
                  <tr key={r.x}>
                    <td>{num(r.x)}</td>
                    <td>{num(r.f)}</td>
                    {table.hasG && <td>{num(r.g)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}