import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { update } from '@/lib/api/crud';
import type { AuthUser } from '@/types/auth';

interface UpdateUserPayload {
  role_slug: string;
  title?: string;
  status: 'active' | 'inactive';
}

interface UserEditDialogProps {
  user: AuthUser;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateUserPayload) => void;
}

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
];

export function UserEditDialog({ user, isOpen, onClose, onSubmit }: UserEditDialogProps) {
  const [roleSlug, setRoleSlug] = useState(user.roleSlug ?? 'user');
  const [title, setTitle] = useState(user.title ?? '');
  const [status, setStatus] = useState<'active' | 'inactive'>(
    user.isActive ? 'active' : 'inactive'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setRoleSlug(user.roleSlug ?? 'user');
    setTitle(user.title ?? '');
    setStatus(user.isActive ? 'active' : 'inactive');
  }, [user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!roleSlug) newErrors.roleSlug = 'Role is required';
    if (roleSlug === 'admin' && !title) newErrors.title = 'Title is required for admin';
    if (title && title.length > 60) newErrors.title = 'Title must be under 60 characters';
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
      const payload: UpdateUserPayload = { role_slug: roleSlug, status };
      if (roleSlug === 'admin' && title) payload.title = title;
      await update('USERS', payload, { id: String(user.id) });
      toast.success('User updated successfully');
      onSubmit(payload);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-role">Role</Label>
            <select
              id="edit-role"
              title="User role"
              value={roleSlug}
              onChange={(e) => setRoleSlug(e.target.value as string)}
              disabled={isSubmitting}
              className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {errors.roleSlug && <p className="text-red-500 text-xs mt-1">{errors.roleSlug}</p>}
          </div>

          {roleSlug === 'admin' && (
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Department Manager (max 60 chars)"
                disabled={isSubmitting}
                maxLength={60}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
          )}

          <div>
            <Label htmlFor="edit-status">Status</Label>
            <select
              id="edit-status"
              title="User status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              disabled={isSubmitting}
              className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}