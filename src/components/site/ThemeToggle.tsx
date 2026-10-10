import { useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'premt-theme';

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function ThemeToggle({ language }: { language: 'vi' | 'en' }) {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore storage errors */
    }
    setTheme(next);
  };

  const label = theme === 'dark'
    ? (language === 'vi' ? 'Chuyển sang nền sáng' : 'Switch to light theme')
    : (language === 'vi' ? 'Chuyển sang nền tối' : 'Switch to dark theme');

  return (
    <button type="button" className="themeToggle" onClick={toggle} aria-label={label} title={label}>
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
