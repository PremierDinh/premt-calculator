import type { PointerEvent } from 'react';
import type { KeyId } from '../../core/types';
import { useCalculatorStore } from '../../store/calculatorStore';

// Pointer events fire once per tap; React's touch listeners are passive, so
// touchstart + mousedown would register every tap twice on phones.
export function usePressHandlers(id: KeyId) {
  const pressKey = useCalculatorStore((s) => s.pressKey);
  const releaseKey = useCalculatorStore((s) => s.releaseKey);

  return {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      pressKey(id);
    },
    onPointerUp: releaseKey,
    onPointerLeave: releaseKey,
    onPointerCancel: releaseKey,
  };
}
