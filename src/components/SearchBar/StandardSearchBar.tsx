import { motion } from 'framer-motion'
import { Search, ListFilter, LayoutGrid, List, Loader2 } from '@/components/icons'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ViewMode = 'grid' | 'list'

interface StandardSearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onFilterClick: () => void
  showFilterPanel: boolean
  filterCount: number
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  placeholder?: string
  isSearching?: boolean
}

export function StandardSearchBar({
  searchQuery,
  onSearchChange,
  onFilterClick,
  showFilterPanel,
  filterCount,
  viewMode,
  onViewModeChange,
  placeholder = 'Search by name or title',
  isSearching = false,
}: StandardSearchBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search Input */}
      <div className="relative min-w-[14rem] flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </span>
        <Input
          type="search"
          aria-label="Search"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value)
          }}
          className="pl-10"
        />
      </div>

      {/* View Toggle (optional) */}
      {viewMode && onViewModeChange && (
        <div role="group" aria-label="View" className="flex gap-0.5 rounded-lg bg-field p-1">
          {(['grid', 'list'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              aria-pressed={viewMode === mode}
              aria-label={mode === 'grid' ? 'Grid view' : 'List view'}
              title={mode === 'grid' ? 'Grid view' : 'List view'}
              className={cn(
                'relative flex h-8 w-8 items-center justify-center rounded-inner transition-colors',
                viewMode === mode ? 'text-text-primary' : 'text-text-muted hover:text-text-primary',
              )}
            >
              {viewMode === mode && (
                <motion.span
                  layoutId="viewToggleActivePill"
                  className="absolute inset-0 rounded-inner bg-surface-1 shadow-raised dark:bg-line"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative">
                {mode === 'grid' ? <LayoutGrid size={16} /> : <List size={16} />}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Filter Button */}
      <Button
        type="button"
        variant="secondary"
        onClick={onFilterClick}
        aria-expanded={showFilterPanel}
        className={cn(showFilterPanel && 'bg-surface-2')}
      >
        <ListFilter />
        Filters
        {filterCount > 0 && (
          <span className="rounded-pill bg-surface-2 px-1.5 font-mono text-xs text-text-secondary">
            {filterCount}
          </span>
        )}
      </Button>
    </div>
  )
}
