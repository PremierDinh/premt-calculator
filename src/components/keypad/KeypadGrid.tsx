import styles from '../../styles/calculator.module.css';
import { Key } from './Key';
import { getKeyDefinition } from '../../core/keyMap';
import type { KeyId } from '../../core/types';
import { useCalculatorStore } from '../../store/calculatorStore';

function K(id: KeyId, wrapperClass?: string) {
  const def = getKeyDefinition(id);
  if (!def) return <div key={id} className={styles.keyWrapper} />;
  return <Key key={id} definition={def} wrapperClass={wrapperClass} />;
}

function ToolsToggle() {
  const toolsOpen = useCalculatorStore((s) => s.toolsOpen);
  const setToolsOpen = useCalculatorStore((s) => s.setToolsOpen);
  const language = useCalculatorStore((s) => s.settings.language);
  const label = language === 'vi' ? 'Công cụ' : 'Tools';

  return (
    <div className={`${styles.keyWrapper} ${styles.areaPanel} ${styles.panelToggle}`}>
      <span className={styles.legendRow}><span className={styles.caption}>{label}</span></span>
      <button
        type="button"
        className={`${styles.key} ${styles.keyPanel}`}
        aria-label={label}
        aria-expanded={toolsOpen}
        onClick={() => setToolsOpen(!toolsOpen)}
      >
        <svg viewBox="0 0 24 24" className={styles.glyph} aria-hidden="true">
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M17 13.5v7M13.5 17h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export function KeypadGrid() {
  return (
    <>
      <div className={styles.topDeck}>
        <ToolsToggle />
        {K('ON', styles.areaOn)}
        {K('HOME', styles.areaHome)}
        {K('MENU', styles.areaMenu)}
        {K('UP', styles.areaUp)}
        {K('PAGEUP', styles.areaPgUp)}
        {K('SETTINGS', styles.areaSet)}
        {K('EXIT', styles.areaExit)}
        {K('LEFT', styles.areaLeft)}
        {K('OK', styles.areaOk)}
        {K('RIGHT', styles.areaRight)}
        {K('PAGEDOWN', styles.areaPgDn)}
        {K('ALPHA', styles.areaAlpha)}
        {K('SHIFT', styles.areaShift)}
        {K('VARIABLE', styles.areaVar)}
        {K('FUNCTION', styles.areaFunc)}
        {K('DOWN', styles.areaDown)}
        {K('CATALOG', styles.areaCat)}
        {K('TOOLS', styles.areaTools)}
      </div>

      <div className={styles.sciBlock}>
        <div className={styles.scientificRow}>
          {K('X')}
          {K('FRAC')}
          {K('SQRT')}
          {K('POWER')}
          {K('SQUARE')}
          {K('LOG')}
        </div>
        <div className={styles.scientificRow2}>
          {K('ANS')}
          {K('SIN')}
          {K('COS')}
          {K('TAN')}
          {K('LPAREN')}
          {K('RPAREN')}
        </div>
      </div>

      <div className={styles.numPad}>
        {K('SEVEN')}
        {K('EIGHT')}
        {K('NINE')}
        {K('DEL')}
        {K('AC')}

        {K('FOUR')}
        {K('FIVE')}
        {K('SIX')}
        {K('MULT')}
        {K('DIV')}

        {K('ONE')}
        {K('TWO')}
        {K('THREE')}
        {K('PLUS')}
        {K('MINUS')}

        {K('ZERO')}
        {K('DOT')}
        {K('EXP10')}
        {K('FORMAT')}
        {K('EXE')}
      </div>
    </>
  );
}
