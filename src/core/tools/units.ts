export interface UnitDef {
  id: string;
  label: string;
  /** Multiplier to the category's base unit. Ignored for temperature. */
  factor: number;
}

export interface UnitCategory {
  id: string;
  vi: string;
  en: string;
  units: UnitDef[];
}

const u = (id: string, label: string, factor: number): UnitDef => ({ id, label, factor });

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length', vi: 'Chiều dài', en: 'Length',
    units: [
      u('m', 'm', 1), u('km', 'km', 1e3), u('cm', 'cm', 1e-2), u('mm', 'mm', 1e-3), u('um', 'µm', 1e-6),
      u('nm', 'nm', 1e-9), u('in', 'inch', 0.0254), u('ft', 'ft', 0.3048), u('yd', 'yd', 0.9144),
      u('mi', 'mile', 1609.344), u('nmi', 'hải lý / nmi', 1852),
    ],
  },
  {
    id: 'area', vi: 'Diện tích', en: 'Area',
    units: [
      u('m2', 'm²', 1), u('km2', 'km²', 1e6), u('cm2', 'cm²', 1e-4), u('mm2', 'mm²', 1e-6),
      u('ha', 'ha', 1e4), u('a', 'a (are)', 100), u('acre', 'acre', 4046.8564224), u('ft2', 'ft²', 0.09290304),
    ],
  },
  {
    id: 'volume', vi: 'Thể tích', en: 'Volume',
    units: [
      u('m3', 'm³', 1), u('L', 'L', 1e-3), u('mL', 'mL', 1e-6), u('cm3', 'cm³', 1e-6), u('dm3', 'dm³', 1e-3),
      u('galUS', 'gal (US)', 0.003785411784), u('ft3', 'ft³', 0.028316846592),
    ],
  },
  {
    id: 'mass', vi: 'Khối lượng', en: 'Mass',
    units: [
      u('kg', 'kg', 1), u('g', 'g', 1e-3), u('mg', 'mg', 1e-6), u('t', 'tấn / t', 1e3),
      u('lb', 'lb', 0.45359237), u('oz', 'oz', 0.028349523125),
    ],
  },
  {
    id: 'time', vi: 'Thời gian', en: 'Time',
    units: [
      u('s', 's', 1), u('ms', 'ms', 1e-3), u('min', 'phút / min', 60), u('h', 'giờ / h', 3600),
      u('day', 'ngày / day', 86400), u('week', 'tuần / week', 604800), u('year', 'năm / yr (365 d)', 31536000),
    ],
  },
  {
    id: 'speed', vi: 'Tốc độ', en: 'Speed',
    units: [
      u('ms', 'm/s', 1), u('kmh', 'km/h', 1 / 3.6), u('mph', 'mph', 0.44704), u('kn', 'knot', 1852 / 3600),
      u('fts', 'ft/s', 0.3048),
    ],
  },
  {
    id: 'temperature', vi: 'Nhiệt độ', en: 'Temperature',
    units: [u('C', '°C', 1), u('F', '°F', 1), u('K', 'K', 1)],
  },
  {
    id: 'pressure', vi: 'Áp suất', en: 'Pressure',
    units: [
      u('Pa', 'Pa', 1), u('kPa', 'kPa', 1e3), u('MPa', 'MPa', 1e6), u('bar', 'bar', 1e5),
      u('atm', 'atm', 101325), u('mmHg', 'mmHg', 133.322387415), u('psi', 'psi', 6894.757293168),
    ],
  },
  {
    id: 'energy', vi: 'Năng lượng', en: 'Energy',
    units: [
      u('J', 'J', 1), u('kJ', 'kJ', 1e3), u('cal', 'cal', 4.184), u('kcal', 'kcal', 4184),
      u('Wh', 'Wh', 3600), u('kWh', 'kWh', 3.6e6), u('eV', 'eV', 1.602176634e-19),
    ],
  },
  {
    id: 'power', vi: 'Công suất', en: 'Power',
    units: [u('W', 'W', 1), u('kW', 'kW', 1e3), u('MW', 'MW', 1e6), u('hp', 'hp (mã lực)', 745.69987158227)],
  },
  {
    id: 'force', vi: 'Lực', en: 'Force',
    units: [u('N', 'N', 1), u('kN', 'kN', 1e3), u('kgf', 'kgf', 9.80665), u('lbf', 'lbf', 4.4482216152605), u('dyn', 'dyn', 1e-5)],
  },
  {
    id: 'angle', vi: 'Góc', en: 'Angle',
    units: [u('deg', '°', Math.PI / 180), u('rad', 'rad', 1), u('grad', 'grad', Math.PI / 200), u('rev', 'vòng / rev', 2 * Math.PI)],
  },
];

function toKelvin(value: number, from: string): number {
  if (from === 'C') return value + 273.15;
  if (from === 'F') return (value - 32) * 5 / 9 + 273.15;
  return value;
}

function fromKelvin(kelvin: number, to: string): number {
  if (to === 'C') return kelvin - 273.15;
  if (to === 'F') return (kelvin - 273.15) * 9 / 5 + 32;
  return kelvin;
}

export function convertUnit(value: number, categoryId: string, fromId: string, toId: string): number {
  const category = UNIT_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return NaN;
  if (categoryId === 'temperature') return fromKelvin(toKelvin(value, fromId), toId);
  const from = category.units.find((x) => x.id === fromId);
  const to = category.units.find((x) => x.id === toId);
  if (!from || !to) return NaN;
  return (value * from.factor) / to.factor;
}
