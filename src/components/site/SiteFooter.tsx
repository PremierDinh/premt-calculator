import { LIVE_DEMO_URL, t } from '../../i18n/strings';
import { useCalculatorStore } from '../../store/calculatorStore';

export function SiteFooter() {
  const language = useCalculatorStore((s) => s.settings.language);
  return (
    <footer className="footer">
      <div className="footerInner">
        <p>{t(language, 'footerNote')}</p>
        <p className="footerBrand">
          <img src={`${import.meta.env.BASE_URL}premt-logo.jpg`} alt="" className="footerLogo" aria-hidden="true" />
          {t(language, 'brand')}
        </p>
        <p>
          <a href={LIVE_DEMO_URL} target="_blank" rel="noreferrer">
            {t(language, 'liveDemo')}
          </a>
        </p>
      </div>
    </footer>
  );
}
