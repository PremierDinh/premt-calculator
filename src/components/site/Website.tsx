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

const FAQ = {
  vi: [
    ['premt calculator có miễn phí không?', 'Hoàn toàn miễn phí, không cần tài khoản. Mọi phép tính chạy ngay trên máy của bạn, không gửi dữ liệu lên máy chủ.'],
    ['Giải phương trình bậc cao hoặc phương trình chứa sin, eˣ thế nào?', 'Mở Công cụ → Giải → Phương trình, gõ ví dụ x^3-6x^2+11x=6 hoặc e^x=3x. Máy quét cả khoảng bạn chọn và liệt kê mọi nghiệm thực, kèm dạng chính xác như √3 khi có thể.'],
    ['Khảo sát hàm số có những gì?', 'Chế độ Khảo sát tìm nghiệm, cực đại, cực tiểu, điểm uốn và giao điểm với trục tung trong khoảng đã chọn, rồi vẽ đồ thị chỉ với một lần bấm.'],
    ['Có giải hệ phương trình và tính ma trận không?', 'Có. Công cụ → Thêm → Ma trận tính det, nghịch đảo, hạng, trị riêng, dạng bậc thang. Nhập ma trận cỡ n×(n+1) để giải hệ n ẩn.'],
    ['Lịch sử và biến nhớ có bị mất khi tải lại trang?', 'Không. Lịch sử (100 phép tính gần nhất), biến A–F, x, y, z và Ans được lưu trong trình duyệt. Bạn có thể sao chép hoặc tải lịch sử dạng CSV.'],
    ['DEG và RAD khác nhau thế nào?', 'DEG đo góc theo độ (vòng tròn = 360°), RAD theo radian (vòng tròn = 2π). Giải tích (đạo hàm, tích phân hàm lượng giác) nên dùng RAD. Trong tab Giải, bấm nhãn DEG/RAD để đổi nhanh.'],
    ['Dùng trên điện thoại được không?', 'Được. Giao diện tự co theo màn hình, bảng Công cụ trượt lên từ dưới khi bấm nút Công cụ trên bàn phím. Có thể "Thêm vào màn hình chính" để dùng như ứng dụng.'],
  ],
  en: [
    ['Is premt calculator free?', 'Completely free, no account needed. Every calculation runs on your device; nothing is sent to a server.'],
    ['How do I solve higher-degree or transcendental equations?', 'Open Tools → Solve → Equation and type e.g. x^3-6x^2+11x=6 or e^x=3x. The solver scans your range and lists every real root, with exact forms like √3 when possible.'],
    ['What does function analysis show?', 'Analyze mode finds roots, local maxima and minima, inflection points and the y-intercept in the chosen range, then plots it in one tap.'],
    ['Can it solve systems and do matrix algebra?', 'Yes. Tools → More → Matrix gives det, inverse, rank, eigenvalues and RREF. Enter an n×(n+1) matrix to solve a system of n unknowns.'],
    ['Do history and variables survive a reload?', 'Yes. The last 100 calculations, variables A–F, x, y, z and Ans are stored in your browser. You can copy history or download it as CSV.'],
    ['What is the difference between DEG and RAD?', 'DEG measures angles in degrees (360° per turn), RAD in radians (2π per turn). Use RAD for calculus with trig functions. In the Solve tab, tap the DEG/RAD badge to switch.'],
    ['Does it work on phones?', 'Yes. The layout adapts to the screen and the Tools sheet slides up from the Tools key. Use "Add to Home screen" to run it like an app.'],
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

        <section className="section" id="faq">
          <div className="sectionInner">
            <h2>{language === 'vi' ? 'Câu hỏi thường gặp' : 'FAQ'}</h2>
            <div className="faqList">
              {FAQ[language].map(([q, a]) => (
                <details className="faqItem" key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
