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
import {
  analyzeFunction,
  compileFunction,
  findRoots,
  integrateAdaptive,
  parseInequality,
  solveInequality,
  solveLinearSystem,
  type Interval,
} from '../../../core/tools/solver';

type SolveMode = 'eval' | 'equation' | 'system' | 'inequality' | 'analyze' | 'integral' | 'derivative';
type Angle = 'deg' | 'rad';

const MODES: { id: SolveMode; vi: string; en: string }[] = [
  { id: 'eval', vi: 'Tính', en: 'Evaluate' },
  { id: 'equation', vi: 'Phương trình', en: 'Equation' },
  { id: 'system', vi: 'Hệ PT', en: 'System' },
  { id: 'inequality', vi: 'Bất PT', en: 'Inequality' },
  { id: 'analyze', vi: 'Khảo sát', en: 'Analyze' },
  { id: 'integral', vi: 'Tích phân', en: 'Integral' },
  { id: 'derivative', vi: 'Đạo hàm', en: 'Derivative' },
];

interface Problem {
  topic: { vi: string; en: string };
  vi: string;
  en: string;
  mode: SolveMode;
  expr: string;
  a?: string;
  b?: string;
  angle?: Angle;
}

const T = {
  algebra: { vi: 'Đại số', en: 'Algebra' },
  calculus: { vi: 'Giải tích', en: 'Calculus' },
  trig: { vi: 'Lượng giác', en: 'Trigonometry' },
  geometry: { vi: 'Hình học', en: 'Geometry' },
  numbers: { vi: 'Số học', en: 'Numbers' },
};

const PROBLEMS: Problem[] = [
  { topic: T.algebra, vi: 'Giải x/3 + 4 = 10', en: 'Solve x/3 + 4 = 10', mode: 'equation', expr: 'x/3+4=10', a: '-100', b: '100' },
  { topic: T.algebra, vi: 'Giải x³ − 6x² + 11x = 6', en: 'Solve x³ − 6x² + 11x = 6', mode: 'equation', expr: 'x^3-6x^2+11x=6', a: '-10', b: '10' },
  { topic: T.algebra, vi: 'Giải eˣ = 3x', en: 'Solve eˣ = 3x', mode: 'equation', expr: 'e^x=3x', a: '-10', b: '10' },
  { topic: T.algebra, vi: 'Hệ 2x + y = 5; x − y = 1', en: 'System 2x + y = 5; x − y = 1', mode: 'system', expr: '2x+y=5\nx-y=1' },
  { topic: T.algebra, vi: 'Hệ 3 ẩn x, y, z', en: '3 unknowns x, y, z', mode: 'system', expr: 'x+y+z=6\n2x-y+z=3\nx+2y-z=2' },
  { topic: T.algebra, vi: 'Bất PT x² − 5x + 6 < 0', en: 'Inequality x² − 5x + 6 < 0', mode: 'inequality', expr: 'x^2-5x+6<0', a: '-10', b: '10' },
  { topic: T.algebra, vi: 'Bất PT (x − 3)/(x + 1) ≥ 0', en: 'Inequality (x − 3)/(x + 1) ≥ 0', mode: 'inequality', expr: '(x-3)/(x+1)>=0', a: '-100', b: '100' },
  { topic: T.algebra, vi: 'Tính log₃27 + log₃9', en: 'Evaluate log₃27 + log₃9', mode: 'eval', expr: 'log(3,27)+log(3,9)' },
  { topic: T.trig, vi: 'Tính tan45° + sin90°', en: 'Evaluate tan45° + sin90°', mode: 'eval', expr: 'tan(45)+sin(90)', angle: 'deg' },
  { topic: T.trig, vi: 'Giải 2sin(x) = 1 trên [0; 2π]', en: 'Solve 2sin(x) = 1 on [0, 2π]', mode: 'equation', expr: '2sin(x)=1', a: '0', b: '2pi', angle: 'rad' },
  { topic: T.calculus, vi: 'Tiếp tuyến của y = x² tại x = 1', en: 'Tangent to y = x² at x = 1', mode: 'derivative', expr: 'x^2', a: '1', angle: 'rad' },
  { topic: T.calculus, vi: 'Khảo sát y = x³ − 3x', en: 'Analyze y = x³ − 3x', mode: 'analyze', expr: 'x^3-3x', a: '-3', b: '3', angle: 'rad' },
  { topic: T.calculus, vi: '∫₀^π sin(x) dx', en: '∫₀^π sin(x) dx', mode: 'integral', expr: 'sin(x)', a: '0', b: 'pi', angle: 'rad' },
  { topic: T.calculus, vi: '∫₀¹ x²·e⁻ˣ dx', en: '∫₀¹ x²·e⁻ˣ dx', mode: 'integral', expr: 'x^2×e^(-x)', a: '0', b: '1', angle: 'rad' },
  { topic: T.geometry, vi: 'Cạnh huyền tam giác vuông 3 và 4', en: 'Hypotenuse of legs 3 and 4', mode: 'eval', expr: 'sqrt(3^2+4^2)' },
  { topic: T.geometry, vi: 'Diện tích hình tròn bán kính 5', en: 'Area of a circle of radius 5', mode: 'eval', expr: 'pi×5^2' },
  { topic: T.numbers, vi: 'ƯCLN của 24 và 36', en: 'GCD of 24 and 36', mode: 'eval', expr: 'gcd(24,36)' },
];

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

