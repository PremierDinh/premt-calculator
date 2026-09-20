export const MAX_QR_PAYLOAD = 200;

export function buildQrPayload(expression: string, result: string, ans: number): string {
  const expr = expression.trim();
  const res = result.trim();
  if (expr && res && res !== 'Math ERROR') return truncate(`${expr}=${res}`);
  if (expr) return truncate(`${expr}=Ans`);
  return truncate(`Ans=${ans}`);
}

function truncate(text: string): string {
  if (text.length <= MAX_QR_PAYLOAD) return text;
  return text.slice(0, MAX_QR_PAYLOAD - 1) + '…';
}
