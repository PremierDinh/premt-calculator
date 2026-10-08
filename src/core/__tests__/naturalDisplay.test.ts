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

describe('segmentNaturalLine', () => {
  it('stacks a surd numerator over its denominator', () => {
    expect(segmentNaturalLine('2√3/3')).toEqual([
      {
        kind: 'frac',
        num: [{ kind: 'text', text: '2' }, { kind: 'sqrt', body: [{ kind: 'text', text: '3' }] }],
        den: [{ kind: 'text', text: '3' }],
      },
    ]);
  });

  it('drops the parentheses around a stacked numerator', () => {
    const [frac] = segmentNaturalLine('(1+√5)/2');
    expect(frac).toEqual({
      kind: 'frac',
      num: [{ kind: 'text', text: '1+' }, { kind: 'sqrt', body: [{ kind: 'text', text: '5' }] }],
      den: [{ kind: 'text', text: '2' }],
    });
  });

  it('keeps operators outside the fraction', () => {
    const parts = segmentNaturalLine('1+2/3');
    expect(parts[0]).toEqual({ kind: 'text', text: '1+' });
    expect(parts[1].kind).toBe('frac');
  });

  it('draws a radical over a typed sqrt( group and superscripts powers', () => {
    expect(segmentNaturalLine('sqrt(8)')).toEqual([{ kind: 'sqrt', body: [{ kind: 'text', text: '8' }] }]);
    expect(segmentNaturalLine('2^10')).toEqual([
      { kind: 'text', text: '2' },
      { kind: 'sup', body: [{ kind: 'text', text: '10' }] },
    ]);
  });

  it('uses only the bracket next to the slash as a fraction slot', () => {
    expect(segmentNaturalLine('4(8)/()8')).toEqual([
      { kind: 'text', text: '4' },
      { kind: 'frac', num: [{ kind: 'text', text: '8' }], den: [] },
      { kind: 'text', text: '8' },
    ]);
  });

  it('keeps function brackets inside the numerator', () => {
    const [frac] = segmentNaturalLine('sin(30)/2');
    expect(frac).toEqual({
      kind: 'frac',
      num: [{ kind: 'text', text: 'sin(30)' }],
      den: [{ kind: 'text', text: '2' }],
    });
  });

  it('tolerates an unfinished group while typing', () => {
    expect(segmentNaturalLine('sqrt(2+')).toEqual([{ kind: 'sqrt', body: [{ kind: 'text', text: '2+' }] }]);
  });
});
