import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Tone } from '@/lib/status'

/** Document and signature states the shared status map does not give a tone. Labels still come from the map. */
const EXTRA_TONES: Record<string, Tone> = {
  changes_requested: 'caution',
  action_required: 'caution',
  declined: 'risk',
  deleted: 'risk',
}

export function DocumentStatusBadge({ status, className }: { status?: string | null; className?: string }) {
  return <StatusBadge status={status} tone={status ? EXTRA_TONES[status] : undefined} className={className} />
}
