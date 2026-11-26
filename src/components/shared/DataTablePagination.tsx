import { ChevronLeft, ChevronRight } from '@/components/icons'
import { Button } from '@/components/ui/button'

/** Range on the left, previous and next on the right. Place in the table card footer. `page` starts at 1. */
export function DataTablePagination({ page, pageSize, total, onPageChange }: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const last = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
      <p className="text-xs text-text-muted"><span className="font-mono">{from} to {to}</span> of <span className="font-mono">{total}</span></p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={16} />Previous</Button>
        <Button size="sm" variant="secondary" disabled={page >= last} onClick={() => onPageChange(page + 1)}>Next<ChevronRight size={16} /></Button>
      </div>
    </div>
  )
}