const EXTRA_SYMBOLS: Partial<Record<SolveMode, { label: string; text: string }[]>> = {
  system: [{ label: 'y', text: 'y' }, { label: 'z', text: 'z' }, { label: '↵', text: '\n' }],
  inequality: [{ label: '<', text: '<' }, { label: '>', text: '>' }, { label: '≤', text: '<=' }, { label: '≥', text: '>=' }],
};

const STORE_TARGETS: VariableName[] = ['A', 'B', 'C', 'D', 'E', 'F'];
const SUBSCRIPTS = '₁₂₃₄₅₆₇₈₉';

type Tr = (vi: string, en: string) => string;

interface Outcome {
  values: { label: string; value: number }[];
  lines?: string[];
  note?: string;
  error?: string;
  plot?: string[];
}

function approx(v: number): string {
  const abs = Math.abs(v);
  return abs !== 0 && (abs >= 1e10 || abs < 1e-4) ? v.toExponential(9).replace(/\.?0+e/, 'e') : String(Number(v.toPrecision(12)));
}

function display(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const exact = exactRealString(v);
  const plain = approx(v);
  return exact && exact !== plain ? `${exact} ≈ ${plain}` : plain;
}

function short(v: number): string {
  return String(Number(v.toPrecision(6))).replace('-', '−');
}

function evalBound(text: string, ctx: EvalContext): number {
  if (!text.trim()) throw new Error('bound');
  const v = evaluateExpression(text, ctx);
  if (!Number.isFinite(v)) throw new Error('bound');
  return v;
}

function sides(expr: string): string[] {
  return expr.includes('=') ? expr.split('=').map((s) => s.trim()).filter(Boolean) : [expr];
}

function linearText(slope: number, intercept: number): string {
  const m = short(slope);
  const c = Math.abs(intercept) < 1e-12 ? '' : `${intercept < 0 ? ' − ' : ' + '}${short(Math.abs(intercept))}`;
  if (Math.abs(slope) < 1e-12) return `y = ${short(intercept)}`;
  return `y = ${m === '1' ? '' : m === '−1' ? '−' : m}x${c}`;
}

interface SharedProblem {
  mode: SolveMode;
  expr: string;
  a: string;
  b: string;
  angle: Angle;
}

const SHARE_PREFIX = '#solve=';

