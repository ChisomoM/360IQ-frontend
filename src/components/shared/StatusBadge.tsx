import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle, Clock, Sparkles } from '@/components/icons'
import { getStatus, type Tone } from '@/lib/status'
import { cn } from '@/lib/utils'

const TONE: Record<Tone, { className: string; Icon?: typeof Clock }> = {
  neutral: { className: 'bg-surface-2 text-text-secondary' },
  signal: { className: 'bg-signal-tint text-signal-text', Icon: Sparkles },
  risk: { className: 'bg-risk-tint text-risk', Icon: AlertTriangle },
  caution: { className: 'bg-caution-tint text-caution', Icon: Clock },
  positive: { className: 'bg-positive-tint text-positive', Icon: CheckCircle },
}

/**
 * Status = colour + icon + word. Pass `status` to use the shared map, or `tone` with children.
 * `label` overrides the mapped wording.
 */
export function StatusBadge({ status, tone, label, children, className }: {
  status?: string | null
  tone?: Tone
  label?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const mapped = getStatus(status)
  const { className: toneClass, Icon } = TONE[tone ?? mapped.tone]
  return (
    <span className={cn('inline-flex items-center gap-1 h-[1.572rem] pl-2 pr-2.5 rounded-pill text-xs font-semibold whitespace-nowrap', toneClass, className)}>
      {Icon && <Icon size={14} />}
      {children ?? label ?? mapped.label}
    </span>
  )
}
