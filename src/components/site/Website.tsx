import { CalculatorShell } from '../CalculatorShell';
import { GuidePanel } from './GuidePanel';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { LIVE_DEMO_URL, modeBlurb, t } from '../../i18n/strings';
import { useCalculatorStore } from '../../store/calculatorStore';
import type { ModeId } from '../../core/types';

const MODE_KEYS = [
  'calculate', 'statistics', 'distribution', 'spreadsheet', 'table', 'equation',
  'inequality', 'complex', 'basen', 'matrix', 'vector', 'ratio', 'mathbox',
] as const;

export function Website() {
  const language = useCalculatorStore((s) => s.settings.language);
  const navigateToMode = useCalculatorStore((s) => s.navigateToMode);

  const openMode = (mode: ModeId) => {
    navigateToMode(mode);
    document.querySelector<HTMLElement>('[data-calculator-shell]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.querySelector<HTMLElement>('[data-calculator-shell]')?.focus();
  };

  const heroTips = ['heroTip1', 'heroTip2', 'heroTip3', 'heroTip4'] as const;

  return (
    <div className="site" id="top">
      <SiteHeader />

      <main>
        <section className="hero">
          <div className="sectionInner heroInner">
            <div>
              <div className="heroBrand">
                <img src="/premt-logo.jpg" alt="PREM" className="heroLogo" />
                <p className="kicker">{t(language, 'brand')}</p>
              </div>
              <h1>{t(language, 'siteTitle')}</h1>
              <p className="lede">{t(language, 'siteLead')}</p>
              <div className="heroActions">
                <a className="btn btnPrimary" href="#simulator">{t(language, 'openSim')}</a>
                <a className="btn btnGhost" href="#guide">{t(language, 'seeGuide')}</a>
                <a className="btn btnGhost" href={LIVE_DEMO_URL} target="_blank" rel="noreferrer">
                  {t(language, 'liveDemo')}
                </a>
              </div>
            </div>
            <aside className="heroCard">
              <h2>{t(language, 'simulator')}</h2>
              <ol>
                {heroTips.map((key) => (
                  <li key={key}>{t(language, key)}</li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        <section className="section sectionAlt" id="modes">
          <div className="sectionInner">
            <h2>{t(language, 'modes')}</h2>
            <p className="sectionIntro">{t(language, 'modesIntro')}</p>
            <div className="featureGrid">
              {MODE_KEYS.map((key) => (
                <button
                  type="button"
                  className="featureCard featureCardButton"
                  key={key}
                  onClick={() => openMode(key)}
                >
                  <h3>{t(language, key)}</h3>
                  <p>{modeBlurb(language, key)}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="simulator">
          <div className="sectionInner">
            <h2>{t(language, 'simulator')}</h2>
            <p className="sectionIntro">{t(language, 'simIntro')}</p>
            <div className="simulatorLayout">
              <CalculatorShell />
              <GuidePanel language={language} />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
