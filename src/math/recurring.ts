/** Parse ClassWiz-style recurring literal, e.g. 0.{3}, 0.16{6}, .{12} */
export function parseRecurringLiteral(raw: string): number | null {
  const m = raw.match(/^(-?)(\d*)(?:\.(\d*))?\{(\d+)\}$/);
  if (!m) return null;
  const sign = m[1] === '-' ? -1 : 1;
  const intPart = m[2] ?? '';
  const prefix = m[3] ?? '';
  const recur = m[4];
  if (!recur.length) return null;

  const whole = intPart ? parseInt(intPart, 10) : 0;
  const p = prefix.length;
  const r = recur.length;
  const prefixVal = p ? parseInt(prefix, 10) / 10 ** p : 0;
  const recurVal = parseInt(recur, 10) / (10 ** p * (10 ** r - 1));
  return sign * (whole + prefixVal + recurVal);
}

export function isRecurringLiteral(raw: string): boolean {
  return /^\d*(?:\.\d*)?\{\d+\}$/.test(raw) || /^-\d*(?:\.\d*)?\{\d+\}$/.test(raw);
}
