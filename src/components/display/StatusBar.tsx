import lcdStyles from '../../styles/lcd.module.css';
import { useCalculatorStore } from '../../store/calculatorStore';

export function StatusBar() {
  const shiftActive = useCalculatorStore((s) => s.shiftActive);
  const alphaActive = useCalculatorStore((s) => s.alphaActive);
  const power = useCalculatorStore((s) => s.power);
  const angleUnit = useCalculatorStore((s) => s.settings.angleUnit);
  const language = useCalculatorStore((s) => s.settings.language);
  const numberFormat = useCalculatorStore((s) => s.settings.numberFormat);
  const insertMode = useCalculatorStore((s) => s.modeState.calculate.insertMode);

  if (power === 'off') return null;

  return (
    <div className={lcdStyles.statusBar}>
      <span className={shiftActive || alphaActive ? lcdStyles.shiftIndicator : undefined}>
        {shiftActive ? 'S ' : ''}{alphaActive ? 'A ' : ''}{insertMode ? 'INS' : ''}
      </span>
      <span>{angleUnit.toUpperCase()} · {numberFormat} · {language.toUpperCase()}</span>
      <div className={lcdStyles.battery}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={lcdStyles.batteryBar} />
        ))}
      </div>
    </div>
  );
}
