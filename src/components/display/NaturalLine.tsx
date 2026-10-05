import lcdStyles from '../../styles/lcd.module.css';
import { segmentNaturalLine, type NaturalSegment } from '../../core/naturalDisplay';

function Segment({ part }: { part: NaturalSegment }) {
  if (part.kind === 'text') {
    return <span>{part.text}</span>;
  }
  if (part.kind === 'mixed') {
    return (
      <span className={lcdStyles.mixedFrac}>
        {part.whole !== 0 && <span className={lcdStyles.mixedWhole}>{part.whole}</span>}
        <span className={lcdStyles.fracStack}>
          <span className={lcdStyles.fracNum}>{part.num}</span>
          <span className={lcdStyles.fracBar} />
          <span className={lcdStyles.fracDen}>{part.den}</span>
        </span>
      </span>
    );
  }
  return (
    <span className={lcdStyles.fracStack}>
      <span className={lcdStyles.fracNum}>{part.num}</span>
      <span className={lcdStyles.fracBar} />
      <span className={lcdStyles.fracDen}>{part.den}</span>
    </span>
  );
}

export function NaturalLine({ text, className }: { text: string; className?: string }) {
  const parts = segmentNaturalLine(text);
  return (
    <span className={[lcdStyles.naturalLine, className ?? ''].filter(Boolean).join(' ')}>
      {parts.map((part, i) => (
        <Segment key={i} part={part} />
      ))}
    </span>
  );
}
