/** Every status maps to a label and a tone in one place (design system section 7.4). */

export type Tone = 'neutral' | 'signal' | 'risk' | 'caution' | 'positive'

export const STATUS: Record<string, { label: string; tone: Tone }> = {
  // lifecycle
  prospect: { label: 'Prospect', tone: 'neutral' },
  onboarding: { label: 'Onboarding', tone: 'caution' },
  active: { label: 'Active', tone: 'positive' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  renewal: { label: 'Renewal', tone: 'caution' },
  churned: { label: 'Churned', tone: 'risk' },
  // documents and contracts
  draft: { label: 'Draft', tone: 'neutral' },
  pending: { label: 'Pending', tone: 'caution' },
  pending_approval: { label: 'Pending approval', tone: 'caution' },
  in_review: { label: 'In review', tone: 'caution' },
  approved: { label: 'Approved', tone: 'positive' },
  rejected: { label: 'Rejected', tone: 'risk' },
  archived: { label: 'Archived', tone: 'neutral' },
  awaiting_sig: { label: 'Awaiting signature', tone: 'caution' },
  signed: { label: 'Signed', tone: 'positive' },
  auto_renews: { label: 'Auto-renews', tone: 'caution' },
  renewal_at_risk: { label: 'Renewal at risk', tone: 'risk' },
  expired: { label: 'Expired', tone: 'neutral' },
  ai_extracted: { label: 'AI extracted', tone: 'signal' },
  // processing
  processing: { label: 'Processing', tone: 'caution' },
  completed: { label: 'Completed', tone: 'positive' },
  failed: { label: 'Failed', tone: 'risk' },
  suspended: { label: 'Suspended', tone: 'risk' },
  // leads
  lead: { label: 'Lead', tone: 'neutral' },
  qualified: { label: 'Qualified', tone: 'positive' },
  unqualified: { label: 'Not a fit', tone: 'neutral' },
}

/** Unknown values fall back to neutral, with the raw value in sentence case. */
export function getStatus(value: string | null | undefined): { label: string; tone: Tone } {
  const raw = (value ?? '').trim()
  const key = raw.toLowerCase().replace(/[\s-]+/g, '_')
  if (STATUS[key]) return STATUS[key]
  const words = raw.replace(/[_-]+/g, ' ').toLowerCase()
  return { label: words ? words[0].toUpperCase() + words.slice(1) : 'Unknown', tone: 'neutral' }
}
