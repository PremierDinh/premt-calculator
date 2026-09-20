import { t } from '../../i18n/strings';
import { useCalculatorStore } from '../../store/calculatorStore';

export function SiteFooter() {
  const language = useCalculatorStore((s) => s.settings.language);
  return (
    <footer className="footer">
      <div className="footerInner">
        <p>{t(language, 'footerNote')}</p>
        <p className="footerBrand">
          <img src="/premt-logo.jpg" alt="" className="footerLogo" aria-hidden="true" />
          {t(language, 'brand')}
        </p>
      </div>
    </footer>
  );
}
