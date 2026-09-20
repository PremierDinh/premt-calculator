import styles from '../../styles/calculator.module.css';
import { Key } from './Key';
import { getKeyDefinition } from '../../core/keyMap';
import type { KeyId } from '../../core/types';

function K(id: KeyId, wrapperClass?: string) {
  const def = getKeyDefinition(id);
  if (!def) return <div key={id} className={styles.keyWrapper} />;
  return <Key key={id} definition={def} wrapperClass={wrapperClass} />;
}

export function KeypadGrid() {
  return (
    <>
      <div className={styles.topDeck}>
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
