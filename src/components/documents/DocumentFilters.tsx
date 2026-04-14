import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'action_required', label: 'Action Required' },
]

// Document type options
const DOCUMENT_TYPE_OPTIONS = [
  { value: 'policy', label: 'Policy' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'guideline', label: 'Guideline' },
  { value: 'report', label: 'Report' },
  { value: 'form', label: 'Form' },
  { value: 'template', label: 'Template' },
  { value: 'manual', label: 'Manual' },
  { value: 'other', label: 'Other' },
]

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

  return (
    <div className="space-y-4">
      {/* Parsed search filters (pills) */}
      {parsedSearchFilters && (
        <div className="flex flex-wrap gap-2">
          {parsedSearchFilters.types?.map(type => (
            <Badge key={`type-${type}`} variant="secondary" className="bg-blue-100 text-blue-800 flex items-center gap-1">
              type: {type}
              <X className="h-3 w-3 cursor-pointer hover:text-blue-600" onClick={() => {
                // Remove this filter from search query
                const newQuery = searchQuery.replace(new RegExp(`\\btype:${type}\\b`, 'gi'), '').trim()
                onSearchChange(newQuery)
              }} />
            </Badge>
          ))}
          {parsedSearchFilters.statuses?.map(status => (
            <Badge key={`status-${status}`} variant="secondary" className="bg-purple-100 text-purple-800 flex items-center gap-1">
              status: {status}
              <X className="h-3 w-3 cursor-pointer hover:text-purple-600" onClick={() => {
                const newQuery = searchQuery.replace(new RegExp(`\\bstatus:${status}\\b`, 'gi'), '').trim()
                onSearchChange(newQuery)
              }} />
            </Badge>
          ))}
          {parsedSearchFilters.tags?.map(tag => (
            <Badge key={`tag-${tag}`} variant="secondary" className="bg-green-100 text-green-800 flex items-center gap-1">
              tag: {tag}
              <X className="h-3 w-3 cursor-pointer hover:text-green-600" onClick={() => {
                const newQuery = searchQuery.replace(new RegExp(`\\btag:${tag}\\b`, 'gi'), '').trim()
                onSearchChange(newQuery)
              }} />
            </Badge>
          ))}
          {parsedSearchFilters.dateFrom && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 flex items-center gap-1">
              since: {parsedSearchFilters.dateFrom}
              <X className="h-3 w-3 cursor-pointer hover:text-amber-600" onClick={() => {
                const newQuery = searchQuery.replace(new RegExp(`\\bsince:[^\\s]+\\b`, 'gi'), '').trim()
                onSearchChange(newQuery)
              }} />
            </Badge>
          )}
          {parsedSearchFilters.dateUntil && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 flex items-center gap-1">
              until: {parsedSearchFilters.dateUntil}
              <X className="h-3 w-3 cursor-pointer hover:text-amber-600" onClick={() => {
                const newQuery = searchQuery.replace(new RegExp(`\\buntil:[^\\s]+\\b`, 'gi'), '').trim()
                onSearchChange(newQuery)
              }} />
            </Badge>
          )}
        </div>
      )}

      {/* Filter inputs grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Department */}
        <div>
          <label className="block font-sans text-text-xs font-medium text-gray-700 mb-1">
            Department
          </label>
          <Select value={filters.department_id || 'all'} onValueChange={handleDepartmentChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div>
          <label className="block font-sans text-text-xs font-medium text-gray-700 mb-1">
            Status
          </label>
          <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document Type */}
        <div>
          <label className="block font-sans text-text-xs font-medium text-gray-700 mb-1">
            Document Type
          </label>
          <Select value={filters.document_type || 'all'} onValueChange={handleDocTypeChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DOCUMENT_TYPE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Uploaded Date: From */}
        <div>
          <label className="block font-sans text-text-xs font-medium text-gray-700 mb-1">
            Uploaded From
          </label>
          <Input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Uploaded Date: To */}
        <div>
          <label className="block font-sans text-text-xs font-medium text-gray-700 mb-1">
            Uploaded To
          </label>
          <Input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2">
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="text-red-600 hover:text-red-700"
          >
            Clear Filters
          </Button>
        )}
        <div className="flex-1" />
        <p className="text-text-xs text-gray-500 font-sans">
          {hasActiveFilters ? 'Filters applied' : 'No filters applied'}
        </p>
      </div>

      {/* Search hints */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
        <p className="font-sans text-text-xs text-blue-800">
          <strong>Search Tips:</strong> Use modifiers in the search bar:{' '}
          <code className="bg-white px-1 rounded mx-1">type:pdf</code>{' '}
          <code className="bg-white px-1 rounded mx-1">status:pending</code>{' '}
          <code className="bg-white px-1 rounded mx-1">since:2024-01</code>{' '}
          <code className="bg-white px-1 rounded mx-1">tag:urgent</code>
        </p>
      </div>
    </div>
  )
}
