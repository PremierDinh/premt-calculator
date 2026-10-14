import { describe, expect, it } from 'vitest';
import { createInitialModeState, handleModeKey } from '../index';
import { mockKeyContext } from '../../../test/helpers/keyContext';
import type { KeyId } from '../../types';

function run(keys: KeyId[], shiftOn: KeyId[] = []) {
  let modeState = createInitialModeState();
  for (const key of keys) {
    const ctx = mockKeyContext({ shiftActive: shiftOn.includes(key) });
    ({ modeState } = handleModeKey('calculate', modeState, key, ctx));
  }
  return modeState.calculate;
}

describe('π key', () => {
  it('inserts pi and evaluates to the exact form', () => {
    expect(run(['PI', 'EXE']).result).toBe('π');
    expect(run(['TWO', 'MULT', 'PI', 'EXE']).result).toBe('2π');
  });

  it('inserts e on the SHIFT layer', () => {
    expect(run(['PI'], ['PI']).expression).toBe('e');
  });
});
