import type { ReactNode } from 'react'
import { AlertTriangle } from '@/components/icons'
import { Button } from '@/components/ui/button'

/** Loading skeleton, error with "Try again", empty, or children. One card failing must not blank the page. */
export function SectionBody({ loading, error, onRetry, isEmpty, empty, skeleton, children }: {
  loading?: boolean
  error?: ReactNode
  onRetry?: () => void
  isEmpty?: boolean
  empty?: ReactNode
  skeleton?: ReactNode
  children: ReactNode
}) {
  if (loading) {
    return (
      <>
        {skeleton ?? (
          <div role="status" aria-busy="true" aria-label="Loading" className="grid gap-3 p-6">
            <div className="skeleton h-4 w-2/3 rounded-xs" />
            <div className="skeleton h-4 w-full rounded-xs" />
            <div className="skeleton h-4 w-1/2 rounded-xs" />
          </div>
        )}
      </>
    )
  }
  if (error) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 px-6 py-8 text-center">
        <AlertTriangle size={24} className="text-risk" />
        <p className="max-w-[44ch] text-sm text-text-secondary">{error}</p>
        {onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>Try again</Button>}
      </div>
    )
  }
  if (isEmpty) return <>{empty}</>
  return <>{children}</>
}
