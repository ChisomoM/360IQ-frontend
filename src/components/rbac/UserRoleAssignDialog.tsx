import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
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
  { value: 'super_admin', label: 'Super Admin' },
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
      newErrors.title = 'Title is required for admin';
    }
    if (title && title.length > 60) {
      newErrors.title = 'Title must be under 60 characters';
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
      toast.success('Role updated successfully');
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
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Assign Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="assign-role">Role</Label>
            <select
              id="assign-role"
              title="Assign role"
              value={roleSlug}
              onChange={(e) => setRoleSlug(e.target.value as RoleSlug)}
              disabled={isSubmitting}
              className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {roleSlug === 'admin' && (
            <div>
              <Label htmlFor="assign-title">Title</Label>
              <Input
                id="assign-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Department Manager (max 60 chars)"
                disabled={isSubmitting}
                maxLength={60}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}