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
