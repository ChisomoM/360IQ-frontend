import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Loader2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { newClientKey, tzOffsetMinutes } from "@/lib/capture/pending";
import { prepareCardImage } from "@/lib/capture/media";
import type { CaptureMeta, CaptureView } from "@/types/capture";
import { ErrorBanner } from "./parts";
import { SendStatus, useSender } from "./useSender";

/** Business card: take a photo or choose one. The AI reads it into a review, nothing is saved to a profile yet. */
export function CardCapture({ eventName, meta, onDone }: { eventName: string; meta: CaptureMeta | null; onDone: (v: CaptureView) => void }) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<{ blob: Blob; filename: string; url: string } | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const sender = useSender("card photo", onDone);

  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.url);
    },
    [photo]
  );

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setProblem(null);
    await sender.discard(); // a different photo is a different capture: it gets its own client key
    setPreparing(true);
    try {
      const { blob, filename } = await prepareCardImage(file, meta?.limits.image_bytes ?? 5 << 20);
      setPhoto({ blob, filename, url: URL.createObjectURL(blob) });
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Could not use this photo.");
    } finally {
      setPreparing(false);
    }
  };

  const send = () => {
    if (!photo) return;
    void sender.start({
      id: sender.pending?.id ?? newClientKey(),
      kind: "card",
      blob: photo.blob,
      filename: photo.filename,
      eventName,
      tzOffset: tzOffsetMinutes(),
      createdAt: Date.now(),
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">Photograph the card on a flat surface. The AI reads the name, title, company, phone, email, website and address, and you check them before anything is saved.</p>

      <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Take a photo of the card" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={gallery} type="file" accept="image/jpeg,image/png,image/webp,image/*" className="sr-only" aria-label="Choose a card photo from your files" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />

      {!photo && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" size="lg" className="h-14" onClick={() => camera.current?.click()} disabled={preparing}>
            {preparing ? <Loader2 className="animate-spin" /> : <Camera />} Take a photo
          </Button>
          <Button type="button" size="lg" variant="secondary" className="h-14" onClick={() => gallery.current?.click()} disabled={preparing}>
            <ImageUp /> Choose a file
          </Button>
        </div>
      )}

      {problem && <ErrorBanner>{problem}</ErrorBanner>}

      {photo && (
        <div className="space-y-3">
          <img src={photo.url} alt="Business card to read" className="max-h-72 w-full rounded-md border border-line bg-surface-2 object-contain" />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="lg" onClick={send} disabled={sender.busy}>
              {sender.busy ? <Loader2 className="animate-spin" /> : null} Read this card
            </Button>
            <Button type="button" size="lg" variant="secondary" onClick={() => { void sender.discard(); setPhoto(null); }} disabled={sender.busy}>
              Retake
            </Button>
          </div>
        </div>
      )}
      <SendStatus sender={sender} />
    </div>
  );
}
