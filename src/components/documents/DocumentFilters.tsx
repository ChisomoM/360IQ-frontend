import { X } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Department } from '@/types/dms'

interface DocumentFiltersProps {
  departments: Department[]
  filters: {
    department_id?: string
    status?: string
    document_type?: string
    date_from?: string
    date_to?: string
  }
  searchQuery: string
  parsedSearchFilters?: {
    types?: string[]
    statuses?: string[]
    tags?: string[]
    dateFrom?: string
    dateUntil?: string
  }
  onFilterChange: (filters: any) => void
  onSearchChange: (query: string) => void
  onReset: () => void
}

// Document status options
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'pending', label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'action_required', label: 'Action required' },
]

// Document type options
const DOCUMENT_TYPE_OPTIONS = [
  { value: 'memo', label: 'Memo' },
  { value: 'circular', label: 'Circular' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'report', label: 'Report' },
  { value: 'policy', label: 'Policy' },
  { value: 'bid_document', label: 'Bid or tender document' },
  { value: 'contract', label: 'Contract or agreement' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'appointment_letter', label: 'Appointment letter' },
  { value: 'permit', label: 'Permit or licence' },
  
                              
]

/**
 * Safe search query modifier removal
 * Removes a specific modifier (e.g., "type:pdf") from the search query
 * Handles edge cases like escaped characters and multiple modifiers
 */
function removeSearchModifier(query: string, modifierKey: string, modifierValue: string): string {
  // Escape special regex characters in the value
  const escapedValue = modifierValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Match the modifier with word boundaries, case-insensitive
  const pattern = new RegExp(`\\b${modifierKey}:${escapedValue}\\b`, 'gi')
  return query.replace(pattern, '').trim()
}

/**
 * DocumentFilters — Advanced filter panel for document search
 * 
 * Features:
 * - Department dropdown (from API)
 * - Status filter (predefined options)
 * - Document type filter
 * - Date range pickers
 * - Display parsed search modifiers as pills (type:, status:, tag:, since:, until:)
 * - Apply/Reset buttons
 * - Design system compliant
 */
export function DocumentFilters({
  departments,
  filters,
  searchQuery,
  parsedSearchFilters,
  onFilterChange,
  onSearchChange,
  onReset,
}: DocumentFiltersProps) {
  const handleDepartmentChange = (value: string) => {
    onFilterChange({
      ...filters,
      department_id: value === 'all' ? undefined : value,
    })
  }

  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filters,
      status: value === 'all' ? undefined : value,
    })
  }

  const handleDocTypeChange = (value: string) => {
    onFilterChange({
      ...filters,
      document_type: value === 'all' ? undefined : value,
    })
  }

  const handleDateFromChange = (value: string) => {
    onFilterChange({
      ...filters,
      date_from: value || undefined,
    })
  }

  const handleDateToChange = (value: string) => {
    onFilterChange({
      ...filters,
      date_to: value || undefined,
    })
  }

  // Get label for current selection
  const getDeptLabel = () => {
    if (!filters.department_id) return 'All Departments'
    return departments.find(d => d.id === filters.department_id)?.name ?? 'Unknown'
  }

  const getStatusLabel = () => {
    if (!filters.status) return 'All Statuses'
    return STATUS_OPTIONS.find(s => s.value === filters.status)?.label ?? 'Unknown'
  }

  const getDocTypeLabel = () => {
    if (!filters.document_type) return 'All Types'
    return DOCUMENT_TYPE_OPTIONS.find(t => t.value === filters.document_type)?.label ?? 'Unknown'
  }

  // Check if any filters are active
  const hasActiveFilters = filters.department_id || filters.status || filters.document_type || filters.date_from || filters.date_to

  const modifierPill = (modifier: string, value: string) => (
    <StatusBadge key={`${modifier}-${value}`} tone="neutral">
      {modifier}: <span className="font-mono">{value}</span>
      <button
        type="button"
        aria-label={`Remove ${modifier} ${value}`}
        className="rounded-pill hover:text-text-primary"
        onClick={() => {
          const newQuery = removeSearchModifier(searchQuery, modifier, value)
          onSearchChange(newQuery)
        }}
      >
        <X size={12} />
      </button>
    </StatusBadge>
  )

  return (
    <div className="space-y-4">
      {/* Parsed search filters (pills) */}
      {parsedSearchFilters && (
        <div className="flex flex-wrap gap-2 empty:hidden">
          {parsedSearchFilters.types?.map(type => modifierPill('type', type))}
          {parsedSearchFilters.statuses?.map(status => modifierPill('status', status))}
          {parsedSearchFilters.tags?.map(tag => modifierPill('tag', tag))}
          {parsedSearchFilters.dateFrom && modifierPill('since', parsedSearchFilters.dateFrom)}
          {parsedSearchFilters.dateUntil && modifierPill('until', parsedSearchFilters.dateUntil)}
        </div>
      )}

      {/* Filter inputs grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Department */}
        <div className="space-y-1.5">
          <Label htmlFor="filter-department">Department</Label>
          <Select value={filters.department_id || 'all'} onValueChange={handleDepartmentChange}>
            <SelectTrigger id="filter-department">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label htmlFor="filter-status">Status</Label>
          <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger id="filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document Type */}
        <div className="space-y-1.5">
          <Label htmlFor="filter-type">Document type</Label>
          <Select value={filters.document_type || 'all'} onValueChange={handleDocTypeChange}>
            <SelectTrigger id="filter-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {DOCUMENT_TYPE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Uploaded Date: From */}
        <div className="space-y-1.5">
          <Label htmlFor="filter-from">Uploaded from</Label>
          <Input
            id="filter-from"
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => handleDateFromChange(e.target.value)}
          />
        </div>

        {/* Uploaded Date: To */}
        <div className="space-y-1.5">
          <Label htmlFor="filter-to">Uploaded to</Label>
          <Input
            id="filter-to"
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => handleDateToChange(e.target.value)}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
          >
            Clear filters
          </Button>
        )}
        <div className="flex-1" />
        <p className="text-xs text-text-muted">
          {hasActiveFilters ? 'Filters applied' : 'No filters applied'}
        </p>
      </div>

      {/* Search hints */}
      <p className="rounded-md bg-field px-3 py-2 text-xs text-text-secondary">
        You can also type modifiers in the search bar:{' '}
        {['type:pdf', 'status:pending', 'since:2026-01', 'tag:urgent'].map((example) => (
          <code key={example} className="mr-1.5 rounded-xs bg-surface-1 px-1.5 font-mono">{example}</code>
        ))}
      </p>
    </div>
  )
}
