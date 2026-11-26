import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from '@/components/icons';
import { toast } from 'sonner';
import { update } from '@/lib/api/crud';
import type { RoleSlug } from '@/types/rbac';

interface UserRoleAssignDialogProps {
  userId: string;
  currentRoleSlug: RoleSlug;
  currentTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleSlug: RoleSlug, title: string) => void;
}

const ROLE_OPTIONS: { value: RoleSlug; label: string }[] = [
  { value: 'super_admin', label: 'Super admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
];

export function UserRoleAssignDialog({
  userId,
  currentRoleSlug,
  currentTitle,
  isOpen,
  onClose,
  onSave,
}: UserRoleAssignDialogProps) {
  const [roleSlug, setRoleSlug] = useState<RoleSlug>(currentRoleSlug);
  const [title, setTitle] = useState(currentTitle ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setRoleSlug(currentRoleSlug);
    setTitle(currentTitle ?? '');
  }, [currentRoleSlug, currentTitle]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (roleSlug === 'admin' && !title) {
      newErrors.title = 'Enter a job title for this admin.';
    }
    if (title && title.length > 60) {
      newErrors.title = 'Use 60 characters or fewer.';
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      await update('USER_ROLE', { roleSlug, title }, { id: userId });
      toast.success('Role updated');
      onSave(roleSlug, title);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="assign-role">Role</Label>
            <Select
              value={roleSlug}
              onValueChange={(value) => value && setRoleSlug(value as RoleSlug)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="assign-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {roleSlug === 'admin' && (
            <div className="space-y-1.5">
              <Label htmlFor="assign-title">Job title</Label>
              <Input
                id="assign-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sales manager"
                disabled={isSubmitting}
                maxLength={60}
                aria-invalid={!!errors.title}
              />
              {errors.title ? (
                <p className="text-risk text-xs">{errors.title}</p>
              ) : (
                <p className="text-text-muted text-xs">Up to 60 characters.</p>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Save role
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}