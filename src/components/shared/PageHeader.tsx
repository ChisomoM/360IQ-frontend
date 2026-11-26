import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** One per page: breadcrumb, title (heading-l), actions. At most one primary button. */
export function PageHeader({ crumb, title, description, actions, className }: {
  crumb?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {crumb && <p className="mb-1 text-xs text-text-muted">{crumb}</p>}
        <h1 className="text-[2rem] leading-[2.43rem] font-semibold tracking-[-0.02em] text-text-primary">{title}</h1>
        {description && <p className="mt-1 max-w-[75ch] text-sm text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
