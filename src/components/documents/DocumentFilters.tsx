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
  { value: 'memo', label: 'Memo' },
  { value: 'circular', label: 'Circular' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'report', label: 'Report' },
  { value: 'policy', label: 'Policy' },
  { value: 'bid_document', label: 'Bid / Tender Document' },
  { value: 'contract', label: 'Contract / Agreement' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'appointment_letter', label: 'Appointment Letter' },
  { value: 'permit', label: 'Permit / Licence' },
  
                              
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

  return (
    <div className="space-y-4">
      {/* Parsed search filters (pills) */}
      {parsedSearchFilters && (
        <div className="flex flex-wrap gap-2">
          {parsedSearchFilters.types?.map(type => (
            <Badge key={`type-${type}`} variant="secondary" className="bg-blue-100 text-blue-800 flex items-center gap-1 cursor-pointer hover:bg-blue-200 transition-colors">
              type: {type}
              <X 
                className="h-3 w-3 hover:text-blue-900" 
                onClick={() => {
                  const newQuery = removeSearchModifier(searchQuery, 'type', type)
                  onSearchChange(newQuery)
                }} 
              />
            </Badge>
          ))}
          {parsedSearchFilters.statuses?.map(status => (
            <Badge key={`status-${status}`} variant="secondary" className="bg-purple-100 text-purple-800 flex items-center gap-1 cursor-pointer hover:bg-purple-200 transition-colors">
              status: {status}
              <X 
                className="h-3 w-3 hover:text-purple-900" 
                onClick={() => {
                  const newQuery = removeSearchModifier(searchQuery, 'status', status)
                  onSearchChange(newQuery)
                }} 
              />
            </Badge>
          ))}
          {parsedSearchFilters.tags?.map(tag => (
            <Badge key={`tag-${tag}`} variant="secondary" className="bg-green-100 text-green-800 flex items-center gap-1 cursor-pointer hover:bg-green-200 transition-colors">
              tag: {tag}
              <X 
                className="h-3 w-3 hover:text-green-900" 
                onClick={() => {
                  const newQuery = removeSearchModifier(searchQuery, 'tag', tag)
                  onSearchChange(newQuery)
                }} 
              />
            </Badge>
          ))}
          {parsedSearchFilters.dateFrom && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 flex items-center gap-1 cursor-pointer hover:bg-amber-200 transition-colors">
              since: {parsedSearchFilters.dateFrom}
              <X 
                className="h-3 w-3 hover:text-amber-900" 
                onClick={() => {
                  const newQuery = removeSearchModifier(searchQuery, 'since', parsedSearchFilters.dateFrom!)
                  onSearchChange(newQuery)
                }} 
              />
            </Badge>
          )}
          {parsedSearchFilters.dateUntil && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 flex items-center gap-1 cursor-pointer hover:bg-amber-200 transition-colors">
              until: {parsedSearchFilters.dateUntil}
              <X 
                className="h-3 w-3 hover:text-amber-900" 
                onClick={() => {
                  const newQuery = removeSearchModifier(searchQuery, 'until', parsedSearchFilters.dateUntil!)
                  onSearchChange(newQuery)
                }} 
              />
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
