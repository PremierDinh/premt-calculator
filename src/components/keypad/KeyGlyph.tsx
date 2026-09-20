import type { KeyId } from '../../core/types';
import styles from '../../styles/calculator.module.css';

const ink = '#1a1a1a';

export function KeyGlyph({ id }: { id: KeyId }) {
  switch (id) {
    case 'HOME':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <path d="M6 16.5 16 8l10 8.5" fill="none" stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M10 16.2V24h12v-7.8" fill="none" stroke={ink} strokeWidth="1.8" />
        </svg>
      );
    case 'SETTINGS':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <path d="M6 10h20M6 16h20M6 22h20" fill="none" stroke={ink} strokeWidth="1.7" />
          <circle cx="12" cy="10" r="2.1" fill={ink} />
          <circle cx="20" cy="16" r="2.1" fill={ink} />
          <circle cx="14" cy="22" r="2.1" fill={ink} />
        </svg>
      );
    case 'EXIT':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <path d="M8 11h12a6 6 0 0 1 0 12H10" fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M13 8 8 11.5 13 15" fill="none" stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'SHIFT':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <path d="M16 8v16M10 14l6-6 6 6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'VARIABLE':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <rect x="11" y="8" width="16" height="16" rx="1" fill="none" stroke={ink} strokeWidth="1.55" />
          <text x="19" y="21.5" textAnchor="middle" fontSize="16" fontFamily="Times, 'Times New Roman', serif" fontStyle="italic">x</text>
          <path d="M3.5 12h7M8.2 9.8l2.4 2.2-2.4 2.2M10.6 20H3.5M5.9 17.8 3.5 20l2.4 2.2" fill="none" stroke={ink} strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'FUNCTION':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <text
            x="16"
            y="22"
            textAnchor="middle"
            fontSize="18"
            fontWeight="400"
            fontFamily="Times, 'Times New Roman', serif"
          >
            f(x)
          </text>
        </svg>
      );
    case 'CATALOG':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <path d="M7 12.2 16 8.6 25 12.2v11.2L16 20.2 7 23.4Z" fill="none" stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M16 8.6v11.6" fill="none" stroke={ink} strokeWidth="1.8" />
        </svg>
      );
    case 'TOOLS':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <circle cx="8" cy="16" r="2.6" fill={ink} />
          <circle cx="16" cy="16" r="2.6" fill={ink} />
          <circle cx="24" cy="16" r="2.6" fill={ink} />
        </svg>
      );
    case 'UP':
      return chevron('up');
    case 'DOWN':
      return chevron('down');
    case 'LEFT':
      return chevron('left');
    case 'RIGHT':
      return chevron('right');
    case 'PAGEUP':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <path d="M10 16l6-6 6 6M10 24l6-6 6 6" fill="none" stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'PAGEDOWN':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <path d="M10 8l6 6 6-6M10 16l6 6 6-6" fill="none" stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'X':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <text x="16" y="22.5" textAnchor="middle" fontSize="20" fontFamily="Times, 'Times New Roman', serif" fontStyle="italic" fontWeight="500">x</text>
        </svg>
      );
    case 'FRAC':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <rect x="9" y="6.5" width="14" height="6.5" rx="0.8" fill="none" stroke={ink} strokeWidth="1.8" />
          <path d="M6.5 16h19" fill="none" stroke={ink} strokeWidth="1.8" />
          <rect x="9" y="19" width="14" height="6.5" rx="0.8" fill="none" stroke={ink} strokeWidth="1.8" />
        </svg>
      );
    case 'SQRT':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <path
            d="M4.5 17.2H7.2L9.4 24.8H10.5L18.8 9.8H27.5"
            fill="none"
            stroke={ink}
            strokeWidth="1.85"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <rect x="18.8" y="16.8" width="8.8" height="8.8" rx="0.6" fill={ink} />
        </svg>
      );
    case 'POWER':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <rect x="5.5" y="12" width="13" height="13" rx="1.6" fill={ink} />
          <rect x="20.2" y="6.5" width="7.2" height="7.2" rx="1" fill="none" stroke={ink} strokeWidth="1.6" />
        </svg>
      );
    case 'SQUARE':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <rect x="5.5" y="11.5" width="13.5" height="13.5" rx="1.6" fill={ink} />
          <text x="21.5" y="14" fontSize="11" fontWeight="700">2</text>
        </svg>
      );
    case 'LOG':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <text x="1" y="21" fontSize="11" fontWeight="700" fontFamily="Segoe UI, sans-serif">log</text>
          <rect x="21.2" y="13" width="8.4" height="8.4" rx="1.1" fill={ink} />
        </svg>
      );
    case 'DEL':
      return (
        <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
          <path d="M12 9H26v14H12l-6-7z" fill="none" stroke={ink} strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M16 13.2 22 20.8M22 13.2 16 20.8" fill="none" stroke={ink} strokeWidth="1.7" />
        </svg>
      );
    case 'EXP10':
      return (
        <svg viewBox="0 0 36 32" className={styles.glyphWide} aria-hidden="true">
          <text x="1" y="22" fontSize="11" fontWeight="700">×10</text>
          <rect x="24" y="6" width="9" height="9" rx="1.2" fill={ink} />
        </svg>
      );
    case 'FORMAT':
      return (
        <svg viewBox="0 0 44 44" className={styles.formatGlyph} aria-hidden="true">
          <path
            d="M7 18C9.4 8.4 18 4.5 27 6.2c4.6.9 8.4 3.5 10.6 7.2"
            fill="none"
            stroke={ink}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path d="m34.2 9.2 3.7 4.7-5.7 1.7" fill={ink} stroke={ink} strokeLinejoin="round" />
          <path
            d="M37 26c-2.4 9.6-11 13.5-20 11.8-4.6-.9-8.4-3.5-10.6-7.2"
            fill="none"
            stroke={ink}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path d="m9.8 34.8-3.7-4.7 5.7-1.7" fill={ink} stroke={ink} strokeLinejoin="round" />
          <text
            x="22"
            y="26"
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="800"
            fontFamily="'Arial Narrow', 'Segoe UI', sans-serif"
          >
            FORMAT
          </text>
        </svg>
      );
    default:
      return null;
  }
}

