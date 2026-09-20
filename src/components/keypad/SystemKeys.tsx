import { Key } from './Key';
import { getKeyDefinition } from '../../core/keyMap';
import type { KeyId } from '../../core/types';
import styles from '../../styles/calculator.module.css';

const SYSTEM_IDS: KeyId[] = ['ON', 'HOME', 'SETTINGS', 'EXIT'];

export function SystemKeys() {
  return (
    <div className={styles.sysCluster}>
      {SYSTEM_IDS.map((id) => {
        const def = getKeyDefinition(id);
        return def ? <Key key={id} definition={def} /> : null;
      })}
    </div>
  );
}
