import { FileText } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onAction: () => void
  }
  className?: string
}

/** What this place is for, plus one action. An invitation, not an apology. */
export function EmptyState({
  title = 'Nothing here yet',
  description = 'Change your search or filters to see more.',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-12 px-6 text-center', className)}>
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-signal-tint text-signal-text" aria-hidden="true">
        {icon || <FileText size={24} />}
      </div>
      <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
      <p className="max-w-[44ch] text-sm text-text-secondary">{description}</p>
      {action && <Button onClick={action.onAction}>{action.label}</Button>}
    </div>
  )
}
