import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePending, listPending, type PendingCapture } from "@/lib/capture/pending";
import type { CaptureView } from "@/types/capture";
import { METHOD_LABEL, ErrorBanner, fmtTime } from "./parts";
import { sendErrorText, sendPending } from "./useSender";

const KIND_METHOD = { card: "CARD", voice: "VOICE", note: "NOTE" } as const;

/**
 * Captures that were saved on this device but never reached the server (a dropped
 * connection, a closed tab, a server error). They stay here until sent or discarded.
 */
export function PendingUploads({ onSent }: { onSent: (v: CaptureView) => void }) {
  const [items, setItems] = useState<PendingCapture[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => setItems(await listPending()), []);
  useEffect(() => {
    void load();
  }, [load]);

  if (items.length === 0) return null;

  const send = async (p: PendingCapture) => {
    setBusy(p.id);
    setErrors((e) => ({ ...e, [p.id]: "" }));
    try {
      const v = await sendPending(p);
      await load();
      onSent(v);
    } catch (e) {
      setErrors((x) => ({ ...x, [p.id]: sendErrorText(e, "capture") }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-2 rounded-xl border border-caution bg-caution-tint p-3" aria-label="Captures not sent yet">
      <h2 className="font-display text-sm font-semibold text-caution">Not sent yet ({items.length})</h2>
      <p className="text-xs text-text-secondary">These are saved on this device only. Send them when you have a connection.</p>
      <ul className="space-y-2">
        {items.map((p) => (
          <li key={p.id} className="space-y-2 rounded-lg bg-surface-1 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-text-primary">
                {METHOD_LABEL[KIND_METHOD[p.kind]]} · {fmtTime(new Date(p.createdAt).toISOString())}
                {p.eventName ? ` · ${p.eventName}` : ""}
              </span>
              <span className="flex gap-2">
                <Button type="button" size="sm" disabled={busy === p.id} onClick={() => void send(p)}>
                  {busy === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Send
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy === p.id}
                  onClick={async () => {
                    await deletePending(p.id);
                    await load();
                  }}
                >
                  <Trash2 className="h-3 w-3" /> Discard
                </Button>
              </span>
            </div>
            {p.kind === "note" && p.text && <p className="line-clamp-2 break-words text-text-secondary">{p.text}</p>}
            {(errors[p.id] || p.lastError) && <ErrorBanner>{errors[p.id] || `Last attempt failed: ${p.lastError}`}</ErrorBanner>}
          </li>
        ))}
      </ul>
    </section>
  );
}
