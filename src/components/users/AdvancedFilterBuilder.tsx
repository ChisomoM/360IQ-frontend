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
import { Settings, X, Filter } from 'lucide-react'

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
          className={`gap-2 h-9 px-3 text-xs ${
            hasActiveFilters
              ? 'bg-primary/5 border border-primary text-primary'
              : 'border'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-0">
        <div className="border-b border-gray-200 p-4">
          <h3 className="font-display font-semibold text-text-sm text-gray-900">
            Advanced Filters
          </h3>
        </div>

        <div className="space-y-4 p-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="font-sans font-medium text-text-xs text-gray-700 block mb-2">
              Status
            </label>
            <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger id="status-filter" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="date-from" className="font-sans font-medium text-text-xs text-gray-700 block mb-2">
                From
              </label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateRange?.from || ''}
                onChange={(e) => handleDateChange('from', e.target.value)}
                className="h-9 text-text-xs"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="font-sans font-medium text-text-xs text-gray-700 block mb-2">
                To
              </label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateRange?.to || ''}
                onChange={(e) => handleDateChange('to', e.target.value)}
                className="h-9 text-text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-gray-200 p-4">
          <Button
            className="flex-1 h-9 text-xs border rounded-lg"
            onClick={handleReset}
          >
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            className="flex-1 h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
            onClick={handleApply}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
