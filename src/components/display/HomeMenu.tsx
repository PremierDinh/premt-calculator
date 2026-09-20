import type { ReactElement } from 'react';
import lcdStyles from '../../styles/lcd.module.css';
import type { HomeMenuItem, ModeId } from '../../core/types';

interface HomeMenuProps {
  items: HomeMenuItem[];
  selectedIndex: number;
}

function Glyph({ children }: { children: string }) {
  return (
    <svg viewBox="0 0 32 32" className={lcdStyles.menuIcon}>
      <text x="16" y="21" textAnchor="middle" fontSize="9" fill="#1d4ed8" fontFamily="sans-serif">{children}</text>
    </svg>
  );
}

function MenuIcon({ icon }: { icon: ModeId }) {
  const icons: Partial<Record<ModeId, ReactElement>> = {
    calculate: (
      <svg viewBox="0 0 32 32" className={lcdStyles.menuIcon}>
        <text x="4" y="12" fontSize="10" fill="#222">+</text>
        <text x="18" y="12" fontSize="10" fill="#222">−</text>
        <text x="4" y="26" fontSize="10" fill="#222">×</text>
        <text x="18" y="26" fontSize="10" fill="#222">÷</text>
      </svg>
    ),
    statistics: (
      <svg viewBox="0 0 32 32" className={lcdStyles.menuIcon}>
        <rect x="4" y="18" width="5" height="10" fill="#2563eb" />
        <rect x="13" y="12" width="5" height="16" fill="#2563eb" />
        <rect x="22" y="6" width="5" height="22" fill="#2563eb" />
      </svg>
    ),
    distribution: (
      <svg viewBox="0 0 32 32" className={lcdStyles.menuIcon}>
        <path d="M4 26 Q16 4 28 26" stroke="#2563eb" strokeWidth="2" fill="none" />
      </svg>
    ),
    spreadsheet: (
      <svg viewBox="0 0 32 32" className={lcdStyles.menuIcon}>
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <rect key={`${r}-${c}`} x={4 + c * 9} y={6 + r * 8} width="7" height="6" fill="none" stroke="#2563eb" strokeWidth="1" />
          )),
        )}
      </svg>
    ),
    table: (
      <svg viewBox="0 0 32 32" className={lcdStyles.menuIcon}>
        <rect x="4" y="6" width="24" height="20" fill="none" stroke="#2563eb" strokeWidth="1.5" />
        <line x1="4" y1="14" x2="28" y2="14" stroke="#2563eb" strokeWidth="1" />
        <line x1="14" y1="6" x2="14" y2="26" stroke="#2563eb" strokeWidth="1" />
      </svg>
    ),
    equation: <Glyph>XY=0</Glyph>,
    inequality: <Glyph>x&gt;0</Glyph>,
    complex: <Glyph>a+bi</Glyph>,
    basen: <Glyph>HEX</Glyph>,
    matrix: <Glyph>[A]</Glyph>,
    vector: <Glyph>→v</Glyph>,
    ratio: <Glyph>a:b</Glyph>,
    mathbox: <Glyph>🎲</Glyph>,
  };
  return icons[icon] ?? <Glyph>•</Glyph>;
}

export function HomeMenu({ items, selectedIndex }: HomeMenuProps) {
  const page = Math.floor(selectedIndex / 6);
  const visible = items.slice(page * 6, page * 6 + 6);

  return (
    <div className={lcdStyles.homeGrid}>
      {visible.map((item, i) => {
        const abs = page * 6 + i;
        return (
          <div
            key={item.id}
            className={`${lcdStyles.menuItem} ${abs === selectedIndex ? lcdStyles.menuItemSelected : ''}`}
          >
            <MenuIcon icon={item.icon} />
            <span className={lcdStyles.menuLabel}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
