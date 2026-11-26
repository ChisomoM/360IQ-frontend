import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Card with optional eyebrow, title, actions and body. `tone="ai"` marks AI content. `padded={false}` for tables. */
export function SectionCard({ eyebrow, title, actions, children, tone = 'default', padded = true, className, bodyClassName }: {
  eyebrow?: ReactNode
  title?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  tone?: 'default' | 'ai'
  padded?: boolean
  className?: string
  bodyClassName?: string
}) {
  const hasHeader = eyebrow || title || actions
  return (
    <section
      className={cn(
        'min-w-0 rounded-lg shadow-card',
        tone === 'ai' ? 'bg-signal-tint iq-grad-border [--surface-1:var(--signal-tint)]' : 'bg-surface-1 border border-line',
        !padded && 'overflow-hidden',
        className,
      )}
    >
      {hasHeader && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-6 pt-6">
          <div className="min-w-0">
            {eyebrow && <p className="text-xs font-semibold uppercase tracking-[.04em] text-text-muted">{eyebrow}</p>}
            {title && <h2 className="text-base font-semibold text-text-primary">{title}</h2>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(padded ? 'p-6' : hasHeader && 'pt-4', bodyClassName)}>{children}</div>
    </section>
  )
}
