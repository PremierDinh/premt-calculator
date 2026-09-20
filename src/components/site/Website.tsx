import { CalculatorShell } from '../CalculatorShell';
import { GuidePanel } from './GuidePanel';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { t } from '../../i18n/strings';
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
              </div>
            </div>
            <aside className="heroCard">
              <h2>{t(language, 'simulator')}</h2>
              <ol>
                <li>{language === 'vi' ? 'HOME mở 13 ứng dụng. D-pad chọn, OK/EXE vào.' : 'HOME shows 13 apps. Use the D-pad, then OK/EXE.'}</li>
                <li>{language === 'vi' ? 'SHIFT mở lớp chức năng xanh. VARIABLE rồi 4–6 / 1–3 / 0 . ×10ˣ gọi A–F, x, y, z.' : 'SHIFT opens the blue legends. VARIABLE then 4–6 / 1–3 / 0 . ×10ˣ recalls A–F, x, y, z.'}</li>
                <li>{language === 'vi' ? 'CATALOG/TOOLS theo ngữ cảnh từng app.' : 'CATALOG and TOOLS are context-sensitive.'}</li>
                <li>{language === 'vi' ? 'SETTINGS: góc, định dạng, phân số, ngôn ngữ...' : 'SETTINGS covers angle, format, fractions, language and more.'}</li>
              </ol>
            </aside>
          </div>
        </section>

        <section className="section sectionAlt" id="modes">
          <div className="sectionInner">
            <h2>{t(language, 'modes')}</h2>
            <p className="sectionIntro">
              {language === 'vi'
                ? 'Mười ba ứng dụng độc lập trên màn hình Home, chuyển bằng HOME hoặc MENU.'
                : 'Thirteen independent apps on the Home screen. Switch with HOME or MENU.'}
            </p>
            <div className="featureGrid">
              {MODE_KEYS.map((key) => (
                <button
                  type="button"
                  className="featureCard featureCardButton"
                  key={key}
                  onClick={() => openMode(key)}
                >
                  <h3>{t(language, key)}</h3>
                  <p>{appBlurb(language, key)}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="simulator">
          <div className="sectionInner">
            <h2>{t(language, 'simulator')}</h2>
            <p className="sectionIntro">
              {language === 'vi'
                ? 'Bấm vào máy tính để dùng chuột, cảm ứng hoặc bàn phím. Enter = EXE, Escape = AC, mũi tên = D-pad.'
                : 'Click the calculator to use mouse, touch or a physical keyboard. Enter = EXE, Escape = AC, arrows = D-pad.'}
            </p>
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

function appBlurb(lang: 'vi' | 'en', key: typeof MODE_KEYS[number]): string {
  const vi: Record<typeof MODE_KEYS[number], string> = {
    calculate: 'Biểu thức, phân số, lượng giác, tích phân, đạo hàm, GCD/LCM, nPr/nCr, Ans/PreAns.',
    statistics: '1 biến và 2 biến: trung bình, σ, tứ phân vị, hồi quy.',
    distribution: 'Normal, Binomial, Poisson — PD, CD, Inv.',
    spreadsheet: 'Lưới 45×5, công thức =A1+B1 và SUM.',
    table: 'Bảng f(x) với Start, End, Step.',
    equation: 'Bậc 2, hệ 2 ẩn, nghiệm số Newton.',
    inequality: 'Bất phương trình tuyến tính và bậc 2.',
    complex: 'a+bi, modulus, argument, dạng cực.',
    basen: 'DEC/HEX/OCT/BIN và phép tính nguyên.',
    matrix: 'Cộng, nhân, det, nghịch đảo, chuyển vị. MatA–C.',
    vector: 'Cộng, dot, cross, độ dài. VctA–C.',
    ratio: 'Giải A:B = C:X.',
    mathbox: 'Xúc xắc, đồng xu, số ngẫu nhiên, GCD, LCM.',
  };
  const en: Record<typeof MODE_KEYS[number], string> = {
    calculate: 'Expressions, fractions, trig, integrals, derivatives, GCD/LCM, nPr/nCr, Ans/PreAns.',
    statistics: '1- and 2-variable stats: mean, σ, quartiles, regression.',
    distribution: 'Normal, Binomial, Poisson — PD, CD, Inv.',
    spreadsheet: '45×5 grid with =A1+B1 and SUM.',
    table: 'f(x) tables with Start, End, Step.',
    equation: 'Quadratic, 2-unknown systems, Newton solver.',
    inequality: 'Linear and quadratic inequalities.',
    complex: 'a+bi, modulus, argument, polar form.',
    basen: 'DEC/HEX/OCT/BIN integer arithmetic.',
    matrix: 'Add, multiply, det, inverse, transpose. MatA–C.',
    vector: 'Add, dot, cross, magnitude. VctA–C.',
    ratio: 'Solve A:B = C:X.',
    mathbox: 'Dice, coin, random integers, GCD, LCM.',
  };
  return lang === 'en' ? en[key] : vi[key];
}
