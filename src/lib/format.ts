/** Locale formatting (design system section 12): ZMW before the amount, `31 Dec 2026`, 24-hour time. */

export const money = (v: number, cur = 'ZMW', compact = false) =>
  new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: cur,
    currencyDisplay: 'code',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(v)

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** `31 Dec 2026`. Returns '' for a missing or invalid date. */
export const formatDate = (value: string | number | Date | null | undefined) =>
  toDate(value)?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) ?? ''

/** `18 Nov 2026, 16:05`. Returns '' for a missing or invalid date. */
export const formatDateTime = (value: string | number | Date | null | undefined) => {
  const d = toDate(value)
  if (!d) return ''
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${formatDate(d)}, ${time}`
}
