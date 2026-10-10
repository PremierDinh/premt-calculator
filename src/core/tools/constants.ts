export interface PhysicalConstant {
  symbol: string;
  vi: string;
  en: string;
  value: number;
  unit: string;
}

/** CODATA 2018 values. */
export const PHYSICAL_CONSTANTS: PhysicalConstant[] = [
  { symbol: 'c', vi: 'Tốc độ ánh sáng trong chân không', en: 'Speed of light in vacuum', value: 299792458, unit: 'm/s' },
  { symbol: 'h', vi: 'Hằng số Planck', en: 'Planck constant', value: 6.62607015e-34, unit: 'J·s' },
  { symbol: 'ħ', vi: 'Hằng số Planck rút gọn', en: 'Reduced Planck constant', value: 1.054571817e-34, unit: 'J·s' },
  { symbol: 'G', vi: 'Hằng số hấp dẫn', en: 'Gravitational constant', value: 6.6743e-11, unit: 'm³/(kg·s²)' },
  { symbol: 'g', vi: 'Gia tốc trọng trường chuẩn', en: 'Standard gravity', value: 9.80665, unit: 'm/s²' },
  { symbol: 'e', vi: 'Điện tích nguyên tố', en: 'Elementary charge', value: 1.602176634e-19, unit: 'C' },
  { symbol: 'mₑ', vi: 'Khối lượng electron', en: 'Electron mass', value: 9.1093837015e-31, unit: 'kg' },
  { symbol: 'mₚ', vi: 'Khối lượng proton', en: 'Proton mass', value: 1.67262192369e-27, unit: 'kg' },
  { symbol: 'mₙ', vi: 'Khối lượng neutron', en: 'Neutron mass', value: 1.67492749804e-27, unit: 'kg' },
  { symbol: 'u', vi: 'Đơn vị khối lượng nguyên tử', en: 'Atomic mass unit', value: 1.6605390666e-27, unit: 'kg' },
  { symbol: 'Nₐ', vi: 'Hằng số Avogadro', en: 'Avogadro constant', value: 6.02214076e23, unit: 'mol⁻¹' },
  { symbol: 'k', vi: 'Hằng số Boltzmann', en: 'Boltzmann constant', value: 1.380649e-23, unit: 'J/K' },
  { symbol: 'R', vi: 'Hằng số khí lý tưởng', en: 'Molar gas constant', value: 8.314462618, unit: 'J/(mol·K)' },
  { symbol: 'F', vi: 'Hằng số Faraday', en: 'Faraday constant', value: 96485.33212, unit: 'C/mol' },
  { symbol: 'ε₀', vi: 'Hằng số điện môi chân không', en: 'Vacuum permittivity', value: 8.8541878128e-12, unit: 'F/m' },
  { symbol: 'μ₀', vi: 'Độ từ thẩm chân không', en: 'Vacuum permeability', value: 1.25663706212e-6, unit: 'N/A²' },
  { symbol: 'σ', vi: 'Hằng số Stefan–Boltzmann', en: 'Stefan–Boltzmann constant', value: 5.670374419e-8, unit: 'W/(m²·K⁴)' },
  { symbol: 'R∞', vi: 'Hằng số Rydberg', en: 'Rydberg constant', value: 10973731.56816, unit: 'm⁻¹' },
  { symbol: 'a₀', vi: 'Bán kính Bohr', en: 'Bohr radius', value: 5.29177210903e-11, unit: 'm' },
  { symbol: 'atm', vi: 'Áp suất khí quyển chuẩn', en: 'Standard atmosphere', value: 101325, unit: 'Pa' },
];

/** Expression text the calculator parser accepts, e.g. 6.62607015e-34 → (6.62607015*10^(-34)). */
export function numberToExpression(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e10 || abs < 1e-4)) {
    const [mantissa, exp] = value.toExponential().split('e');
    return `(${mantissa}*10^(${Number(exp)}))`;
  }
  const text = String(Number(value.toPrecision(12)));
  return value < 0 ? `(${text})` : text;
}
