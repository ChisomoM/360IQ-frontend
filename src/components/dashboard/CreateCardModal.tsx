import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCardDefinition } from '@/lib/api/dashboard';
import type { CreateCardDefinitionRequest } from '@/lib/api/dashboard';

interface CreateCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCardCreated: () => void;
}

const CARD_TYPES = [
  { value: 'metric', label: 'Metric' },
  { value: 'chart', label: 'Chart' },
  { value: 'table', label: 'Table' },
  { value: 'escalations', label: 'Escalations' },
];

const LAYOUT_ZONES = [
  { value: 'top', label: 'Top (Summary)' },
  { value: 'side', label: 'Side (Tasks/Alerts)' },
  { value: 'middle', label: 'Middle (Analytics)' },
];

export function CreateCardModal({ open, onOpenChange, onCardCreated }: CreateCardModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cardType, setCardType] = useState<'metric' | 'chart' | 'table' | 'escalations'>('metric');
  const [layoutZone, setLayoutZone] = useState<'top' | 'side' | 'middle'>('middle');
  const [orderIndex, setOrderIndex] = useState('999');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateCard = async () => {
    // Validate required fields
    if (!title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const request: CreateCardDefinitionRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        card_type: cardType,
        layout_zone: layoutZone,
        order_index: parseInt(orderIndex, 10) || 999,
      };

      await createCardDefinition(request);

      toast({
        title: 'Success',
        description: 'Card definition created successfully',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCardType('metric');
      setLayoutZone('middle');
      setOrderIndex('999');

      // Close modal
      onOpenChange(false);

      // Refresh the parent component
      onCardCreated();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create card definition';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Card</DialogTitle>
          <DialogDescription>
            Add a new dashboard card definition for your team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="card-title">Title *</Label>
            <Input
              id="card-title"
              placeholder="e.g., Total Policies"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="card-description">Description</Label>
            <Input
              id="card-description"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Card Type */}
          <div className="space-y-2">
            <Label htmlFor="card-type">Card Type *</Label>
            <Select value={cardType} onValueChange={(v) => setCardType(v as any)} disabled={loading}>
              <SelectTrigger id="card-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Layout Zone */}
          <div className="space-y-2">
            <Label htmlFor="layout-zone">Layout Zone *</Label>
            <Select value={layoutZone} onValueChange={(v) => setLayoutZone(v as any)} disabled={loading}>
              <SelectTrigger id="layout-zone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAYOUT_ZONES.map((z) => (
                  <SelectItem key={z.value} value={z.value}>
                    {z.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Order Index */}
          <div className="space-y-2">
            <Label htmlFor="order-index">Order Index</Label>
            <Input
              id="order-index"
              type="number"
              placeholder="999"
              value={orderIndex}
              onChange={(e) => setOrderIndex(e.target.value)}
              disabled={loading}
              min="0"
            />
            <p className="text-xs text-gray-500">
              Lower numbers appear first. Default: end of zone
            </p>
          </div>

          {/* Info Note for Top Zone */}
          {layoutZone === 'top' && (
            <div className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Top zone is limited to 3 cards. Will be rejected if zone is full.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateCard}
            disabled={loading || !title.trim()}
            className="bg-[#D70F0E] hover:bg-[#C70D0C]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Card'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
