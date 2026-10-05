/** Lightweight MathI-style rendering for the LCD (not full Natural-V.P.A.M.). */

export type NaturalSegment =
  | { kind: 'text'; text: string }
  | { kind: 'frac'; num: string; den: string }
  | { kind: 'mixed'; whole: number; num: string; den: string };

export function toNaturalDisplay(text: string): string {
  return text
    .replace(/sqrt\(/g, '√(')
    .replace(/root\(/g, 'ⁿ√(')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^(-1)/g, '⁻¹')
    .replace(/\^(\([^)]+\))/g, '^$1')
    .replace(/\bpi\b/g, 'π')
    .replace(/\*/g, '×')
    .replace(/asin\(/g, 'sin⁻¹(')
    .replace(/acos\(/g, 'cos⁻¹(')
    .replace(/atan\(/g, 'tan⁻¹(')
    .replace(/\{(\d+)\}/g, '($1̅)');
}

export function segmentNaturalLine(text: string): NaturalSegment[] {
  const pretty = toNaturalDisplay(text);
  const parts: NaturalSegment[] = [];
  let i = 0;

  while (i < pretty.length) {
    const rest = pretty.slice(i);
    const mixed = rest.match(/^(-?\d+) (\d+)\/(\d+)/);
    if (mixed) {
      parts.push({
        kind: 'mixed',
        whole: Number(mixed[1]),
        num: mixed[2],
        den: mixed[3],
      });
      i += mixed[0].length;
      continue;
    }
    const frac = rest.match(/^(-?\d+)\/(\d+)/);
    if (frac) {
      const num = frac[1];
      parts.push({ kind: 'frac', num, den: frac[2] });
      i += frac[0].length;
      continue;
    }
    parts.push({ kind: 'text', text: pretty[i] });
    i += 1;
  }

  return parts;
}

export function hasStackableFractions(text: string): boolean {
  return /(?:\d+ \d+\/\d+|\d+\/\d+)/.test(text);
}
