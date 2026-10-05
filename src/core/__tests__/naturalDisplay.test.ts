import { describe, expect, it } from 'vitest';
import { hasStackableFractions, segmentNaturalLine, toNaturalDisplay } from '../naturalDisplay';

describe('toNaturalDisplay', () => {
  it('renders sqrt and powers in MathI style', () => {
    expect(toNaturalDisplay('sqrt(2)+3^2')).toBe('√(2)+3²');
    expect(toNaturalDisplay('sin(asin(0.5))')).toBe('sin(sin⁻¹(0.5))');
  });

  it('segments stacked fractions', () => {
    expect(hasStackableFractions('1/2')).toBe(true);
    const parts = segmentNaturalLine('2 1/3');
    expect(parts.some((p) => p.kind === 'mixed')).toBe(true);
  });
});
