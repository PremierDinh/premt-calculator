import type { ModeId } from '../../core/types';
import { t } from '../../i18n/strings';
import { useCalculatorStore } from '../../store/calculatorStore';

type Language = 'vi' | 'en';

function focusCalculator() {
  const shell = document.querySelector<HTMLElement>('[data-calculator-shell]');
  shell?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  shell?.focus();
}

function GuideAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="guideAction" onClick={onClick}>
      {label}
    </button>
  );
}

function GuideCard({
  title,
  description,
  onOpen,
  actions,
}: {
  title: string;
  description: string;
  onOpen?: () => void;
  actions?: { label: string; mode: ModeId }[];
}) {
  const open = (fn: () => void) => {
    fn();
    focusCalculator();
  };

  if (actions?.length) {
    return (
      <article className="guideItem">
        <strong>{title}</strong>
        <p>{description}</p>
        <div className="guideActions">
          {actions.map((action) => (
            <GuideAction
              key={action.mode}
              label={action.label}
              onClick={() => open(() => useCalculatorStore.getState().navigateToMode(action.mode))}
            />
          ))}
        </div>
      </article>
    );
  }

  return (
    <button
      type="button"
      className="guideItem guideItemButton"
      onClick={() => onOpen && open(onOpen)}
    >
      <strong>{title}</strong>
      <p>{description}</p>
      <span className="guideHint">→</span>
    </button>
  );
}

export function GuidePanel({ language }: { language: Language }) {
  const navigateToMode = useCalculatorStore((s) => s.navigateToMode);
  const openSettings = useCalculatorStore((s) => s.openSettingsOverlay);

  return (
    <div className="guideList" id="guide">
      <GuideCard
        title={t(language, 'calculate')}
        description={
          language === 'vi'
            ? '2+3×4 EXE. ▲▼ duyệt lịch sử. VARIABLE rồi 4/5/6 lưu A/B/C.'
            : '2+3×4 EXE. ▲▼ browses history. VARIABLE then 4/5/6 stores A/B/C.'
        }
        onOpen={() => navigateToMode('calculate')}
      />
      <GuideCard
        title={`${t(language, 'equation')} / ${t(language, 'inequality')}`}
        description={
          language === 'vi'
            ? 'Nhập hệ số, EXE để nghiệm hoặc khoảng nghiệm.'
            : 'Enter coefficients, EXE for roots or solution sets.'
        }
        actions={[
          { label: t(language, 'equation'), mode: 'equation' },
          { label: t(language, 'inequality'), mode: 'inequality' },
        ]}
      />
      <GuideCard
        title={`${t(language, 'matrix')} / ${t(language, 'vector')}`}
        description={
          language === 'vi'
            ? 'Sửa MatA/VctA, FUNCTION chọn det, inv, dot, cross.'
            : 'Edit MatA/VctA, then FUNCTION for det, inv, dot, cross.'
        }
        actions={[
          { label: t(language, 'matrix'), mode: 'matrix' },
          { label: t(language, 'vector'), mode: 'vector' },
        ]}
      />
      <GuideCard
        title={`${t(language, 'complex')} / ${t(language, 'basen')}`}
        description={
          language === 'vi'
            ? 'Số phức a+bi / r∠θ. Base-N: DEC HEX OCT BIN.'
            : 'Complex a+bi / r∠θ. Base-N: DEC HEX OCT BIN.'
        }
        actions={[
          { label: t(language, 'complex'), mode: 'complex' },
          { label: t(language, 'basen'), mode: 'basen' },
        ]}
      />
      <GuideCard
        title={t(language, 'settings')}
        description={
          language === 'vi'
            ? 'MathI/MathO, Deg/Rad/Gra, Norm/Fix/Sci, dấu thập phân, tiếng Việt/Anh.'
            : 'MathI/MathO, Deg/Rad/Gra, Norm/Fix/Sci, decimal mark, Vietnamese/English.'
        }
        onOpen={() => openSettings()}
      />
    </div>
  );
}
