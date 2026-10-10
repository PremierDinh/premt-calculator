import { useEffect, useMemo, useRef, useState } from 'react';
import { parse } from '../../../math/parser';
import { evalNode, type EvalContext } from '../../../math/evaluator';
import { toReal, type AstNode } from '../../../math/ast';
import { useCalculatorStore } from '../../../store/calculatorStore';
import type { Language } from '../../../core/settings';

interface GraphFn {
  id: number;
  expr: string;
  on: boolean;
}

interface View {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2'];
const DEFAULT_VIEW: View = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
const MAX_FUNCS = 6;

function compile(expr: string): AstNode | null {
  if (!expr.trim()) return null;
  try {
    return parse(expr);
  } catch {
    return null;
  }
}

function sample(node: AstNode, x: number, ctx: EvalContext): number {
  try {
    return toReal(evalNode(node, { ...ctx, variables: { ...ctx.variables, x } }));
  } catch {
    return NaN;
  }
}

function projector(view: View, size: { w: number; h: number }) {
  return {
    toPx: (x: number, y: number) => ({
      px: ((x - view.xMin) / (view.xMax - view.xMin)) * size.w,
      py: ((view.yMax - y) / (view.yMax - view.yMin)) * size.h,
    }),
    toX: (px: number) => view.xMin + (px / size.w) * (view.xMax - view.xMin),
  };
}

function niceStep(range: number, target: number): number {
  const raw = range / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const m = raw / pow;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * pow;
}

function piLabel(k: number): string {
  if (k === 0) return '0';
  const sign = k < 0 ? '−' : '';
  const n = Math.abs(k);
  if (n % 2 === 0) return `${sign}${n / 2 === 1 ? '' : n / 2}π`;
  return `${sign}${n === 1 ? '' : n}π/2`;
}

function formatTick(v: number, step: number): string {
  const digits = Math.max(0, -Math.floor(Math.log10(step)));
  return Number(v.toFixed(digits)).toString().replace('-', '−');
}

export function GraphTool({ language }: { language: Language }) {
  const tr = (vi: string, en: string) => (language === 'vi' ? vi : en);
  const variables = useCalculatorStore((s) => s.variables);
  const ans = useCalculatorStore((s) => s.ans);
  const insertText = useCalculatorStore((s) => s.insertText);

  const [fns, setFns] = useState<GraphFn[]>([
    { id: 1, expr: 'x^2-4', on: true },
    { id: 2, expr: '2sin(x)', on: true },
  ]);
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const [angle, setAngle] = useState<'rad' | 'deg'>('rad');
  const [piAxis, setPiAxis] = useState(false);
  const [trace, setTrace] = useState<{ px: number; x: number } | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 320, h: 260 });
  const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null);
  const pinch = useRef<Map<number, { x: number; y: number }>>(new Map());

  const ctx = useMemo<EvalContext>(() => ({
    ans,
    preAns: 0,
    variables,
    matrices: {},
    vectors: {},
    angleUnit: angle,
  }), [ans, variables, angle]);

  const compiled = useMemo(() => fns.map((f) => ({ ...f, node: compile(f.expr) })), [fns]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.max(200, Math.floor(entry.contentRect.width));
      setSize({ w, h: Math.round(Math.min(w * 0.8, 360)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { toPx, toX } = useMemo(() => projector(view, size), [view, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    const g = canvas.getContext('2d');
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, size.w, size.h);
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, size.w, size.h);
    g.font = '10px system-ui, sans-serif';

    const { w, h } = size;
    const xRange = view.xMax - view.xMin;
    const yRange = view.yMax - view.yMin;
    const yStep = niceStep(yRange, 8);
    const usePi = piAxis && xRange / (Math.PI / 2) <= 40;
    const xStep = usePi ? (Math.PI / 2) * Math.max(1, Math.round(niceStep(xRange, 8) / (Math.PI / 2))) : niceStep(xRange, 8);

    const origin = toPx(0, 0);
    const axisY = Math.min(Math.max(origin.py, 0), h);
    const axisX = Math.min(Math.max(origin.px, 0), w);

    g.lineWidth = 1;
    g.strokeStyle = '#eef0f3';
    g.fillStyle = '#6b7280';
    for (let i = Math.ceil(view.xMin / xStep); i * xStep <= view.xMax; i++) {
      const { px } = toPx(i * xStep, 0);
      g.beginPath();
      g.moveTo(px, 0);
      g.lineTo(px, h);
      g.stroke();
      if (i !== 0) {
        const label = usePi ? piLabel(Math.round((i * xStep) / (Math.PI / 2))) : formatTick(i * xStep, xStep);
        g.fillText(label, px + 2, Math.min(Math.max(axisY + 11, 11), h - 3));
      }
    }
    for (let i = Math.ceil(view.yMin / yStep); i * yStep <= view.yMax; i++) {
      const { py } = toPx(0, i * yStep);
      g.beginPath();
      g.moveTo(0, py);
      g.lineTo(w, py);
      g.stroke();
      if (i !== 0) g.fillText(formatTick(i * yStep, yStep), Math.min(Math.max(axisX + 3, 2), w - 30), py - 2);
    }

    g.strokeStyle = '#374151';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(0, axisY);
    g.lineTo(w, axisY);
    g.moveTo(axisX, 0);
    g.lineTo(axisX, h);
    g.stroke();

    compiled.forEach((f, idx) => {
      if (!f.on || !f.node) return;
      g.strokeStyle = COLORS[idx % COLORS.length];
      g.lineWidth = 2;
      g.beginPath();
      let pen = false;
      let lastPy = 0;
      for (let px = 0; px <= w; px += 1) {
        const y = sample(f.node, toX(px), ctx);
        if (!Number.isFinite(y)) {
          pen = false;
          continue;
        }
        const py = toPx(0, y).py;
        if (pen && Math.abs(py - lastPy) > h * 1.5) pen = false;
        const clamped = Math.max(-h, Math.min(2 * h, py));
        if (pen) g.lineTo(px, clamped);
        else g.moveTo(px, clamped);
        pen = true;
        lastPy = py;
      }
      g.stroke();
    });

    if (trace) {
      g.strokeStyle = 'rgba(17, 24, 39, 0.35)';
      g.lineWidth = 1;
      g.setLineDash([4, 4]);
      g.beginPath();
      g.moveTo(trace.px, 0);
      g.lineTo(trace.px, h);
      g.stroke();
      g.setLineDash([]);
      compiled.forEach((f, idx) => {
        if (!f.on || !f.node) return;
        const y = sample(f.node, trace.x, ctx);
        if (!Number.isFinite(y)) return;
        const { py } = toPx(trace.x, y);
        g.fillStyle = COLORS[idx % COLORS.length];
        g.beginPath();
        g.arc(trace.px, py, 4, 0, Math.PI * 2);
        g.fill();
      });
    }
  }, [compiled, view, size, ctx, piAxis, trace, toPx, toX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      zoomAt(e.deltaY > 0 ? 1.15 : 1 / 1.15, e.clientX - rect.left, e.clientY - rect.top);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  });

  function zoomAt(factor: number, px = size.w / 2, py = size.h / 2) {
    setView((v) => {
      const cx = v.xMin + (px / size.w) * (v.xMax - v.xMin);
      const cy = v.yMax - (py / size.h) * (v.yMax - v.yMin);
      return {
        xMin: cx - (cx - v.xMin) * factor,
        xMax: cx + (v.xMax - cx) * factor,
        yMin: cy - (cy - v.yMin) * factor,
        yMax: cy + (v.yMax - cy) * factor,
      };
    });
  }

  function autoRange() {
    const ys: number[] = [];
    for (const f of compiled) {
      if (!f.on || !f.node) continue;
      for (let i = 0; i <= 200; i++) {
        const y = sample(f.node, view.xMin + ((view.xMax - view.xMin) * i) / 200, ctx);
        if (Number.isFinite(y)) ys.push(y);
      }
    }
    if (!ys.length) return;
    ys.sort((a, b) => a - b);
    let lo = ys[Math.floor(ys.length * 0.03)];
    let hi = ys[Math.ceil(ys.length * 0.97) - 1];
    if (hi - lo < 1e-9) {
      lo -= 1;
      hi += 1;
    }
    const pad = (hi - lo) * 0.1;
    setView((v) => ({ ...v, yMin: lo - pad, yMax: hi + pad }));
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    pinch.current.set(e.pointerId, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    drag.current = { x: e.clientX, y: e.clientY, view, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (pinch.current.size === 2 && pinch.current.has(e.pointerId)) {
      const [a, b] = [...pinch.current.values()];
      const before = Math.hypot(a.x - b.x, a.y - b.y);
      pinch.current.set(e.pointerId, { x: px, y: py });
      const [c, d] = [...pinch.current.values()];
      const after = Math.hypot(c.x - d.x, c.y - d.y);
      if (before > 0 && after > 0) zoomAt(before / after, (c.x + d.x) / 2, (c.y + d.y) / 2);
      drag.current = null;
      return;
    }

    const start = drag.current;
    if (start) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) start.moved = true;
      if (start.moved) {
        const sx = ((start.view.xMax - start.view.xMin) / size.w) * dx;
        const sy = ((start.view.yMax - start.view.yMin) / size.h) * dy;
        setView({
          xMin: start.view.xMin - sx,
          xMax: start.view.xMax - sx,
          yMin: start.view.yMin + sy,
          yMax: start.view.yMax + sy,
        });
        return;
      }
    }
    setTrace({ px, x: toX(px) });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pinch.current.delete(e.pointerId);
    const start = drag.current;
    drag.current = null;
    if (start && !start.moved) {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left;
      setTrace({ px, x: toX(px) });
    }
  };

  const traceRows = trace
    ? compiled
      .map((f, idx) => ({ f, idx, y: f.on && f.node ? sample(f.node, trace.x, ctx) : NaN }))
      .filter((r) => r.f.on && r.f.node)
    : [];

  const fmt = (v: number) => (Number.isFinite(v) ? Number(v.toPrecision(6)).toString() : '—');

  return (
    <div className="toolBody">
      <div className="toolRow toolRowWrap">
        <button type="button" className="toolChip" onClick={() => setAngle(angle === 'rad' ? 'deg' : 'rad')}>
          {angle === 'rad' ? 'RAD' : 'DEG'}
        </button>
        <button type="button" className={`toolChip ${piAxis ? 'toolChipOn' : ''}`} onClick={() => setPiAxis(!piAxis)}>
          {tr('Trục π', 'π axis')}
        </button>
        <span className="toolSpacer" />
        {fns.length < MAX_FUNCS && (
          <button
            type="button"
            className="toolChip"
            onClick={() => setFns([...fns, { id: Date.now(), expr: '', on: true }])}
          >
            + {tr('Thêm hàm', 'Add function')}
          </button>
        )}
      </div>

      <div className="graphFns">
        {compiled.map((f, idx) => (
          <div className="graphFn" key={f.id}>
            <input
              type="checkbox"
              checked={f.on}
              aria-label={tr('Hiện/ẩn', 'Show/hide')}
              style={{ accentColor: COLORS[idx % COLORS.length] }}
              onChange={(e) => setFns(fns.map((x) => (x.id === f.id ? { ...x, on: e.target.checked } : x)))}
            />
            <span className="graphFnName" style={{ color: COLORS[idx % COLORS.length] }}>f{idx + 1}(x)=</span>
            <input
              className={`toolInput ${f.expr.trim() && !f.node ? 'toolInputError' : ''}`}
              value={f.expr}
              placeholder="sin(x), x^2-4, 1/x"
              spellCheck={false}
              autoCapitalize="off"
              onChange={(e) => setFns(fns.map((x) => (x.id === f.id ? { ...x, expr: e.target.value } : x)))}
            />
            <button
              type="button"
              className="toolIconBtn"
              aria-label={tr('Xóa hàm', 'Remove function')}
              onClick={() => setFns(fns.filter((x) => x.id !== f.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="graphCanvasWrap" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className="graphCanvas"
          style={{ width: size.w, height: size.h }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse' && !drag.current) setTrace(null);
          }}
        />
        <div className="graphZoom">
          <button type="button" className="toolIconBtn" aria-label="Zoom in" onClick={() => zoomAt(1 / 1.5)}>+</button>
          <button type="button" className="toolIconBtn" aria-label="Zoom out" onClick={() => zoomAt(1.5)}>−</button>
          <button type="button" className="toolIconBtn" aria-label={tr('Về mặc định', 'Reset view')} onClick={() => setView(DEFAULT_VIEW)}>⟲</button>
          <button type="button" className="toolIconBtn" aria-label={tr('Tự căn trục y', 'Auto range')} onClick={autoRange}>↕</button>
        </div>
      </div>

      {trace ? (
        <div className="graphTrace">
          <span>x = {fmt(trace.x)}</span>
          {traceRows.map(({ idx, y }) => (
            <button
              type="button"
              key={idx}
              className="toolLink"
              style={{ color: COLORS[idx % COLORS.length] }}
              title={tr('Chèn vào máy', 'Insert into calculator')}
              onClick={() => Number.isFinite(y) && insertText(fmt(y))}
            >
              f{idx + 1} = {fmt(y)}
            </button>
          ))}
        </div>
      ) : (
        <p className="toolHint">
          {tr(
            'Kéo để di chuyển, cuộn hoặc chụm 2 ngón để phóng to. Chạm vào đồ thị để dò giá trị.',
            'Drag to pan, scroll or pinch to zoom. Tap the graph to trace values.',
          )}
        </p>
      )}
    </div>
  );
}
