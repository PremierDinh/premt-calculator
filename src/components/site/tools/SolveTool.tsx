import { useMemo, useRef, useState } from 'react';
import { useCalculatorStore } from '../../../store/calculatorStore';
import type { Language } from '../../../core/settings';
import type { VariableName } from '../../../core/types';
import { createEvalContext, evaluateExpression, type EvalContext } from '../../../math/evaluator';
import { derivative } from '../../../math/calculus';
import { exactRealString } from '../../../core/exactForm';
import { toNaturalDisplay } from '../../../core/naturalDisplay';
import { NaturalLine } from '../../display/NaturalLine';
import { numberToExpression } from '../../../core/tools/constants';
import { compileFunction, findRoots, integrateAdaptive } from '../../../core/tools/solver';

type SolveMode = 'eval' | 'equation' | 'integral' | 'derivative';

const MODES: { id: SolveMode; vi: string; en: string }[] = [
  { id: 'eval', vi: 'Tính', en: 'Evaluate' },
  { id: 'equation', vi: 'Phương trình', en: 'Equation' },
  { id: 'integral', vi: 'Tích phân', en: 'Integral' },
  { id: 'derivative', vi: 'Đạo hàm', en: 'Derivative' },
];

const EXAMPLES: Record<SolveMode, string> = {
  eval: 'sqrt(2)+3/4×sin(30)',
  equation: 'x^3-6x^2+11x=6',
  integral: 'x^2×e^(-x)',
  derivative: 'x^3×ln(x)',
};

const SYMBOLS: { label: string; text: string }[] = [
  { label: 'x', text: 'x' },
  { label: '=', text: '=' },
  { label: 'xⁿ', text: '^(' },
  { label: '√', text: 'sqrt(' },
  { label: 'π', text: 'pi' },
  { label: 'e', text: 'e' },
  { label: '(', text: '(' },
  { label: ')', text: ')' },
  { label: '×', text: '×' },
  { label: '÷', text: '÷' },
  { label: 'sin', text: 'sin(' },
  { label: 'cos', text: 'cos(' },
  { label: 'tan', text: 'tan(' },
  { label: 'ln', text: 'ln(' },
  { label: 'log', text: 'log(' },
  { label: '|x|', text: 'abs(' },
];

const STORE_TARGETS: VariableName[] = ['A', 'B', 'C', 'D', 'E', 'F'];

type Tr = (vi: string, en: string) => string;

interface Outcome {
  values: { label: string; value: number }[];
  note?: string;
  error?: string;
}

function display(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const exact = exactRealString(v);
  const abs = Math.abs(v);
  const approx = abs !== 0 && (abs >= 1e10 || abs < 1e-4) ? v.toExponential(9).replace(/\.?0+e/, 'e') : String(Number(v.toPrecision(12)));
  return exact && exact !== approx ? `${exact} ≈ ${approx}` : approx;
}

function evalBound(text: string, ctx: EvalContext): number {
  if (!text.trim()) throw new Error('bound');
  const v = evaluateExpression(text, ctx);
  if (!Number.isFinite(v)) throw new Error('bound');
  return v;
}

