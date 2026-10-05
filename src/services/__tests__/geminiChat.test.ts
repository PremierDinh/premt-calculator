import { describe, expect, it } from 'vitest';
import { hasGeminiApiKey } from '../geminiChat';

describe('geminiChat', () => {
  it('detects missing API key', () => {
    expect(hasGeminiApiKey()).toBe(false);
  });
});
