import lcdStyles from '../../styles/lcd.module.css';
import { useCalculatorStore } from '../../store/calculatorStore';

export function StatusBar() {
  const shiftActive = useCalculatorStore((s) => s.shiftActive);
  const alphaActive = useCalculatorStore((s) => s.alphaActive);
  const power = useCalculatorStore((s) => s.power);
  const angleUnit = useCalculatorStore((s) => s.settings.angleUnit);
  const language = useCalculatorStore((s) => s.settings.language);
  const numberFormat = useCalculatorStore((s) => s.settings.numberFormat);
  const fractionOutput = useCalculatorStore((s) => s.settings.fractionOutput);
  const fractionForm = useCalculatorStore((s) => s.settings.fractionForm);
  const inputOutput = useCalculatorStore((s) => s.settings.inputOutput);
  const insertMode = useCalculatorStore((s) => s.modeState.calculate.insertMode);

  if (power === 'off') return null;

  const mathTag = inputOutput.startsWith('MathI') ? 'MATH' : 'LINE';
  const formatTag = numberFormat !== 'norm' ? numberFormat.toUpperCase() : '';
  const fracTag = fractionOutput ? 'F↔D' : 'D';
  const mixedTag = fractionForm === 'mixed' ? 'ab/c' : '';

  return (
    <div className={lcdStyles.statusBar}>
      <span className={shiftActive || alphaActive ? lcdStyles.shiftIndicator : undefined}>
        {shiftActive ? 'S ' : ''}{alphaActive ? 'A ' : ''}{insertMode ? 'INS ' : ''}
        {mathTag}{mixedTag ? ` ${mixedTag}` : ''}
      </span>
      <span>
        {angleUnit.toUpperCase()}{formatTag ? ` · ${formatTag}` : ''} · {fracTag} · {language.toUpperCase()}
      </span>
      <div className={lcdStyles.battery}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={lcdStyles.batteryBar} />
        ))}
      </div>
    </div>
  );
}
