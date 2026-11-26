import { useEffect, useState } from "react";
import { Activity } from "@/components/icons";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionBody } from "@/components/shared/SectionBody";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getSignals } from "@/lib/api/captures";
import { formatDate } from "@/lib/format";
import type { SignalView } from "@/types/capture";

const LABEL: Record<string, string> = {
  PERSON_DETAIL: "Person detail",
  COMPANY_DETAIL: "Company detail",
  NEED: "Need",
  BUDGET: "Budget",
  TIMELINE: "Timeline",
  CONNECTION: "Connection",
  NEXT_STEP: "Next step",
  NOTE: "Note",
};

/**
 * Confirmed lead signals from CaptureIQ for a person or company, with where the lead
 * came from. The server masks sensitive values for people without profiles.view_sensitive.
 */
export function SignalsPanel({ entity, id }: { entity: "person" | "company"; id: string }) {
  const [items, setItems] = useState<SignalView[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    getSignals(entity === "person" ? { contact_id: id } : { account_id: id })
      .then((r) => alive && setItems(r))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [entity, id]);

  const sources = Array.from(new Set((items ?? []).map((s) => s.lead_source).filter(Boolean)));

  return (
    <SectionCard title="Lead signals" padded={false}>
      <SectionBody
        loading={!failed && items === null}
        error={failed ? "Signals could not be loaded." : undefined}
        isEmpty={items?.length === 0}
        empty={<EmptyState icon={<Activity size={24} />} title="No captured signals yet" description="Needs, budgets and next steps confirmed from captured leads appear here." />}
      >
        {sources.length > 0 && (
          <p className="px-6 pb-3 text-sm text-text-secondary">
            Lead source: <span className="font-semibold text-text-primary">{sources.join(", ")}</span>
          </p>
        )}
        <ul className="divide-y divide-line border-t border-line">
          {(items ?? []).map((s) => (
            <li key={s.id} className="flex min-w-0 flex-col items-start gap-1.5 px-6 py-3 text-sm sm:flex-row sm:gap-3">
              <StatusBadge tone="neutral" className="sm:w-32 sm:shrink-0 sm:justify-center">
                {LABEL[s.signal_type] ?? s.signal_type}
              </StatusBadge>
              <div className="min-w-0 flex-1">
                <p className="break-words text-text-primary">{s.value}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {s.origin}
                  {s.lead_source ? ` · ${s.lead_source}` : ""} · {formatDate(s.captured_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </SectionBody>
    </SectionCard>
  );
}
