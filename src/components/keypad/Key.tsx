import styles from '../../styles/calculator.module.css';
import type { KeyDefinition, KeyId } from '../../core/types';
import { useCalculatorStore } from '../../store/calculatorStore';
import { GLYPH_KEYS, KeyGlyph, ShiftMark } from './KeyGlyph';

interface KeyProps {
  definition: KeyDefinition;
  className?: string;
  wrapperClass?: string;
}

const ICON_SHIFTS = new Set(['RECUR', 'ROOTN', 'INV', 'MIXED', 'CYCLE', 'LIST', 'PREANS']);

export function Key({ definition, className, wrapperClass }: KeyProps) {
  const pressKey = useCalculatorStore((s) => s.pressKey);
  const releaseKey = useCalculatorStore((s) => s.releaseKey);
  const pressedKey = useCalculatorStore((s) => s.pressedKey);
  const shiftActive = useCalculatorStore((s) => s.shiftActive);
  const alphaActive = useCalculatorStore((s) => s.alphaActive);
  const legendsAlways = useCalculatorStore((s) => s.settings.keyLegends === 'all');

  const { id, label, shiftLabel, alphaLabel, caption, variant = 'default' } = definition;
  const isPressed = pressedKey === id;
  const showShift = Boolean(shiftLabel) && (legendsAlways || shiftActive);
  const showAlpha = Boolean(alphaLabel) && (legendsAlways || alphaActive);
  const isModifier = variant === 'shift' || variant === 'alpha';
  const layerClass = isModifier
    ? ''
    : shiftActive
      ? shiftLabel ? styles.keyOnLayerShift : ''
      : alphaActive && alphaLabel ? styles.keyOnLayerAlpha : '';
  const offLayer = !isModifier && ((shiftActive && !shiftLabel) || (!shiftActive && alphaActive && !alphaLabel));

  const variantClass =
    variant === 'shift'
      ? shiftActive ? styles.keyShiftActive : styles.keyShift
      : variant === 'alpha'
        ? alphaActive ? styles.keyAlphaActive : styles.keyAlpha
        : variant === 'gray'
          ? styles.keyGray
          : variant === 'exe'
            ? styles.keyExe
            : variant === 'system'
              ? styles.keySystem
              : variant === 'nav'
                ? styles.keyNav
                : '';

  const shiftNode = showShift && shiftLabel
    ? (
      <span className={styles.shiftLabel}>
        {shiftLabel === 'OFF'
          ? <span className={styles.offPill}>OFF</span>
          : ICON_SHIFTS.has(shiftLabel)
            ? <ShiftMark kind={shiftLabel} />
            : shiftLabel}
        {shiftLabel === 'OFF' ? null : <i className={styles.leader} />}
      </span>
    )
    : null;

  const alphaNode = showAlpha && alphaLabel
    ? (
      <span className={styles.alphaLabel}>
        {alphaLabel}
        <i className={styles.leader} />
      </span>
    )
    : null;

  const legend = caption || shiftNode || alphaNode
    ? (
      <span className={styles.legendRow}>
        {(shiftNode || alphaNode) && (
          <span className={styles.shiftStack}>
            {shiftNode}
            {alphaNode}
          </span>
        )}
        {caption ? <span className={styles.caption}>{caption}</span> : null}
      </span>
    )
    : <span className={styles.legendEmpty} />;

  return (
    <div className={[styles.keyWrapper, wrapperClass ?? '', offLayer ? styles.wrapperOffLayer : ''].filter(Boolean).join(' ')}>
      {legend}
      <button
        type="button"
        className={[styles.key, variantClass, layerClass, isPressed ? styles.keyPressed : '', className ?? '']
          .filter(Boolean)
          .join(' ')}
        aria-label={caption ? `${caption} ${label}` : [shiftLabel, alphaLabel, label].filter(Boolean).join(' ')}
        onMouseDown={() => pressKey(id as KeyId)}
        onMouseUp={releaseKey}
        onMouseLeave={releaseKey}
        onTouchStart={(e) => {
          e.preventDefault();
          pressKey(id as KeyId);
        }}
        onTouchEnd={releaseKey}
      >
        {GLYPH_KEYS.includes(id) ? <KeyGlyph id={id} /> : <span>{label}</span>}
      </button>
    </div>
  );
}
