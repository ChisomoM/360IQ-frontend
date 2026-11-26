import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HeroArcs } from '@/components/brand/HeroArcs';
import { Logo } from '@/components/brand/Logo';

interface AuthShellProps {
  /** Mono line above the hero headline. */
  overline: string;
  /** One supporting sentence under the hero headline. */
  summary: string;
  title: string;
  description: string;
  children: ReactNode;
}

/** Sign-in layout: ink hero panel on large screens, the form on the page theme. */
export function AuthShell({ overline, summary, title, description, children }: AuthShellProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex min-h-dvh w-full bg-surface-0 text-text-primary">
      <section
        data-theme="ink"
        aria-label="About 360IQ"
        className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-center"
        style={{ background: 'var(--gradient-hero-ink)' }}
      >
        <HeroArcs />
        <div className="relative px-12 py-16 xl:px-20">
          <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-sky-text">{overline}</p>
          <p className="mt-6 text-[48px] font-semibold leading-none tracking-[-0.03em] text-text-primary xl:text-[64px]">
            Every deal,
            <span className="iq-grad-text block pb-1">one step ahead.</span>
          </p>
          <p className="mt-6 max-w-[520px] text-[18px] leading-[28px] text-text-secondary">{summary}</p>
        </div>
      </section>

      <main id="main" className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2">
        <motion.div
          className="w-full max-w-[420px]"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <Logo size={40} className="mb-8" />
          <div className="rounded-lg border border-line bg-surface-1 p-6 shadow-card sm:p-8">
            <h1 className="text-[2rem] font-semibold leading-[2.43rem] tracking-[-0.02em] text-text-primary">{title}</h1>
            <p className="mb-6 mt-1 text-sm text-text-secondary">{description}</p>
            {children}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
