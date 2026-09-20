import { useEffect, useRef, useState } from 'react';
import styles from '../styles/calculator.module.css';
import { LCDScreen } from './display/LCDScreen';
import { KeypadGrid } from './keypad/KeypadGrid';
import { useCalculatorStore } from '../store/calculatorStore';
import { KEYBOARD_MAP } from '../core/keyMap';
import type { KeyId } from '../core/types';
import { t } from '../i18n/strings';

export function CalculatorShell() {
  const pressKey = useCalculatorStore((s) => s.pressKey);
  const refreshDisplay = useCalculatorStore((s) => s.refreshDisplay);
  const language = useCalculatorStore((s) => s.settings.language);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    refreshDisplay();
  }, [refreshDisplay]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!focused) return;
      const mapped = e.key === 'Shift' ? 'SHIFT' : KEYBOARD_MAP[e.key];
      if (!mapped) return;
      e.preventDefault();
      pressKey(mapped as KeyId);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pressKey, focused]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const s = useCalculatorStore.getState();
      if (s.power !== 'on') return;
      const limit = s.settings.autoPowerOffMin * 60 * 1000;
      if (Date.now() - s.lastInputAt > limit) s.pressKey('ON');
    }, 10000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      ref={wrapRef}
      className={styles.page}
      tabIndex={0}
      role="application"
      data-calculator-shell
      aria-label={t(language, 'brand')}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node)) {
          setFocused(false);
        }
      }}
      onPointerDown={() => wrapRef.current?.focus()}
    >
      <div className={styles.shell}>
        <div className={styles.brandRow}>
          <span className={styles.brand}>{t(language, 'brand')}</span>
          <span className={styles.model}>{t(language, 'model')}</span>
        </div>

        <LCDScreen />

        <div className={styles.classwiz}>{t(language, 'classLine')}</div>

        <KeypadGrid />
      </div>
    </div>
  );
}
