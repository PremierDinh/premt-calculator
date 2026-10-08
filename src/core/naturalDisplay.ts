/** Lightweight MathI-style rendering for the LCD (not full Natural-V.P.A.M.). */

export const CURSOR_MARK = '▌';

export type NaturalSegment =
  | { kind: 'text'; text: string }
  | { kind: 'frac'; num: NaturalSegment[]; den: NaturalSegment[] }
  | { kind: 'mixed'; whole: string; num: NaturalSegment[]; den: NaturalSegment[] }
  | { kind: 'sqrt'; body: NaturalSegment[] }
  | { kind: 'sup'; body: NaturalSegment[] };

export function toNaturalDisplay(text: string): string {
  return text
    .replace(/sqrt\(/g, '√(')
    .replace(/root\(/g, 'ⁿ√(')
    .replace(/\^2(?![\d.])/g, '²')
    .replace(/\^3(?![\d.])/g, '³')
    .replace(/\^\(-1\)/g, '⁻¹')
    .replace(/\bpi\b/g, 'π')
    .replace(/\*/g, '×')
    .replace(/asin\(/g, 'sin⁻¹(')
    .replace(/acos\(/g, 'cos⁻¹(')
    .replace(/atan\(/g, 'tan⁻¹(')
    .replace(/\{(\d+)\}/g, '($1̅)');
}

const OPERATORS = new Set(['+', '-', '×', '÷', '/', ',', '=', ' ', '<', '>', '≤', '≥', ':', '±']);

/** A parenthesised group at the start (lead) or end (tail) of a term, which can serve as a fraction slot. */
interface GroupSlot {
  segs: NaturalSegment[];
  start: number;
  end: number;
}

type Unit =
  | { type: 'term'; segs: NaturalSegment[]; lead: GroupSlot | null; tail: GroupSlot | null; digits: boolean }
  | { type: 'op'; op: string };

const FUNCTION_CHAR = /[A-Za-z⁻¹]/;

interface Parsed {
  segs: NaturalSegment[];
  end: number;
}

function parseGroup(s: string, i: number): Parsed & { closed: boolean } {
  return parseSeq(s, i + 1, true);
}

function parseFactor(s: string, i: number): Parsed {
  const ch = s[i];
  if (ch === undefined) return { segs: [], end: i };
  if (ch === '(') {
    const g = parseGroup(s, i);
    return { segs: g.segs, end: g.end };
  }
  if (ch === '√') {
    const body = parseFactor(s, i + 1);
    return { segs: [{ kind: 'sqrt', body: body.segs }], end: body.end };
  }
  const num = s.slice(i).match(/^-?[\d.]+/);
  if (num) return { segs: [{ kind: 'text', text: num[0] }], end: i + num[0].length };
  return { segs: [{ kind: 'text', text: ch }], end: i + 1 };
}

function parseTerm(s: string, start: number): Parsed & { lead: GroupSlot | null; tail: GroupSlot | null } {
  const segs: NaturalSegment[] = [];
  let lead: GroupSlot | null = null;
  let tail: GroupSlot | null = null;
  let i = start;
  while (i < s.length) {
    const ch = s[i];
    if (ch === ')' || OPERATORS.has(ch)) break;
    if (ch === '(') {
      const g = parseGroup(s, i);
      const slot: GroupSlot = { segs: g.segs, start: segs.length, end: 0 };
      segs.push({ kind: 'text', text: '(' }, ...g.segs);
      if (g.closed) segs.push({ kind: 'text', text: ')' });
      slot.end = segs.length;
      if (i === start) lead = slot;
      tail = i === start || !FUNCTION_CHAR.test(s[i - 1]) ? slot : null;
      i = g.end;
      continue;
    }
    tail = null;
    if (ch === '√') {
      const body = parseFactor(s, i + 1);
      segs.push({ kind: 'sqrt', body: body.segs });
      i = body.end;
      continue;
    }
    if (ch === '^') {
      const body = parseFactor(s, i + 1);
      segs.push({ kind: 'sup', body: body.segs });
      i = body.end;
      continue;
    }
    segs.push({ kind: 'text', text: ch });
    i += 1;
  }
  return { segs, end: i, lead, tail };
}

function parseSeq(s: string, start: number, stopAtClose: boolean): Parsed & { closed: boolean } {
  const units: Unit[] = [];
  let i = start;
  let closed = false;
  while (i < s.length) {
    const ch = s[i];
    if (ch === ')') {
      if (stopAtClose) {
        closed = true;
        i += 1;
        break;
      }
      units.push({ type: 'op', op: ch });
      i += 1;
      continue;
    }
    if (OPERATORS.has(ch)) {
      units.push({ type: 'op', op: ch });
      i += 1;
      continue;
    }
    const term = parseTerm(s, i);
    const raw = s.slice(i, term.end);
    units.push({ type: 'term', segs: term.segs, lead: term.lead, tail: term.tail, digits: /^\d+$/.test(raw) });
    i = term.end;
  }
  return { segs: flatten(combine(units)), end: i, closed };
}

function combine(units: Unit[]): Array<Unit | NaturalSegment> {
  const withFracs: Array<Unit | NaturalSegment> = [];
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    const slash = units[i + 1];
    const den = units[i + 2];
    const prev = withFracs[withFracs.length - 1];
    if (u.type === 'term' && slash?.type === 'op' && slash.op === '/' && den?.type === 'term') {
      const prefix = u.tail ? u.segs.slice(0, u.tail.start) : [];
      const num = u.tail ? u.tail.segs : u.segs;
      withFracs.push(...prefix, { kind: 'frac', num: flatten(num), den: flatten(den.lead ? den.lead.segs : den.segs) });
      if (den.lead) withFracs.push(...den.segs.slice(den.lead.end));
      i += 2;
      continue;
    }
    if (prev && 'kind' in prev && prev.kind === 'frac' && u.type === 'op' && u.op === '/' && slash?.type === 'term') {
      withFracs[withFracs.length - 1] = { kind: 'frac', num: [prev], den: slash.lead ? slash.lead.segs : slash.segs };
      if (slash.lead) withFracs.push(...slash.segs.slice(slash.lead.end));
      i += 1;
      continue;
    }
    withFracs.push(u);
  }

  const out: Array<Unit | NaturalSegment> = [];
  for (let i = 0; i < withFracs.length; i++) {
    const u = withFracs[i];
    const space = withFracs[i + 1];
    const frac = withFracs[i + 2];
    if (
      'type' in u && u.type === 'term' && u.digits &&
      space && 'type' in space && space.type === 'op' && space.op === ' ' &&
      frac && 'kind' in frac && frac.kind === 'frac'
    ) {
      const whole = u.segs.map((seg) => (seg.kind === 'text' ? seg.text : '')).join('');
      out.push({ kind: 'mixed', whole, num: frac.num, den: frac.den });
      i += 2;
      continue;
    }
    out.push(u);
  }
  return out;
}

function flatten(items: Array<Unit | NaturalSegment>): NaturalSegment[] {
  const segs: NaturalSegment[] = [];
  const push = (seg: NaturalSegment) => {
    const last = segs[segs.length - 1];
    if (seg.kind === 'text' && last?.kind === 'text') last.text += seg.text;
    else segs.push(seg.kind === 'text' ? { ...seg } : seg);
  };
  for (const item of items) {
    if ('kind' in item) push(item);
    else if (item.type === 'op') push({ kind: 'text', text: item.op });
    else item.segs.forEach(push);
  }
  return segs;
}

export function parseNatural(pretty: string): NaturalSegment[] {
  return parseSeq(pretty, 0, false).segs;
}

export function segmentNaturalLine(text: string): NaturalSegment[] {
  return parseNatural(toNaturalDisplay(text));
}

export function hasStackableFractions(text: string): boolean {
  return /(?:\d+ \d+\/\d+|\d+\/\d+)/.test(text);
}
