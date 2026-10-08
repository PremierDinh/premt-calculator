import { describe, expect, it } from 'vitest';
import { createInitialModeState, handleModeKey } from '../index';
import { mockKeyContext } from '../../../test/helpers/keyContext';
import type { KeyId } from '../../types';

function run(keys: KeyId[]) {
  let modeState = createInitialModeState();
  for (const key of keys) {
    ({ modeState } = handleModeKey('calculate', modeState, key, mockKeyContext()));
  }
  return modeState.calculate;
}

describe('calculate natural input/output', () => {
  it('fills an a/b template and jumps to the denominator with RIGHT', () => {
    const state = run(['FRAC', 'ONE', 'RIGHT', 'THREE', 'RIGHT', 'PLUS', 'FRAC', 'ONE', 'RIGHT', 'SIX', 'EXE']);
    expect(state.expression).toBe('(1)/(3)+(1)/(6)');
    expect(state.result).toBe('1/2');
  });

  it('turns the number before a/b into the numerator', () => {
    const state = run(['FOUR', 'FRAC', 'EIGHT', 'EXE']);
    expect(state.expression).toBe('(4)/(8)');
    expect(state.result).toBe('1/2');
  });

  it('turns a bracketed group before a/b into the numerator', () => {
    const state = run(['LPAREN', 'ONE', 'PLUS', 'TWO', 'RPAREN', 'FRAC', 'FOUR']);
    expect(state.expression).toBe('(1+2)/(4)');
  });

  it('DEL removes an empty fraction and steps from denominator to numerator', () => {
    expect(run(['TWO', 'PLUS', 'FRAC', 'DEL']).expression).toBe('2+');
    const state = run(['FRAC', 'ONE', 'RIGHT', 'DEL']);
    expect(state.expression).toBe('(1)/()');
    expect(state.cursorPos).toBe(2);
  });

  it('keeps square roots exact', () => {
    expect(run(['SQRT', 'EIGHT', 'RPAREN', 'EXE']).result).toBe('2√2');
  });
});
