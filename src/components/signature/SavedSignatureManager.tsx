import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Trash2, Star, StarOff, PenLine, Loader2, Type, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';

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
        toast.error('Please draw your signature first');
        return;
      }
      sigData = sigPadRef.current.getDataURL();
      sigType = 'draw';
    } else if (activeTab === 'type') {
      if (!typedText.trim()) {
        toast.error('Please type your signature text');
        return;
      }
      sigData = typeToDataURL(typedText.trim());
      sigType = 'type';
    } else {
      if (!imageDataUrl) {
        toast.error('Please upload a signature image');
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
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-sans font-semibold text-text-md text-gray-800">Saved Signatures</h3>
          <p className="font-sans text-text-sm text-gray-500 mt-0.5">Reuse your saved signatures when signing documents</p>
        </div>
        {!showForm && (
          <motion.button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground outline-none"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Plus className="h-4 w-4" />
            Add Signature
          </motion.button>
        )}
      </div>

      {/* Add signature form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm space-y-4"
          >
            {/* Tab switcher */}
            <div className="bg-slate-50/80 p-1 rounded-xl flex w-fit">
              {tabs.map(tab => (
                <motion.button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'relative flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium outline-none',
                    activeTab === tab.key ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                  )}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  {activeTab === tab.key && (
                    <motion.span
                      layoutId="sig-tab-pill"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm"
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    />
                  )}
                  <tab.icon className="h-3.5 w-3.5 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Draw tab */}
            {activeTab === 'draw' && (
              <SignaturePad ref={sigPadRef} width={500} height={140} />
            )}

            {/* Type tab */}
            {activeTab === 'type' && (
              <div className="space-y-2">
                <Input
                  placeholder="Type your name..."
                  value={typedText}
                  onChange={e => setTypedText(e.target.value)}
                  className="text-xl font-serif"
                />
                {typedText && (
                  <div className="border rounded-lg bg-white p-3 flex items-center justify-center min-h-[80px]">
                    <span className="text-3xl" style={{ fontFamily: '"Dancing Script", cursive, Georgia, serif' }}>
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
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imageDataUrl ? (
                    <img src={imageDataUrl} alt="Uploaded signature" className="max-h-20 mx-auto object-contain" />
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-500">Click to upload signature image</p>
                      <p className="text-xs text-gray-400">PNG, JPG supported</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Label + actions */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Label (optional)</Label>
                <Input
                  placeholder="e.g. My Signature, Initials..."
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={resetForm} disabled={saving}>
                  Cancel
                </Button>
                <motion.button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground disabled:opacity-50 outline-none"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Save
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved signatures list */}
      {loading && !loaded ? (
        <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : signatures.length === 0 && loaded ? (
        <div className="text-center py-8 text-gray-400">
          <PenLine className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No saved signatures yet.</p>
          <p className="text-xs mt-0.5">Add one above to reuse it when signing documents.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {signatures.map(sig => (
              <motion.div
                key={sig.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -3 }}
                className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
              >
                {/* Preview */}
                <div className="bg-gray-50 flex items-center justify-center h-20 border-b border-gray-100">
                  <img
                    src={sig.signature_data}
                    alt={sig.label}
                    className="max-h-16 max-w-full object-contain"
                  />
                </div>

                {/* Footer */}
                <div className="px-3 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-sans font-medium text-text-sm text-gray-800 truncate">{sig.label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 font-normal text-gray-500">
                        {typeLabel[sig.signature_type]}
                      </Badge>
                      {sig.is_default && (
                        <Badge className="text-xs px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border border-amber-300 font-normal">
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {selectMode && onUse ? (
                      <motion.button
                        type="button"
                        onClick={() => onUse(sig)}
                        className="h-7 px-2.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground outline-none"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        Use
                      </motion.button>
                    ) : (
                      <>
                        {!sig.is_default && (
                          <motion.button
                            type="button"
                            title="Set as default"
                            onClick={() => handleSetDefault(sig)}
                            disabled={settingDefaultId === sig.id}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-500 outline-none disabled:opacity-40"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            transition={{ type: 'spring', stiffness: 600, damping: 32 }}
                          >
                            {settingDefaultId === sig.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <StarOff className="h-3.5 w-3.5" />
                            }
                          </motion.button>
                        )}
                        {sig.is_default && (
                          <span className="h-7 w-7 flex items-center justify-center text-amber-400">
                            <Star className="h-3.5 w-3.5 fill-amber-400" />
                          </span>
                        )}
                        <motion.button
                          type="button"
                          title="Delete"
                          onClick={() => setDeleteTarget(sig)}
                          disabled={deletingId === sig.id}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 outline-none disabled:opacity-40"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          transition={{ type: 'spring', stiffness: 600, damping: 32 }}
                        >
                          {deletingId === sig.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />
                          }
                        </motion.button>
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
            <AlertDialogTitle>Delete Signature</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.label}&rdquo;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
