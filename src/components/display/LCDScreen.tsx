import lcdStyles from '../../styles/lcd.module.css';
import { useCalculatorStore } from '../../store/calculatorStore';
import { StatusBar } from './StatusBar';
import { HomeMenu } from './HomeMenu';

export function LCDScreen() {
  const display = useCalculatorStore((s) => s.display);
  const power = useCalculatorStore((s) => s.power);
  const contrast = useCalculatorStore((s) => s.settings.contrast);

  const isOff = power === 'off';
  const shade = 0.55 + contrast * 0.08;

  return (
    <div
      className={`${lcdStyles.lcd} ${isOff ? lcdStyles.lcdOff : ''}`}
      style={isOff ? undefined : { filter: `contrast(${shade})` }}
    >
      {!isOff && <StatusBar />}
      <div className={lcdStyles.content}>
        {display.showHome && display.menuItems ? (
          <HomeMenu
            items={display.menuItems}
            selectedIndex={display.selectedMenuIndex ?? 0}
          />
        ) : (
          display.lines.map((line, i) => (
            <div
              key={i}
              className={[
                lcdStyles.line,
                line.align === 'right' ? lcdStyles.lineRight : '',
                line.size === 'small' ? lcdStyles.lineSmall : '',
                line.size === 'large' ? lcdStyles.lineLarge : '',
              ].filter(Boolean).join(' ')}
            >
              {line.text}
            </div>
          ))
        )}

        {display.overlay === 'qr' && display.qrImageDataUrl && (
          <img
            src={display.qrImageDataUrl}
            alt="QR code"
            className={lcdStyles.qrImage}
          />
        )}

        {display.gridData && (
          <div className={lcdStyles.gridPreview}>
            {display.gridData.map((row, ri) => (
              <div key={ri} className={lcdStyles.gridRow}>
                {row.map((cell, ci) => {
                  const hl = display.highlightCell;
                  const isHl = hl && ri === (hl.row % 4) && ci === hl.col;
                  return (
                    <div
                      key={ci}
                      className={`${lcdStyles.gridCell} ${isHl ? lcdStyles.gridCellHighlight : ''}`}
                    >
                      {cell}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
