import styles from '../../styles/calculator.module.css';
import { useCalculatorStore } from '../../store/calculatorStore';
import type { KeyId } from '../../core/types';

function NavButton({ keyId, label, className }: { keyId: KeyId; label: string; className?: string }) {
  const pressKey = useCalculatorStore((s) => s.pressKey);
  const releaseKey = useCalculatorStore((s) => s.releaseKey);
  const pressedKey = useCalculatorStore((s) => s.pressedKey);

  return (
    <button
      type="button"
      className={`${styles.key} ${styles.navBtn} ${pressedKey === keyId ? styles.keyPressed : ''} ${className ?? ''}`}
      aria-label={keyId}
      onMouseDown={() => pressKey(keyId)}
      onMouseUp={releaseKey}
      onMouseLeave={releaseKey}
      onTouchStart={(e) => { e.preventDefault(); pressKey(keyId); }}
      onTouchEnd={releaseKey}
    >
      {label}
    </button>
  );
}

export function NavPad() {
  return (
    <div className={styles.navCluster}>
      <NavButton keyId="UP" label="▲" className={styles.navUp} />
      <NavButton keyId="LEFT" label="<" className={styles.navLeft} />
      <NavButton keyId="OK" label="OK" className={styles.navOk} />
      <NavButton keyId="RIGHT" label=">" className={styles.navRight} />
      <NavButton keyId="DOWN" label="▼" className={styles.navDown} />
    </div>
  );
}

export function ScrollKeys() {
  return (
    <div className={styles.scrollStack}>
      <NavButton keyId="PAGEUP" label="▲▲" className={styles.scrollHalf} />
      <NavButton keyId="PAGEDOWN" label="▼▼" className={styles.scrollHalf} />
    </div>
  );
}
