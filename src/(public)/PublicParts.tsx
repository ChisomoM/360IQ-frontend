import type { ReactNode } from 'react';
import { HeroArcs } from '@/components/brand/HeroArcs';
import { Logo } from '@/components/brand/Logo';
import { Check } from '@/components/icons';
import { cn } from '@/lib/utils';

/** Ink hero ground (both themes) with one centred card. Used by the sign-in style screens. */
export function HeroShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center gap-8 overflow-hidden px-4 py-10 sm:px-6">
      <div data-theme="ink" aria-hidden="true" className="absolute inset-0" style={{ background: 'var(--gradient-hero-ink)' }}>
        <HeroArcs />
      </div>
      <div data-theme="ink" className="relative">
        <Logo size={28} />
      </div>
      <div className="relative w-full max-w-lg text-text-primary">{children}</div>
    </main>
  );
}

/** Header bar for the standalone pages outside the app shell. */
export function PublicHeader({ actions }: { actions?: ReactNode }) {
  return (
    <header className="border-b border-line bg-surface-1">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo size={20} />
        {actions}
      </div>
    </header>
  );
}

/** Numbered steps. `current` starts at 0. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-start gap-2">
      {steps.map((label, i) => (
        <li key={label} aria-current={i === current ? 'step' : undefined} className="flex min-w-0 flex-1 flex-col gap-2">
          <span className={cn('h-1 rounded-pill', i <= current ? 'bg-signal' : 'bg-surface-2')} />
          <span className="flex items-center gap-2">
            <span
              className={cn(
                'grid h-6 w-6 shrink-0 place-items-center rounded-pill font-mono text-xs font-medium',
                i < current && 'bg-signal text-on-signal',
                i === current && 'bg-signal-tint text-signal-text',
                i > current && 'bg-surface-2 text-text-secondary',
              )}
            >
              {i < current ? <Check size={14} /> : i + 1}
            </span>
            <span className={cn('hidden min-w-0 text-[13px] sm:block', i === current ? 'font-semibold text-text-primary' : 'text-text-muted')}>{label}</span>
          </span>
          {i === current && <span className="sr-only">Current step: {label}</span>}
        </li>
      ))}
    </ol>
  );
}
