import type { KeyId } from './types';

export function shouldHandleGlobally(key: KeyId, power: 'on' | 'off'): boolean {
  if (power === 'off') return key === 'ON';
  return ['ON', 'HOME', 'MENU', 'SETTINGS', 'EXIT', 'SHIFT', 'ALPHA', 'CATALOG', 'TOOLS', 'FORMAT'].includes(key);
}