function chevron(dir: 'up' | 'down' | 'left' | 'right') {
  const d =
    dir === 'up' ? 'M9 19l7-8 7 8'
    : dir === 'down' ? 'M9 13l7 8 7-8'
    : dir === 'left' ? 'M19 9l-8 7 8 7'
    : 'M13 9l8 7-8 7';
  return (
    <svg viewBox="0 0 32 32" className={styles.glyph} aria-hidden="true">
      <path d={d} fill="none" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function ShiftMark({ kind }: { kind: string }) {
  if (kind === 'RECUR') {
    return (
      <svg viewBox="0 0 18 12" className={styles.shiftIconWide} aria-hidden="true">
        <rect x="0.5" y="4" width="4.2" height="4.2" rx="0.5" fill="#2f8fd6" />
        <rect x="10" y="0.8" width="5.2" height="3.2" rx="0.4" fill="none" stroke="#2f8fd6" strokeWidth="1" />
        <path d="M7.5 6h10" fill="none" stroke="#2f8fd6" strokeWidth="1.1" />
        <rect x="10" y="8" width="5.2" height="3.2" rx="0.4" fill="none" stroke="#2f8fd6" strokeWidth="1" />
      </svg>
    );
  }
  if (kind === 'ROOTN') {
    return (
      <svg viewBox="0 0 18 12" className={styles.shiftIconWide} aria-hidden="true">
        <rect x="0.4" y="0.4" width="3.6" height="3.6" rx="0.4" fill="#2f8fd6" />
        <path
          d="M4.2 5.8h1.2l0.9 2.8h0.8L9.8 2.8H16.5"
          fill="none"
          stroke="#2f8fd6"
          strokeWidth="1.15"
          strokeLinejoin="round"
        />
        <rect x="9.8" y="5.6" width="6.2" height="5.4" rx="0.4" fill="none" stroke="#2f8fd6" strokeWidth="1.1" />
      </svg>
    );
  }
  if (kind === 'INV') {
    return (
      <svg viewBox="0 0 16 10" className={styles.shiftIcon} aria-hidden="true">
        <rect x="0.4" y="3.2" width="5.2" height="5.2" rx="0.5" fill="#2f8fd6" />
        <text x="6.2" y="8.4" fontSize="7" fontWeight="700" fill="#2f8fd6">-1</text>
      </svg>
    );
  }
  if (kind === 'MIXED') {
    return (
      <svg viewBox="0 0 16 10" className={styles.shiftIcon} aria-hidden="true">
        <rect x="1" y="3" width="4" height="5" rx="0.5" fill="#2f8fd6" />
        <rect x="8" y="1" width="6" height="3" rx="0.4" fill="#2f8fd6" />
        <rect x="7" y="4.6" width="8" height="1" fill="#2f8fd6" />
        <rect x="8" y="6.2" width="6" height="3" rx="0.4" fill="#2f8fd6" />
      </svg>
    );
  }
  if (kind === 'LIST') {
    return (
      <svg viewBox="0 0 10 10" className={styles.shiftIcon} aria-hidden="true">
        <path d="M1.2 1.4h7.4M1.2 5h7.4M1.2 8.6h7.4" fill="none" stroke="#2f8fd6" strokeWidth="1.2" />
      </svg>
    );
  }
  if (kind === 'PREANS') {
    return (
      <span className={styles.shiftStack}>
        <span>Pre</span>
        <span>Ans</span>
      </span>
    );
  }
  if (kind === 'CYCLE') {
    return <span>↻</span>;
  }
  return <span>{kind}</span>;
}

export const GLYPH_KEYS: KeyId[] = [
  'HOME', 'SETTINGS', 'EXIT', 'SHIFT', 'VARIABLE', 'FUNCTION', 'CATALOG', 'TOOLS',
  'UP', 'DOWN', 'LEFT', 'RIGHT', 'PAGEUP', 'PAGEDOWN',
  'X', 'FRAC', 'SQRT', 'POWER', 'SQUARE', 'LOG', 'DEL', 'EXP10', 'FORMAT',
];
