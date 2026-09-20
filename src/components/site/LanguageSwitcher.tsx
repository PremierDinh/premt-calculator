import { useEffect } from 'react';
import type { Language } from '../../core/settings';
import { t } from '../../i18n/strings';
import { useCalculatorStore } from '../../store/calculatorStore';

const OPTIONS: Array<{ id: Language; label: string }> = [
  { id: 'vi', label: 'VI' },
  { id: 'en', label: 'EN' },
];

export function LanguageSwitcher() {
  const language = useCalculatorStore((s) => s.settings.language);
  const setLanguage = useCalculatorStore((s) => s.setLanguage);

  useEffect(() => {
    document.documentElement.lang = language === 'vi' ? 'vi' : 'en';
  }, [language]);

  return (
    <div
      className="langSwitch"
      role="group"
      aria-label={t(language, 'selectLanguage')}
    >
      {OPTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`langSwitchBtn${language === id ? ' langSwitchBtnActive' : ''}`}
          aria-pressed={language === id}
          onClick={() => setLanguage(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
