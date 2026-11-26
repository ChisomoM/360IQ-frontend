import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Trash2, Star, StarOff, PenLine, Loader2, Type, Upload } from '@/components/icons';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SignaturePad from './SignaturePad';
import type { SignaturePadHandle } from './SignaturePad';
import { listMySignatures, saveMySignature, setDefaultSignature, deleteMySignature } from '@/lib/api/signatures';
import type { UserSignature, SignatureType } from '@/types/signatures';

interface SavedSignatureManagerProps {
  /** Called when the user wants to use a saved signature in a signing flow */
  onUse?: (sig: UserSignature) => void;
  /** If true, shows "Use" buttons instead of management actions */
  selectMode?: boolean;
}

const typeLabel: Record<SignatureType, string> = { draw: 'Drawn', type: 'Typed', image: 'Image' };

// Generates a PNG data URL for a typed signature string
function typeToDataURL(text: string, width = 340, height = 80): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#000000';
  ctx.font = `${height * 0.55}px "Dancing Script", cursive, Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  return canvas.toDataURL('image/png');
}

export default function SavedSignatureManager({ onUse, selectMode = false }: SavedSignatureManagerProps) {
  const [signatures, setSignatures] = useState<UserSignature[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'image'>('draw');
  const [label, setLabel] = useState('');
  const [typedText, setTypedText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserSignature | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const sigPadRef = useRef<SignaturePadHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listMySignatures()
      .then(data => { setSignatures(data); setLoaded(true); })
      .catch(() => toast.error('Failed to load saved signatures'))
      .finally(() => setLoading(false));
  }, []);

  // Auto-load on mount
  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setLabel('');
    setTypedText('');
    setImageDataUrl(null);
    sigPadRef.current?.clear();
    setShowForm(false);
  };

  const handleSave = async () => {
    let sigData = '';
    let sigType: SignatureType = 'draw';

    if (activeTab === 'draw') {
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
        toast.error('Draw your signature first.');
        return;
      }
      sigData = sigPadRef.current.getDataURL();
      sigType = 'draw';
    } else if (activeTab === 'type') {
      if (!typedText.trim()) {
        toast.error('Type your signature first.');
        return;
      }
      sigData = typeToDataURL(typedText.trim());
      sigType = 'type';
    } else {
      if (!imageDataUrl) {
        toast.error('Upload a signature image first.');
        return;
      }
      sigData = imageDataUrl;
      sigType = 'image';
    }

    const sigLabel = label.trim() || (activeTab === 'type' ? typedText.trim() : 'My Signature');
    const isFirst = signatures.length === 0;

    setSaving(true);
    try {
      const saved = await saveMySignature({ label: sigLabel, signature_type: sigType, signature_data: sigData, is_default: isFirst });
      setSignatures(prev => {
        // If saved is default, clear others
        const updated = isFirst ? prev.map(s => ({ ...s, is_default: false })) : prev;
        return [...updated, saved];
      });
      toast.success('Signature saved');
      resetForm();
    } catch {
      toast.error('Failed to save signature');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (sig: UserSignature) => {
    setSettingDefaultId(sig.id);
    try {
      await setDefaultSignature(sig.id);
      setSignatures(prev => prev.map(s => ({ ...s, is_default: s.id === sig.id })));
      toast.success(`"${sig.label}" set as default`);
    } catch {
      toast.error('Failed to set default');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeletingId(id);
    setDeleteTarget(null);
    try {
      await deleteMySignature(id);
      setSignatures(prev => prev.filter(s => s.id !== id));
      toast.success('Signature deleted');
    } catch {
      toast.error('Failed to delete signature');
    } finally {
      setDeletingId(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Choose an image file, like a PNG or JPG.'); return; }
    const reader = new FileReader();
    reader.onload = ev => { setImageDataUrl(ev.target?.result as string); };
    reader.readAsDataURL(file);
  };

  const tabs = [
    { key: 'draw' as const, label: 'Draw', icon: PenLine },
    { key: 'type' as const, label: 'Type', icon: Type },
    { key: 'image' as const, label: 'Upload', icon: Upload },
  ];

  return (
    <SectionCard
      title="Saved signatures"
      actions={!showForm && (
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(true)}>
          <Plus />
          Add signature
        </Button>
      )}
      bodyClassName="space-y-4"
    >
      <p className="text-sm text-text-secondary">Reuse a saved signature when you sign documents.</p>

      {/* Add signature form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 rounded-md border border-line p-4"
          >
            {/* Tab switcher */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
              <TabsList>
                {tabs.map(tab => (
                  <TabsTrigger key={tab.key} value={tab.key} className="gap-2">
                    <tab.icon size={16} />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Draw tab */}
            {activeTab === 'draw' && (
              <SignaturePad ref={sigPadRef} width={500} height={140} />
            )}

            {/* Type tab */}
            {activeTab === 'type' && (
              <div className="space-y-2">
                <Input
                  aria-label="Typed signature"
                  placeholder="Natasha Lungu"
                  value={typedText}
                  onChange={e => setTypedText(e.target.value)}
                />
                {typedText && (
                  <div data-theme="paper" className="flex min-h-[80px] items-center justify-center rounded-md border border-line bg-surface-1 p-3">
                    <span className="text-3xl" style={{ fontFamily: '"Dancing Script", cursive, Georgia, serif', color: '#000000' }}>
                      {typedText}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Upload tab */}
            {activeTab === 'image' && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  className="block w-full cursor-pointer rounded-md border-2 border-dashed border-line-strong p-6 text-center transition-colors hover:border-signal"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imageDataUrl ? (
                    <span data-theme="paper" className="mx-auto block w-fit rounded-xs bg-surface-1 p-1">
                      <img src={imageDataUrl} alt="Uploaded signature" className="max-h-20 object-contain" />
                    </span>
                  ) : (
                    <span className="block space-y-1">
                      <Upload size={24} className="mx-auto text-text-muted" />
                      <span className="block text-sm text-text-secondary">Upload a signature image</span>
                      <span className="block text-xs text-text-muted">PNG or JPG</span>
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Label + actions */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="signature-label">Label (optional)</Label>
                <Input
                  id="signature-label"
                  placeholder="Initials"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="secondary" size="sm" onClick={resetForm} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Plus />}
                  Save signature
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved signatures list */}
      {loading && !loaded ? (
        <div role="status" aria-busy="true" aria-label="Loading" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="skeleton h-32 rounded-md" />
          <div className="skeleton h-32 rounded-md" />
        </div>
      ) : signatures.length === 0 && loaded ? (
        <EmptyState
          className="py-6"
          icon={<PenLine size={24} />}
          title="No saved signatures"
          description="Add one to reuse it when you sign documents."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {signatures.map(sig => (
              <motion.div
                key={sig.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden rounded-md border border-line bg-surface-1"
              >
                {/* Preview: white in both themes so the black ink stays visible */}
                <div data-theme="paper" className="flex h-20 items-center justify-center border-b border-line bg-surface-1">
                  <img
                    src={sig.signature_data}
                    alt={sig.label}
                    className="max-h-16 max-w-full object-contain"
                  />
                </div>

                {/* Footer */}
                <div className="px-3 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{sig.label}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <StatusBadge tone="neutral">{typeLabel[sig.signature_type]}</StatusBadge>
                      {sig.is_default && (
                        <StatusBadge tone="neutral"><Star size={14} />Default</StatusBadge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {selectMode && onUse ? (
                      <Button type="button" variant="secondary" size="sm" onClick={() => onUse(sig)}>
                        Use
                      </Button>
                    ) : (
                      <>
                        {!sig.is_default && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Set as default"
                            aria-label={`Set ${sig.label} as default`}
                            onClick={() => handleSetDefault(sig)}
                            disabled={settingDefaultId === sig.id}
                          >
                            {settingDefaultId === sig.id
                              ? <Loader2 className="animate-spin" />
                              : <StarOff />
                            }
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-risk"
                          title="Delete"
                          aria-label={`Delete ${sig.label}`}
                          onClick={() => setDeleteTarget(sig)}
                          disabled={deletingId === sig.id}
                        >
                          {deletingId === sig.id
                            ? <Loader2 className="animate-spin" />
                            : <Trash2 />
                          }
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this signature?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.label}&rdquo; will be deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: 'destructive' })}>
              Delete signature
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}
