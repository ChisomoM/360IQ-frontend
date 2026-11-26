import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Label, value with unit, delta or hint. Rows of 3 or 4:
 * `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4`.
 * `unit` is the currency code shown before the value. Pass `onClick` to make the tile a button.
 */
export function KpiTile({ label, value, unit, hint, icon, onClick, className }: {
  label: ReactNode
  value: ReactNode
  unit?: string
  hint?: ReactNode
  icon?: ReactNode
  onClick?: () => void
  className?: string
}) {
  const reduce = useReducedMotion()
  const Comp = onClick ? motion.button : motion.div
  return (
    <Comp
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn('bg-surface-1 border border-line rounded-lg shadow-card hover:shadow-card-hover transition-shadow p-6 min-w-0 text-left', className)}
    >
      <span className="flex items-center justify-between gap-2 text-[13px] text-text-secondary">
        <span>{label}</span>
        {icon && <span className="text-text-muted" aria-hidden="true">{icon}</span>}
      </span>
      <span className="mt-2 block text-[28px] leading-8 font-semibold tracking-[-0.02em] text-text-primary">
        {unit && <span className="mr-1 text-sm font-medium text-text-muted">{unit}</span>}
        {value}
      </span>
      {hint && <span className="mt-1 flex items-center gap-1 text-xs text-text-muted">{hint}</span>}
    </Comp>
  )
}