function readSharedProblem(): SharedProblem | null {
  if (typeof location === 'undefined' || !location.hash.startsWith(SHARE_PREFIX)) return null;
  try {
    const data = JSON.parse(decodeURIComponent(location.hash.slice(SHARE_PREFIX.length))) as Partial<SharedProblem>;
    if (!MODES.some((m) => m.id === data.mode) || typeof data.expr !== 'string') return null;
    return {
      mode: data.mode as SolveMode,
      expr: data.expr.slice(0, 500),
      a: typeof data.a === 'string' ? data.a.slice(0, 50) : '',
      b: typeof data.b === 'string' ? data.b.slice(0, 50) : '',
      angle: data.angle === 'rad' ? 'rad' : 'deg',
    };
  } catch {
    return null;
  }
}

function endpoint(v: number): string {
  return (exactRealString(v) ?? short(v)).replace('-', '−');
}

function formatIntervals(intervals: Interval[], lo: number, hi: number): string {
  return intervals
    .map((iv) => {
      if (iv.from === iv.to) return `{${endpoint(iv.from)}}`;
      const left = iv.from <= lo ? '(−∞' : `${iv.closedFrom ? '[' : '('}${endpoint(iv.from)}`;
      const right = iv.to >= hi ? '+∞)' : `${endpoint(iv.to)}${iv.closedTo ? ']' : ')'}`;
      return `${left}; ${right}`;
    })
    .join(' ∪ ');
}

