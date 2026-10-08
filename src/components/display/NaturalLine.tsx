import lcdStyles from '../../styles/lcd.module.css';
import { CURSOR_MARK, segmentNaturalLine, type NaturalSegment } from '../../core/naturalDisplay';

function isBlank(parts: NaturalSegment[]): boolean {
  return parts.every((p) => p.kind === 'text' && p.text.replaceAll(CURSOR_MARK, '') === '');
}

function Text({ text }: { text: string }) {
  if (!text.includes(CURSOR_MARK)) return <span>{text}</span>;
  const pieces = text.split(CURSOR_MARK);
  return (
    <>
      {pieces.map((piece, i) => (
        <span key={i}>
          {i > 0 && <span className={lcdStyles.cursor} aria-hidden="true" />}
          {piece}
        </span>
      ))}
    </>
  );
}

/** Renders a slot (numerator, denominator, radicand); empty slots show a placeholder box. */
function Slot({ parts }: { parts: NaturalSegment[] }) {
  if (isBlank(parts)) {
    return (
      <>
        <Segments parts={parts} />
        <span className={lcdStyles.placeholder}>□</span>
      </>
    );
  }
  return <Segments parts={parts} />;
}

function Segments({ parts }: { parts: NaturalSegment[] }) {
  return (
    <>
      {parts.map((part, i) => (
        <Segment key={i} part={part} />
      ))}
    </>
  );
}

function Fraction({ num, den }: { num: NaturalSegment[]; den: NaturalSegment[] }) {
  return (
    <span className={lcdStyles.fracStack}>
      <span className={lcdStyles.fracNum}><Slot parts={num} /></span>
      <span className={lcdStyles.fracBar} />
      <span className={lcdStyles.fracDen}><Slot parts={den} /></span>
    </span>
  );
}

function Segment({ part }: { part: NaturalSegment }) {
  switch (part.kind) {
    case 'text':
      return <Text text={part.text} />;
    case 'frac':
      return <Fraction num={part.num} den={part.den} />;
    case 'mixed':
      return (
        <span className={lcdStyles.mixedFrac}>
          {part.whole !== '0' && <span className={lcdStyles.mixedWhole}>{part.whole}</span>}
          <Fraction num={part.num} den={part.den} />
        </span>
      );
    case 'sqrt':
      return (
        <span className={lcdStyles.radical}>
          <span className={lcdStyles.radicalSign}>√</span>
          <span className={lcdStyles.radicand}><Slot parts={part.body} /></span>
        </span>
      );
    case 'sup':
      return <span className={lcdStyles.sup}><Slot parts={part.body} /></span>;
  }
}

export function NaturalLine({ text, className }: { text: string; className?: string }) {
  return (
    <span className={[lcdStyles.naturalLine, className ?? ''].filter(Boolean).join(' ')}>
      <Segments parts={segmentNaturalLine(text)} />
    </span>
  );
}
