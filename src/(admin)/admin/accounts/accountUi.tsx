import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import type { LifecycleStage, Seniority, Status, StrategicTier } from "@/types/account";
import type { Tone } from "@/lib/status";

/** "DECISION_MAKER" -> "Decision maker". Display only: values sent to the API are unchanged. */
export function enumLabel(value: string): string {
  const s = value.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const SENIORITY_LABEL: Record<Seniority, string> = {
  C_LEVEL: "C-level",
  VP: "VP",
  DIRECTOR: "Director",
  MANAGER: "Manager",
  STAFF: "Staff",
};

const STAGE_TONE: Record<LifecycleStage, Tone> = {
  LEAD: "neutral",
  PROSPECT: "neutral",
  CUSTOMER: "positive",
  CHURNED: "risk",
};

export function StageBadge({ stage }: { stage?: LifecycleStage }) {
  if (!stage) return null;
  return <StatusBadge tone={STAGE_TONE[stage] ?? "neutral"} label={enumLabel(stage)} />;
}

export function RecordStatusBadge({ status }: { status?: Status }) {
  if (!status) return null;
  return <StatusBadge status={status} />;
}

const GRADE_FILL: Record<StrategicTier, string> = {
  PLATINUM: "bg-grade-platinum border-line-strong",
  GOLD: "bg-grade-gold border-transparent",
  SILVER: "bg-grade-silver border-transparent",
  BRONZE: "bg-grade-bronze border-transparent",
};

/** Opportunity grade chip (design system 7.5). Always shows the grade word. */
export function GradeChip({ tier }: { tier?: StrategicTier }) {
  if (!tier || !GRADE_FILL[tier]) return null;
  const label = enumLabel(tier);
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-pill border pl-[3px] pr-2 text-xs font-semibold text-on-grade", GRADE_FILL[tier])}>
      <span aria-hidden="true" className="grid h-[18px] w-[18px] place-items-center rounded-pill bg-on-grade text-[10px] font-bold text-brand-paper">
        {label[0]}
      </span>
      {label}
    </span>
  );
}