function solve(mode: SolveMode, expr: string, a: string, b: string, ctx: EvalContext, tr: Tr): Outcome {
  if (!expr.trim()) return { values: [] };
  try {
    if (mode === 'eval') {
      const v = evaluateExpression(expr, ctx);
      return Number.isFinite(v) ? { values: [{ label: '=', value: v }] } : { values: [], error: tr('Lỗi toán học', 'Math error') };
    }
    const fn = compileFunction(expr, ctx);
    if (mode === 'equation') {
      const lo = evalBound(a, ctx);
      const hi = evalBound(b, ctx);
      const roots = findRoots(fn, lo, hi);
      if (!roots.length) return { values: [], note: tr('Không tìm thấy nghiệm thực trong khoảng này. Thử mở rộng khoảng.', 'No real roots in this range. Try a wider range.') };
      return {
        values: roots.map((r, i) => ({ label: roots.length > 1 ? `x${'₁₂₃₄₅₆₇₈₉'[i] ?? i + 1}` : 'x', value: r })),
        note: tr(`${roots.length} nghiệm trong [${a}; ${b}]`, `${roots.length} root(s) in [${a}, ${b}]`),
      };
    }
    if (expr.includes('=')) return { values: [], error: tr('Nhập biểu thức f(x), không dùng dấu =', 'Enter f(x) without "="') };
    if (mode === 'integral') {
      const v = integrateAdaptive(fn, evalBound(a, ctx), evalBound(b, ctx));
      return Number.isFinite(v) ? { values: [{ label: '∫', value: v }] } : { values: [], error: tr('Tích phân không hội tụ', 'Integral diverges') };
    }
    const x0 = evalBound(a, ctx);
    const d1 = derivative(fn, x0);
    const d2 = (derivative(fn, x0 + 1e-4) - derivative(fn, x0 - 1e-4)) / 2e-4;
    const values = [
      { label: 'f(x₀)', value: fn(x0) },
      { label: "f′(x₀)", value: Math.abs(d1) < 1e-9 ? 0 : Number(d1.toPrecision(10)) },
      { label: "f″(x₀)", value: Math.abs(d2) < 1e-6 ? 0 : Number(d2.toPrecision(7)) },
    ];
    return { values };
  } catch {
    return { values: [], error: tr('Biểu thức chưa đúng cú pháp', 'Syntax error') };
  }
}

