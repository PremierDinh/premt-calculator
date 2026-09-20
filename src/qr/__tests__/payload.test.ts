import { describe, expect, it } from 'vitest';
import { buildQrPayload } from '../payload';

describe('qr payload', () => {
  it('builds expression=result payload', () => {
    expect(buildQrPayload('2+3', '5', 0)).toBe('2+3=5');
  });

  it('falls back to Ans when no result', () => {
    expect(buildQrPayload('', '', 7)).toBe('Ans=7');
  });
});