function solve(mode: SolveMode, expr: string, a: string, b: string, ctx: EvalContext, tr: Tr): Outcome {
  if (!expr.trim()) return { values: [] };
  try {
    if (mode === 'system') {
      const lines = expr.split(/[\n;]/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2 || lines.length > 3) {
        return { values: [], error: tr('Nhập 2 hoặc 3 phương trình, mỗi dòng một phương trình (ẩn x, y, z).', 'Enter 2 or 3 equations, one per line (unknowns x, y, z).') };
      }
      const r = solveLinearSystem(lines, ctx);
      if (r.kind === 'nonlinear') return { values: [], error: tr('Chỉ hỗ trợ hệ bậc nhất. Hệ phi tuyến: dùng Phương trình sau khi thế.', 'Only linear systems are supported.') };
      if (r.kind !== 'unique') {
        return {
          values: [],
          lines: [r.kind === 'none' ? tr('Hệ vô nghiệm.', 'The system has no solution.') : tr('Hệ có vô số nghiệm.', 'The system has infinitely many solutions.')],
        };
      }
      const solution = r.values;
      return { values: r.vars.map((v, i) => ({ label: v, value: solution[i] })) };
    }
    if (mode === 'inequality') {
      const parsed = parseInequality(expr);
      if (!parsed) return { values: [], error: tr('Nhập dạng f(x) < g(x), dùng <, >, <=, >=.', 'Use the form f(x) < g(x) with <, >, <=, >=.') };
      const lo = evalBound(a, ctx);
      const hi = evalBound(b, ctx);
      const intervals = solveInequality(compileFunction(parsed.expr, ctx), parsed.op, lo, hi);
      return {
        values: [],
        lines: [intervals.length ? `x ∈ ${formatIntervals(intervals, Math.min(lo, hi), Math.max(lo, hi))}` : tr('Vô nghiệm trong khoảng xét.', 'No solution in this range.')],
        note: tr(`Xét trên [${a}; ${b}] — ±∞ nghĩa là kéo dài tới biên khoảng xét.`, `Checked on [${a}, ${b}] — ±∞ means the set reaches the edge of the range.`),
        plot: [parsed.expr],
      };
    }
    if (mode === 'eval') {
      const v = evaluateExpression(expr, ctx);
      return Number.isFinite(v) ? { values: [{ label: '=', value: v }] } : { values: [], error: tr('Lỗi toán học', 'Math error') };
    }
    const fn = compileFunction(expr, ctx);
    if (mode === 'equation') {
      const roots = findRoots(fn, evalBound(a, ctx), evalBound(b, ctx));
      if (!roots.length) {
        return { values: [], note: tr('Không tìm thấy nghiệm thực trong khoảng này. Thử mở rộng khoảng.', 'No real roots in this range. Try a wider range.'), plot: sides(expr) };
      }
      return {
        values: roots.map((r, i) => ({ label: roots.length > 1 ? `x${SUBSCRIPTS[i] ?? i + 1}` : 'x', value: r })),
        note: tr(`${roots.length} nghiệm trong [${a}; ${b}]`, `${roots.length} root(s) in [${a}, ${b}]`),
        plot: sides(expr),
      };
    }
    if (expr.includes('=')) return { values: [], error: tr('Nhập biểu thức f(x), không dùng dấu =', 'Enter f(x) without "="') };
    if (mode === 'analyze') {
      const lo = evalBound(a, ctx);
      const hi = evalBound(b, ctx);
      const { roots, critical } = analyzeFunction(fn, lo, hi);
      const values: Outcome['values'] = [];
      const y0 = fn(0);
      if (lo <= 0 && hi >= 0 && Number.isFinite(y0)) values.push({ label: 'f(0)', value: y0 });
      roots.forEach((r, i) => values.push({ label: `${tr('nghiệm', 'root')} ${SUBSCRIPTS[i] ?? i + 1}`, value: r }));
      const lines = critical.map((c) => {
        const kind = c.kind === 'max' ? tr('Cực đại', 'Local max') : c.kind === 'min' ? tr('Cực tiểu', 'Local min') : tr('Điểm uốn', 'Inflection');
        return `${kind}: (${short(c.x)}; ${short(c.y)})`;
      });
      if (!lines.length) lines.push(tr('Không có cực trị hay điểm uốn trong khoảng này.', 'No extrema or inflection points in this range.'));
      return { values, lines, plot: [expr] };
    }
    if (mode === 'integral') {
      const v = integrateAdaptive(fn, evalBound(a, ctx), evalBound(b, ctx));
      return Number.isFinite(v)
        ? { values: [{ label: '∫', value: v }], plot: [expr] }
        : { values: [], error: tr('Tích phân không hội tụ', 'Integral diverges') };
    }
    const x0 = evalBound(a, ctx);
    const y0 = fn(x0);
    const d1raw = derivative(fn, x0);
    const d1 = Math.abs(d1raw) < 1e-9 ? 0 : Number(d1raw.toPrecision(10));
    const d2raw = (derivative(fn, x0 + 1e-4) - derivative(fn, x0 - 1e-4)) / 2e-4;
    const d2 = Math.abs(d2raw) < 1e-6 ? 0 : Number(d2raw.toPrecision(7));
    if (!Number.isFinite(y0)) return { values: [], error: tr('Hàm không xác định tại x₀', 'f is undefined at x₀') };
    const intercept = y0 - d1 * x0;
    const tangent = linearText(d1, intercept);
    const slopeExpr = d1 === 0 ? '' : `${d1 < 0 ? '-' : ''}${Math.abs(d1)}x`;
    const interceptExpr = intercept === 0 ? '' : `${intercept < 0 ? '-' : '+'}${Math.abs(Number(intercept.toPrecision(10)))}`;
    return {
      values: [
        { label: 'f(x₀)', value: y0 },
        { label: 'f′(x₀)', value: d1 },
        { label: 'f″(x₀)', value: d2 },
      ],
      lines: [`${tr('Tiếp tuyến', 'Tangent')}: ${tangent}`],
      plot: [expr, (slopeExpr + interceptExpr).replace(/^\+/, '') || '0'],
    };
  } catch {
    return { values: [], error: tr('Biểu thức chưa đúng cú pháp', 'Syntax error') };
  }
}

