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
import { AlertCircle, Loader2 } from '@/components/icons';
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
  { value: 'top', label: 'Top (summary)' },
  { value: 'side', label: 'Side (tasks and alerts)' },
  { value: 'middle', label: 'Middle (analytics)' },
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
        title: 'Title needed',
        description: 'Enter a title for the card.',
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
        title: 'Card created',
        description: 'The new card is ready to configure.',
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
      const message = err instanceof Error ? err.message : 'Check the details and try again.';
      toast({
        title: "Couldn't create the card",
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
          <DialogTitle>Create a dashboard card</DialogTitle>
          <DialogDescription>
            Add a new dashboard card definition for your team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="card-title">Title (required)</Label>
            <Input
              id="card-title"
              placeholder="Total policies"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="card-description">Description (optional)</Label>
            <Input
              id="card-description"
              placeholder="Policies in force this quarter"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Card Type */}
          <div className="space-y-2">
            <Label htmlFor="card-type">Card type (required)</Label>
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
            <Label htmlFor="layout-zone">Layout zone (required)</Label>
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
            <Label htmlFor="order-index">Order</Label>
            <Input
              id="order-index"
              type="number"
              placeholder="999"
              value={orderIndex}
              onChange={(e) => setOrderIndex(e.target.value)}
              disabled={loading}
              min="0"
            />
            <p className="text-xs text-text-muted">
              Lower numbers appear first. By default the card goes to the end of its zone.
            </p>
          </div>

          {/* Info Note for Top Zone */}
          {layoutZone === 'top' && (
            <div className="flex gap-2 rounded-md bg-caution-tint p-3 text-caution">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                The top zone holds 3 cards. A new card is rejected if the zone is full.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateCard}
            disabled={loading || !title.trim()}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating
              </>
            ) : (
              'Create card'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
