import type { Language } from '../core/settings';
import type { ModeId } from '../core/types';

const VI = {
  brand: 'premt calculator',
  model: 'Mô phỏng máy tính khoa học',
  classLine: 'PREMT SERIES',
  home: 'Trang chủ',
  settings: 'Cài đặt',
  catalog: 'Danh mục',
  tools: 'Công cụ',
  menu: 'Menu',
  exit: 'Thoát',
  calculate: 'Tính toán',
  statistics: 'Thống kê',
  distribution: 'Phân phối',
  spreadsheet: 'Bảng tính',
  table: 'Bảng hàm',
  equation: 'Phương trình',
  inequality: 'Bất phương trình',
  complex: 'Số phức',
  basen: 'Cơ số N',
  matrix: 'Ma trận',
  vector: 'Vectơ',
  ratio: 'Tỉ lệ',
  mathbox: 'Hộp toán',
  angle: 'Góc',
  format: 'Định dạng',
  language: 'Ngôn ngữ',
  shift: 'SHIFT',
  alpha: 'ALPHA',
  history: 'Lịch sử',
  sto: 'Lưu biến',
  rcl: 'Gọi biến',
  siteTitle: 'Mô phỏng máy tính khoa học trên trình duyệt',
  siteLead: 'premt calculator — máy tính ảo dành cho học tập: 13 ứng dụng, cài đặt đầy đủ, bàn phím vật lý và cảm ứng. Không cần cài đặt.',
  openSim: 'Mở mô phỏng',
  seeGuide: 'Xem hướng dẫn',
  modes: 'Ứng dụng',
  simulator: 'Mô phỏng',
  guide: 'Hướng dẫn',
  footerNote: 'premt calculator — mô phỏng giáo dục độc lập.',
  selectLanguage: 'Chọn ngôn ngữ',
  liveDemo: 'Demo trực tuyến',
  modesIntro: 'Mười ba ứng dụng độc lập trên màn hình Home, chuyển bằng HOME hoặc MENU.',
  simIntro: 'Bấm vào máy tính để dùng chuột, cảm ứng hoặc bàn phím. Enter = EXE, Escape = AC, mũi tên = D-pad.',
  heroTip1: 'HOME mở 13 ứng dụng. D-pad chọn, OK/EXE vào.',
  heroTip2: 'SHIFT mở lớp chức năng xanh. VARIABLE rồi 4–6 / 1–3 / 0 . ×10ˣ gọi A–F, x, y, z.',
  heroTip3: 'CATALOG/TOOLS theo ngữ cảnh từng app.',
  heroTip4: 'SETTINGS: góc, định dạng, phân số, ngôn ngữ...',
};

const EN: typeof VI = {
  brand: 'premt calculator',
  model: 'Scientific calculator simulator',
  classLine: 'PREMT SERIES',
  home: 'Home',
  settings: 'Settings',
  catalog: 'Catalog',
  tools: 'Tools',
  menu: 'Menu',
  exit: 'Exit',
  calculate: 'Calculate',
  statistics: 'Statistics',
  distribution: 'Distribution',
  spreadsheet: 'Spreadsheet',
  table: 'Table',
  equation: 'Equation',
  inequality: 'Inequality',
  complex: 'Complex',
  basen: 'Base-N',
  matrix: 'Matrix',
  vector: 'Vector',
  ratio: 'Ratio',
  mathbox: 'Math Box',
  angle: 'Angle',
  format: 'Format',
  language: 'Language',
  shift: 'SHIFT',
  alpha: 'ALPHA',
  history: 'History',
  sto: 'Store',
  rcl: 'Recall',
  siteTitle: 'Browser scientific calculator simulator',
  siteLead: 'premt calculator — an educational simulator with 13 apps, full settings, mouse, touch and keyboard input. No install required.',
  openSim: 'Open simulator',
  seeGuide: 'See guide',
  modes: 'Applications',
  simulator: 'Simulator',
  guide: 'Guide',
  footerNote: 'premt calculator — independent educational simulator.',
  selectLanguage: 'Select language',
  liveDemo: 'Live demo',
  modesIntro: 'Thirteen independent apps on the Home screen. Switch with HOME or MENU.',
  simIntro: 'Click the calculator to use mouse, touch or a physical keyboard. Enter = EXE, Escape = AC, arrows = D-pad.',
  heroTip1: 'HOME shows 13 apps. Use the D-pad, then OK/EXE.',
  heroTip2: 'SHIFT opens the blue legends. VARIABLE then 4–6 / 1–3 / 0 . ×10ˣ recalls A–F, x, y, z.',
  heroTip3: 'CATALOG and TOOLS are context-sensitive.',
  heroTip4: 'SETTINGS covers angle, format, fractions, language and more.',
};

export type I18nKey = keyof typeof VI;

export function t(lang: Language, key: I18nKey): string {
  return (lang === 'en' ? EN : VI)[key];
}

export function modeLabel(lang: Language, id: ModeId): string {
  if (id === 'home') return t(lang, 'home');
  return t(lang, id as I18nKey);
}

const SETTING_LABELS_VI: Record<string, string> = {
  inputOutput: 'Nhập/Xuất',
  angleUnit: 'Góc',
  numberFormat: 'Định dạng số',
  fixDigits: 'Số chữ số Fix',
  sciDigits: 'Số chữ số Sci',
  engineerSymbol: 'Ký hiệu ENG',
  fractionForm: 'Phân số',
  complexForm: 'Số phức',
  decimalMark: 'Dấu thập phân',
  digitSeparator: 'Phân cách',
  contrast: 'Độ tương phản',
  autoPowerOffMin: 'Tự tắt (phút)',
  language: 'Ngôn ngữ',
};

const SETTING_LABELS_EN: Record<string, string> = {
  inputOutput: 'Input/Output',
  angleUnit: 'Angle',
  numberFormat: 'Number format',
  fixDigits: 'Fix digits',
  sciDigits: 'Sci digits',
  engineerSymbol: 'ENG symbol',
  fractionForm: 'Fraction',
  complexForm: 'Complex',
  decimalMark: 'Decimal mark',
  digitSeparator: 'Separator',
  contrast: 'Contrast',
  autoPowerOffMin: 'Auto off (min)',
  language: 'Language',
};

export function settingLabel(lang: Language, key: string): string {
  const map = lang === 'en' ? SETTING_LABELS_EN : SETTING_LABELS_VI;
  return map[key] ?? key;
}

const MODE_BLURBS_VI: Record<Exclude<ModeId, 'home'>, string> = {
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

const MODE_BLURBS_EN: Record<Exclude<ModeId, 'home'>, string> = {
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

export function modeBlurb(lang: Language, id: Exclude<ModeId, 'home'>): string {
  return (lang === 'en' ? MODE_BLURBS_EN : MODE_BLURBS_VI)[id];
}

export const LIVE_DEMO_URL = 'https://premierdinh.github.io/premt-calculator/';
