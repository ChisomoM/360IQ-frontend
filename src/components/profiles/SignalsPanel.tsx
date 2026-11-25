import { useEffect, useState } from "react";
import { Panel } from "@/components/profiles/ui";
import { getSignals } from "@/lib/api/captures";
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
    <Panel title="Lead signals">
      {failed && <p className="text-sm text-text-muted">Signals could not be loaded.</p>}
      {!failed && items === null && <p className="text-sm text-text-muted">Loading...</p>}
      {items && items.length === 0 && <p className="text-sm text-text-muted">No captured signals yet.</p>}
      {items && items.length > 0 && (
        <div className="space-y-3">
          {sources.length > 0 && (
            <p className="text-sm text-text-secondary">
              Lead source: <span className="font-medium text-text-primary">{sources.join(", ")}</span>
            </p>
          )}
          <ul className="space-y-2">
            {items.map((s) => (
              <li key={s.id} className="rounded-lg border border-line bg-surface-1 p-3 text-sm">
                <p className="font-medium text-text-primary">
                  {LABEL[s.signal_type] ?? s.signal_type}: <span className="break-words font-normal">{s.value}</span>
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {s.origin}
                  {s.lead_source ? ` · ${s.lead_source}` : ""} · {new Date(s.captured_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
