import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { update } from '@/lib/api/crud';
import type { AuthUser } from '@/types/auth';
import type { RoleSlug } from '@/types/rbac';

export interface UpdateUserPayload {
  role_slug: RoleSlug;
  title?: string;
  departments?: string[];
  status: 'active' | 'inactive';
}

interface UserEditDialogProps {
  user: AuthUser;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateUserPayload) => void;
}

const ROLE_OPTIONS: { value: RoleSlug; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
];

export function UserEditDialog({ user, isOpen, onClose, onSubmit }: UserEditDialogProps) {
  const [roleSlug, setRoleSlug] = useState<RoleSlug>(user.roleSlug ?? 'user');
  const [title, setTitle] = useState(user.title ?? '');
  const [departments, setDepartments] = useState<string>(
    user.departments?.map(d => d.name).join(', ') ?? ''
  );
  const [status, setStatus] = useState<'active' | 'inactive'>(
    user.isActive ? 'active' : 'inactive'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Re-populate whenever the user prop changes (different row selected)
  useEffect(() => {
    setRoleSlug(user.roleSlug ?? 'user');
    setTitle(user.title ?? '');
    setDepartments(user.departments?.map(d => d.name).join(', ') ?? '');
    setStatus(user.isActive ? 'active' : 'inactive');
    setErrors({});
  }, [user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!roleSlug) newErrors.roleSlug = 'Role is required';
    if (roleSlug === 'admin') {
      if (!title) {
        newErrors.title = 'Title is required for admin';
      } else if (title.length > 60) {
        newErrors.title = 'Title must be 60 characters or fewer';
      }
      if (!departments.trim()) {
        newErrors.departments = 'At least one department is required for admin';
      }
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
      const deptList = departments
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);

      const payload: UpdateUserPayload = {
        role_slug: roleSlug,
        status,
        ...(roleSlug === 'admin' && { title, departments: deptList }),
      };
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

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role */}
          <div>
            <Label htmlFor="edit-role">Role</Label>
            <select
              id="edit-role"
              title="User role"
              value={roleSlug}
              onChange={(e) => { setRoleSlug(e.target.value as RoleSlug); setErrors({}); }}
              disabled={isSubmitting}
              className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {errors.roleSlug && <p className="text-red-500 text-xs mt-1">{errors.roleSlug}</p>}
          </div>

          {/* Admin-only: Title */}
          {roleSlug === 'admin' && (
            <div>
              <Label htmlFor="edit-title">Title <span className="text-gray-400 text-xs">(max 60 chars)</span></Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors({}); }}
                placeholder="e.g. Department Manager"
                disabled={isSubmitting}
                maxLength={60}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
          )}

          {/* Admin-only: Departments */}
          {roleSlug === 'admin' && (
            <div>
              <Label htmlFor="edit-departments">Departments <span className="text-gray-400 text-xs">(comma-separated)</span></Label>
              <Input
                id="edit-departments"
                value={departments}
                onChange={(e) => { setDepartments(e.target.value); setErrors({}); }}
                placeholder="e.g. Finance, HR, Registry"
                disabled={isSubmitting}
              />
              {errors.departments && <p className="text-red-500 text-xs mt-1">{errors.departments}</p>}
            </div>
          )}

          {/* Status */}
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
            <Button type="submit" disabled={isSubmitting || hasErrors}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}