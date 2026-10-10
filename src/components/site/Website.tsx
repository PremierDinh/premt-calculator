import { CalculatorShell } from '../CalculatorShell';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { ToolsPanel } from './ToolsPanel';
import { modeBlurb, t } from '../../i18n/strings';
import { useCalculatorStore } from '../../store/calculatorStore';
import type { ModeId } from '../../core/types';

const MODE_KEYS = [
  'calculate', 'statistics', 'distribution', 'spreadsheet', 'table', 'equation',
  'inequality', 'complex', 'basen', 'matrix', 'vector', 'ratio', 'mathbox',
] as const;

const EXTRA_TIPS = {
  vi: [
    'Bấm SHIFT hoặc ALPHA: các phím có chức năng phụ sẽ sáng viền và hiện nhãn, phím không dùng được sẽ mờ đi.',
    'Bảng Công cụ → Giải: gõ phương trình như x^3-6x^2+11x=6 để tìm mọi nghiệm, tính tích phân hoặc đạo hàm, rồi Chèn kết quả vào máy.',
    'Muốn luôn thấy nhãn phụ trên phím: SETTINGS → Nhãn phím phụ → Luôn hiện.',
  ],
  en: [
    'Press SHIFT or ALPHA: keys with a second function get outlined and labelled, unused keys fade out.',
    'Tools → Solve: type an equation like x^3-6x^2+11x=6 to find every root, integrate or differentiate, then Insert the result.',
    'To always see the small key legends: SETTINGS → Key legends → Always.',
  ],
};

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
        <section className="intro" id="simulator">
          <div className="sectionInner">
            <div className="introHead">
              <h1>{t(language, 'siteTitle')}</h1>
              <p className="lede">{t(language, 'siteLead')}</p>
            </div>
            <div className="simulatorLayout">
              <CalculatorShell />
              <div className="simSide">
                <ToolsPanel language={language} />
              </div>
            </div>
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
            <details className="tipsBox" id="guide">
              <summary>{language === 'vi' ? 'Mẹo sử dụng' : 'Tips'}</summary>
              <ol>
                {heroTips.map((key) => (
                  <li key={key}>{t(language, key)}</li>
                ))}
                {EXTRA_TIPS[language].map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ol>
            </details>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
