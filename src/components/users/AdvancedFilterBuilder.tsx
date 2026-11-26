import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Filter } from '@/components/icons'

interface AdvancedFilters {
  status?: string
  dateRange?: {
    from?: string
    to?: string
  }
}

interface AdvancedFilterBuilderProps {
  onApply: (filters: AdvancedFilters) => void
  onReset?: () => void
  hasActiveFilters?: boolean
}

export function AdvancedFilterBuilder({
  onApply,
  onReset,
  hasActiveFilters = false,
}: AdvancedFilterBuilderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<AdvancedFilters>({
    status: 'all',
    dateRange: { from: '', to: '' },
  })

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value }))
  }

  const handleDateChange = (
    field: 'from' | 'to',
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value,
      },
    }))
  }

  const handleApply = () => {
    onApply(filters)
    setIsOpen(false)
  }

  const handleReset = () => {
    setFilters({ status: 'all', dateRange: { from: '', to: '' } })
    onReset?.()
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className={hasActiveFilters ? 'border-signal bg-signal-tint text-signal-text' : undefined}
        >
          <Filter />
          {hasActiveFilters ? 'Filters on' : 'Filters'}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-0">
        <div className="border-b border-line p-4">
          <h3 className="font-semibold text-sm text-text-primary">
            Advanced filters
          </h3>
        </div>

        <div className="space-y-4 p-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block mb-1.5 text-xs font-medium text-text-secondary">
              Status
            </label>
            <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger id="status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="date-from" className="block mb-1.5 text-xs font-medium text-text-secondary">
                From
              </label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateRange?.from || ''}
                onChange={(e) => handleDateChange('from', e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block mb-1.5 text-xs font-medium text-text-secondary">
                To
              </label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateRange?.to || ''}
                onChange={(e) => handleDateChange('to', e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line p-4">
          <Button size="sm" variant="ghost" onClick={handleReset}>
            <X />
            Reset
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
