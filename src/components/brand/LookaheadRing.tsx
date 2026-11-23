import { cn } from '@/lib/utils';

type Status = 'signal' | 'caution' | 'risk' | 'positive';
const WINDOW: Record<Status, string> = { signal: 'var(--signal)', caution: 'var(--caution)', risk: 'var(--risk)', positive: 'var(--positive)' };

export function LookaheadRing({ elapsed = 0.6, window = 0.25, status = 'signal', size = 120, value, label, className }:
  { elapsed?: number; window?: number; status?: Status; size?: number; value?: string; label?: string; className?: string }) {
  const r = 42, c = 50, sw = size < 64 ? 12 : 9;
  const P = (t: number) => { const a = t * 2 * Math.PI; return [c + r * Math.sin(a), c - r * Math.cos(a)]; };
  const arc = (t0: number, t1: number) => {
    if (t1 - t0 <= 0) return '';
    const [x0, y0] = P(t0), [x1, y1] = P(Math.min(t1, 0.9999));
    return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${t1 - t0 > 0.5 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  };
  const w0 = 1 - window, [dx, dy] = P(Math.min(elapsed, 0.995));
  return (
    <figure className={cn('relative m-0 inline-grid place-items-center', className)} style={{ width: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <circle cx={c} cy={c} r={r} fill="none" strokeWidth={sw} style={{ stroke: 'var(--surface-2)' }} />
        <path d={arc(0, Math.min(elapsed, w0 - 0.012))} fill="none" strokeWidth={sw} style={{ stroke: 'var(--text-secondary)' }} />
        {window > 0 && <path d={arc(w0, 1)} fill="none" strokeWidth={sw} style={{ stroke: WINDOW[status] }} />}
        <circle cx={dx} cy={dy} r={sw * 0.78} strokeWidth={2.5} style={{ fill: 'var(--text-primary)', stroke: 'var(--surface-1)' }} />
      </svg>
      {(value || label) && size >= 96 && (
        <figcaption className="absolute inset-0 grid place-content-center text-center">
          {value && <strong className="text-[22px] leading-[26px] font-semibold tracking-[-0.02em]">{value}</strong>}
          {label && <span className="text-[11px] text-text-muted">{label}</span>}
        </figcaption>
      )}
    </figure>
  );
}