export function SolveTool({ language, onDone }: { language: Language; onDone: (fn: () => void) => void }) {
  const tr: Tr = (vi, en) => (language === 'vi' ? vi : en);
  const variables = useCalculatorStore((s) => s.variables);
  const ans = useCalculatorStore((s) => s.ans);
  const angleUnit = useCalculatorStore((s) => s.settings.angleUnit);
  const insertText = useCalculatorStore((s) => s.insertText);
  const setVariable = useCalculatorStore((s) => s.setVariable);

  const [mode, setMode] = useState<SolveMode>('equation');
  const [exprs, setExprs] = useState<Record<SolveMode, string>>(EXAMPLES);
  const [rangeA, setRangeA] = useState('-10');
  const [rangeB, setRangeB] = useState('10');
  const [bounds, setBounds] = useState({ a: '0', b: '1' });
  const [point, setPoint] = useState('1');
  const [storeTarget, setStoreTarget] = useState<VariableName>('A');
  const [stored, setStored] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const expr = exprs[mode];
  const setExpr = (text: string) => setExprs((prev) => ({ ...prev, [mode]: text }));

  const ctx = useMemo(() => createEvalContext({ ans, variables, angleUnit }), [ans, variables, angleUnit]);

  const [a, b] = mode === 'equation' ? [rangeA, rangeB] : mode === 'integral' ? [bounds.a, bounds.b] : [point, ''];
  const outcome = useMemo(
    () => solve(mode, expr, a, b, ctx, (vi, en) => (language === 'vi' ? vi : en)),
    [mode, expr, a, b, ctx, language],
  );

  const insertSymbol = (text: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? expr.length;
    const end = el?.selectionEnd ?? expr.length;
    setExpr(expr.slice(0, start) + text + expr.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const storeValue = (value: number) => {
    setVariable(storeTarget, value);
    setStored(`${storeTarget} = ${display(value)}`);
  };

  const unitLabel = angleUnit === 'deg' ? 'DEG' : angleUnit === 'rad' ? 'RAD' : 'GRA';

  return (
    <div className="toolBody">
      <div className="solveModes" role="radiogroup">
        {MODES.map((m) => (
          <button
            type="button"
            role="radio"
            key={m.id}
            aria-checked={mode === m.id}
            className={`solveMode ${mode === m.id ? 'solveModeActive' : ''}`}
            onClick={() => {
              setMode(m.id);
              setStored(null);
            }}
          >
            {language === 'vi' ? m.vi : m.en}
          </button>
        ))}
      </div>

      <label className="toolField">
        <span>
          {mode === 'eval' && tr('Biểu thức', 'Expression')}
          {mode === 'equation' && tr('Phương trình theo x (vd: x^2=2 hoặc sin(x)-x/2)', 'Equation in x (e.g. x^2=2 or sin(x)-x/2)')}
          {mode === 'integral' && tr('Hàm f(x) cần tích phân', 'Integrand f(x)')}
          {mode === 'derivative' && tr('Hàm f(x)', 'Function f(x)')}
          <em className="toolBadge">{unitLabel}</em>
        </span>
        <textarea
          ref={inputRef}
          className="toolInput toolTextarea solveInput"
          rows={2}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          value={expr}
          onChange={(e) => {
            setExpr(e.target.value);
            setStored(null);
          }}
        />
      </label>

      <div className="solveSymbols">
        {SYMBOLS.map((s) => (
          <button type="button" key={s.label} className="solveSymbol" onMouseDown={(e) => e.preventDefault()} onClick={() => insertSymbol(s.text)}>
            {s.label}
          </button>
        ))}
      </div>

      {expr.trim() && (
        <div className="solvePreview">
          <NaturalLine text={toNaturalDisplay(expr)} />
        </div>
      )}

      {mode === 'equation' && (
        <div className="unitGrid unitGrid2">
          <label className="toolField">
            <span>{tr('Tìm từ x =', 'Search from x =')}</span>
            <input className="toolInput" value={rangeA} onChange={(e) => setRangeA(e.target.value)} />
          </label>
          <label className="toolField">
            <span>{tr('đến x =', 'to x =')}</span>
            <input className="toolInput" value={rangeB} onChange={(e) => setRangeB(e.target.value)} />
          </label>
        </div>
      )}
      {mode === 'integral' && (
        <div className="unitGrid unitGrid2">
          <label className="toolField">
            <span>{tr('Cận dưới a', 'Lower bound a')}</span>
            <input className="toolInput" value={bounds.a} onChange={(e) => setBounds({ ...bounds, a: e.target.value })} />
          </label>
          <label className="toolField">
            <span>{tr('Cận trên b', 'Upper bound b')}</span>
            <input className="toolInput" value={bounds.b} onChange={(e) => setBounds({ ...bounds, b: e.target.value })} />
          </label>
        </div>
      )}
      {mode === 'derivative' && (
        <label className="toolField">
          <span>{tr('Tại điểm x₀ =', 'At x₀ =')}</span>
          <input className="toolInput" value={point} onChange={(e) => setPoint(e.target.value)} />
        </label>
      )}

      {outcome.error && <p className="toolHint solveError">{outcome.error}</p>}
      {outcome.note && <p className="toolHint">{outcome.note}</p>}
      {outcome.values.map((item) => (
        <div className="toolResult" key={item.label}>
          <span className="toolMuted solveLabel">{item.label}</span>
          <span className="toolResultValue">{display(item.value)}</span>
          <span className="toolSpacer" />
          <button type="button" className="toolChip" onClick={() => storeValue(item.value)} title={tr(`Lưu vào ${storeTarget}`, `Store to ${storeTarget}`)}>
            →{storeTarget}
          </button>
          <button type="button" className="toolChip" onClick={() => onDone(() => insertText(numberToExpression(item.value)))}>
            {tr('Chèn', 'Insert')}
          </button>
        </div>
      ))}

      {outcome.values.length > 0 && (
        <div className="toolRow">
          <span className="toolMuted">{tr('Lưu kết quả vào biến', 'Store results to')}</span>
          <select className="toolInput solveStoreSelect" value={storeTarget} onChange={(e) => setStoreTarget(e.target.value as VariableName)}>
            {STORE_TARGETS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          {stored && <span className="toolBadge">✓ {stored}</span>}
        </div>
      )}
    </div>
  );
}