export function SolveTool({
  language,
  onDone,
  onPlot,
}: {
  language: Language;
  onDone: (fn: () => void) => void;
  onPlot: (exprs: string[]) => void;
}) {
  const tr: Tr = (vi, en) => (language === 'vi' ? vi : en);
  const variables = useCalculatorStore((s) => s.variables);
  const ans = useCalculatorStore((s) => s.ans);
  const settingsAngle = useCalculatorStore((s) => s.settings.angleUnit);
  const insertText = useCalculatorStore((s) => s.insertText);
  const setVariable = useCalculatorStore((s) => s.setVariable);

  const [shared] = useState(readSharedProblem);
  const [mode, setMode] = useState<SolveMode>(shared?.mode ?? 'equation');
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const [exprs, setExprs] = useState<Record<SolveMode, string>>(() => ({
    eval: 'sqrt(2)+3/4×sin(30)',
    equation: 'x^3-6x^2+11x=6',
    system: '2x+y=5\nx-y=1',
    inequality: 'x^2-5x+6<0',
    analyze: 'x^3-3x',
    integral: 'x^2×e^(-x)',
    derivative: 'x^3×ln(x)',
    ...(shared ? { [shared.mode]: shared.expr } : {}),
  }));
  const [ranges, setRanges] = useState<Record<SolveMode, { a: string; b: string }>>(() => ({
    eval: { a: '', b: '' },
    equation: { a: '-10', b: '10' },
    system: { a: '', b: '' },
    inequality: { a: '-100', b: '100' },
    analyze: { a: '-3', b: '3' },
    integral: { a: '0', b: '1' },
    derivative: { a: '1', b: '' },
    ...(shared && (shared.a || shared.b) ? { [shared.mode]: { a: shared.a, b: shared.b } } : {}),
  }));
  const [angle, setAngle] = useState<Angle>(shared?.angle ?? (settingsAngle === 'rad' ? 'rad' : 'deg'));
  const [storeTarget, setStoreTarget] = useState<VariableName>('A');
  const [stored, setStored] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const expr = exprs[mode];
  const { a, b } = ranges[mode];
  const setExpr = (text: string) => setExprs((prev) => ({ ...prev, [mode]: text }));
  const setRange = (key: 'a' | 'b', value: string) => setRanges((prev) => ({ ...prev, [mode]: { ...prev[mode], [key]: value } }));

  const ctx = useMemo(() => createEvalContext({ ans, variables, angleUnit: angle }), [ans, variables, angle]);
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

  const loadProblem = (p: Problem) => {
    setMode(p.mode);
    setExprs((prev) => ({ ...prev, [p.mode]: p.expr }));
    if (p.a !== undefined) setRanges((prev) => ({ ...prev, [p.mode]: { a: p.a ?? '', b: p.b ?? '' } }));
    if (p.angle) setAngle(p.angle);
    setStored(null);
    setShowLibrary(false);
  };

  const share = () => {
    const payload: SharedProblem = { mode, expr, a, b, angle };
    const url = `${location.origin}${location.pathname}${SHARE_PREFIX}${encodeURIComponent(JSON.stringify(payload))}`;
    history.replaceState(null, '', url);
    void navigator.clipboard?.writeText(url).then(() => {
      setShareState('copied');
      window.setTimeout(() => setShareState('idle'), 1800);
    });
  };

  const storeValue = (value: number) => {
    setVariable(storeTarget, value);
    setStored(`${storeTarget} = ${display(value)}`);
  };

  const rangeLabels: Partial<Record<SolveMode, [string, string]>> = {
    equation: [tr('Tìm từ x =', 'Search from x ='), tr('đến x =', 'to x =')],
    inequality: [tr('Xét từ x =', 'From x ='), tr('đến x =', 'to x =')],
    analyze: [tr('Xét từ x =', 'From x ='), tr('đến x =', 'to x =')],
    integral: [tr('Cận dưới a', 'Lower bound a'), tr('Cận trên b', 'Upper bound b')],
  };
  const fieldLabel: Record<SolveMode, string> = {
    eval: tr('Biểu thức', 'Expression'),
    equation: tr('Phương trình theo x (vd: x^2=2 hoặc sin(x)-x/2)', 'Equation in x (e.g. x^2=2 or sin(x)-x/2)'),
    system: tr('Hệ phương trình bậc nhất — mỗi dòng một phương trình, ẩn x, y, z', 'Linear system — one equation per line, unknowns x, y, z'),
    inequality: tr('Bất phương trình theo x (vd: x^2-5x+6<0, dùng <= cho ≤)', 'Inequality in x (e.g. x^2-5x+6<0, use <= for ≤)'),
    analyze: tr('Hàm số y = f(x)', 'Function y = f(x)'),
    integral: tr('Hàm f(x) cần tích phân', 'Integrand f(x)'),
    derivative: tr('Hàm f(x)', 'Function f(x)'),
  };

  return (
    <div className="toolBody">
      <div className="solveTop">
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
      </div>

      <div className="toolRow">
        <button type="button" className={`toolChip ${showLibrary ? 'toolChipPrimary' : ''}`} onClick={() => setShowLibrary(!showLibrary)}>
          📚 {tr('Bài toán mẫu', 'Sample problems')}
        </button>
        <span className="toolSpacer" />
        <button type="button" className="toolLink" onClick={share} disabled={!expr.trim()} title={tr('Sao chép liên kết tới bài toán này', 'Copy a link to this problem')}>
          {shareState === 'copied' ? tr('Đã chép liên kết ✓', 'Link copied ✓') : tr('Chia sẻ', 'Share')}
        </button>
        <button
          type="button"
          className="toolBadge solveAngle"
          title={tr('Đổi đơn vị góc', 'Toggle angle unit')}
          onClick={() => setAngle(angle === 'deg' ? 'rad' : 'deg')}
        >
          {angle === 'deg' ? 'DEG' : 'RAD'}
        </button>
      </div>

      {showLibrary && (
        <ul className="solveLibrary">
          {PROBLEMS.map((p) => (
            <li key={p.en}>
              <button type="button" className="solveProblem" onClick={() => loadProblem(p)}>
                <span className="solveTopic">{language === 'vi' ? p.topic.vi : p.topic.en}</span>
                <span>{language === 'vi' ? p.vi : p.en}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="toolField">
        <span>{fieldLabel[mode]}</span>
        <textarea
          ref={inputRef}
          className="toolInput toolTextarea solveInput"
          rows={mode === 'system' ? 3 : 2}
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
        {[...(EXTRA_SYMBOLS[mode] ?? []), ...SYMBOLS].map((s) => (
          <button type="button" key={s.label} className="solveSymbol" onMouseDown={(e) => e.preventDefault()} onClick={() => insertSymbol(s.text)}>
            {s.label}
          </button>
        ))}
      </div>

      {expr.trim() && (
        <div className="solvePreview">
          {expr.split(/[\n;]/).filter((line) => line.trim()).map((line, i) => (
            <div key={i}>
              <NaturalLine text={toNaturalDisplay(line.replace(/<=/g, '≤').replace(/>=/g, '≥'))} />
            </div>
          ))}
        </div>
      )}

      {rangeLabels[mode] && (
        <div className="unitGrid unitGrid2">
          <label className="toolField">
            <span>{rangeLabels[mode]![0]}</span>
            <input className="toolInput" value={a} onChange={(e) => setRange('a', e.target.value)} />
          </label>
          <label className="toolField">
            <span>{rangeLabels[mode]![1]}</span>
            <input className="toolInput" value={b} onChange={(e) => setRange('b', e.target.value)} />
          </label>
        </div>
      )}
      {mode === 'derivative' && (
        <label className="toolField">
          <span>{tr('Tại điểm x₀ =', 'At x₀ =')}</span>
          <input className="toolInput" value={a} onChange={(e) => setRange('a', e.target.value)} />
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
      {outcome.lines?.map((line) => (
        <div className="toolResult" key={line}>
          <span className="toolResultValue solveLine">{line}</span>
        </div>
      ))}

      {(outcome.values.length > 0 || outcome.plot) && (
        <div className="toolRow">
          {outcome.values.length > 0 && (
            <>
              <span className="toolMuted">{tr('Lưu vào', 'Store to')}</span>
              <select className="toolInput solveStoreSelect" value={storeTarget} onChange={(e) => setStoreTarget(e.target.value as VariableName)}>
                {STORE_TARGETS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </>
          )}
          {stored && <span className="toolBadge">✓ {stored}</span>}
          <span className="toolSpacer" />
          {outcome.plot && (
            <button type="button" className="toolChip toolChipPrimary" onClick={() => onPlot(outcome.plot!)}>
              ∿ {tr('Vẽ đồ thị', 'Plot')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
