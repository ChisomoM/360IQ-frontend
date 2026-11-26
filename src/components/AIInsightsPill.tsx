import { Sparkles } from '@/components/icons';

interface AIInsightsPillProps {
  onClick: () => void;
}

/** Sends a card's data to Ask 360IQ. Marked as an AI surface. */
export function AIInsightsPill({ onClick }: AIInsightsPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill bg-signal-tint iq-grad-border [--surface-1:var(--signal-tint)] px-3 text-xs font-semibold text-signal-text transition-transform duration-150 active:scale-[0.98]"
    >
      <Sparkles size={14} />
      Ask 360IQ
    </button>
  );
}
