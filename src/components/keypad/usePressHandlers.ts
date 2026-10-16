import type { PointerEvent } from 'react';
import type { KeyId } from '../../core/types';
import { useCalculatorStore } from '../../store/calculatorStore';

function lightHaptic() {
  try {
    // Short pulse — ignored when Vibration API is unavailable or blocked.
    navigator.vibrate?.(8);
  } catch {
    /* no-op */
  }
}

// Pointer events fire once per tap; React's touch listeners are passive, so
// touchstart + mousedown would register every tap twice on phones.
export function usePressHandlers(id: KeyId) {
  const pressKey = useCalculatorStore((s) => s.pressKey);
  const releaseKey = useCalculatorStore((s) => s.releaseKey);

  return {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      if (e.pointerType === 'touch') lightHaptic();
      pressKey(id);
    },
    onPointerUp: releaseKey,
    onPointerLeave: releaseKey,
    onPointerCancel: releaseKey,
  };
}
