import { useId } from 'react';
import { LOGO } from './logo-paths';

function Grad({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" style={{ stopColor: 'var(--gradient-start)' }} />
        <stop offset=".5" style={{ stopColor: 'var(--gradient-mid)' }} />
        <stop offset="1" style={{ stopColor: 'var(--gradient-end)' }} />
      </linearGradient>
    </defs>
  );
}

/** One-line lockup by default; `stacked` for square spaces; `mono` for one colour. `size` = height in px. */
export function Logo({ size = 28, stacked = false, mono = false, className }: { size?: number; stacked?: boolean; mono?: boolean; className?: string }) {
  const id = 'iq' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const k = stacked ? LOGO.block : LOGO.line;
  return (
    <svg role="img" aria-label="360IQ" className={className} height={size} width={(size * k.w) / k.h} viewBox={`0 0 ${k.w} ${k.h}`} style={{ color: 'var(--text-primary)', overflow: 'visible' }}>
      {!mono && <Grad id={id} />}
      <path d={k.a} fill="currentColor" />
      <path d={k.b} style={{ fill: mono ? 'currentColor' : `url(#${id})` }} />
    </svg>
  );
}

/** The AI glyph: the Q from the logo, filled. Use wherever 360IQ's AI wrote something. */
export function IqGlyph({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d={LOGO.q} fill="currentColor" />
    </svg>
  );
}
