export type Radix = 2 | 8 | 10 | 16;

export const RADIXES: { radix: Radix; label: string }[] = [
  { radix: 10, label: 'DEC' },
  { radix: 16, label: 'HEX' },
  { radix: 8, label: 'OCT' },
  { radix: 2, label: 'BIN' },
];

const DIGITS = '0123456789abcdef';

/** Parses a signed integer written in the given radix; spaces and underscores are ignored. */
export function parseInRadix(text: string, radix: Radix): bigint | null {
  let s = text.trim().toLowerCase().replace(/[\s_]/g, '');
  let negative = false;
  if (s.startsWith('-') || s.startsWith('−')) {
    negative = true;
    s = s.slice(1);
  }
  const prefix = { 2: '0b', 8: '0o', 10: '', 16: '0x' }[radix];
  if (prefix && s.startsWith(prefix)) s = s.slice(2);
  if (!s) return null;
  let value = 0n;
  const big = BigInt(radix);
  for (const ch of s) {
    const d = DIGITS.indexOf(ch);
    if (d < 0 || d >= radix) return null;
    value = value * big + BigInt(d);
  }
  return negative ? -value : value;
}

export function formatInRadix(value: bigint, radix: Radix, group = true): string {
  const negative = value < 0n;
  let digits = (negative ? -value : value).toString(radix).toUpperCase();
  if (group && (radix === 2 || radix === 16)) {
    const size = radix === 2 ? 4 : 4;
    const padded = digits.padStart(Math.ceil(digits.length / size) * size, '0');
    digits = padded.match(new RegExp(`.{${size}}`, 'g'))!.join(' ');
    if (radix === 16) digits = digits.replace(/^0+(?=\w)/, '');
  } else if (group && radix === 10) {
    digits = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  return (negative ? '−' : '') + digits;
}

/** Two's complement representation with the given bit width, or null if it does not fit. */
export function twosComplement(value: bigint, bits: number): bigint | null {
  const limit = 1n << BigInt(bits);
  if (value >= limit / 2n || value < -(limit / 2n)) return null;
  return value < 0n ? limit + value : value;
}
