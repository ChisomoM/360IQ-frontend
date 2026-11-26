import { getStatus, type Tone } from '@/lib/status';

const ONBOARDING: Record<string, { label: string; tone: Tone }> = {
  REGISTERED: { label: 'Registered', tone: 'neutral' },
  SUBMITTED: { label: 'Submitted', tone: 'caution' },
  UNDER_REVIEW: { label: 'Under review', tone: 'caution' },
  INFO_REQUESTED: { label: 'Information requested', tone: 'caution' },
  ACTIVE: { label: 'Active', tone: 'positive' },
};

/** Label and tone for a company onboarding state. Unknown values fall back to the shared map. */
export function onboardingStateBadge(state: string): { label: string; tone: Tone } {
  return ONBOARDING[state] ?? getStatus(state);
}
