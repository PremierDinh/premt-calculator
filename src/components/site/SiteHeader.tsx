import { t } from '../../i18n/strings';
import { useCalculatorStore } from '../../store/calculatorStore';
import { LanguageSwitcher } from './LanguageSwitcher';

export function SiteHeader() {
  const language = useCalculatorStore((s) => s.settings.language);

  return (
    <header className="header">
      <div className="headerInner">
        <a href="#top" className="logo">
          <img src={`${import.meta.env.BASE_URL}premt-logo.jpg`} alt="PREM" className="logoImg" />
          <span className="logoText">
            <span className="logoMark">{t(language, 'brand')}</span>
            <span className="logoSub">{t(language, 'model')}</span>
          </span>
        </a>
        <div className="headerActions">
          <nav className="nav" aria-label={t(language, 'menu')}>
            <a href="#modes">{t(language, 'modes')}</a>
            <a href="#simulator">{t(language, 'simulator')}</a>
            <a href="#guide">{t(language, 'guide')}</a>
          </nav>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
