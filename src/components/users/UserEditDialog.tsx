import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle } from '@/components/icons';
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
  { value: 'super_admin', label: 'Super admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
];

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-center gap-1 text-xs text-risk">
      <AlertCircle size={14} />
      {message}
    </p>
  );
}

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
    if (!roleSlug) newErrors.roleSlug = 'Choose a role.';
    if (roleSlug === 'admin') {
      if (!title) {
        newErrors.title = 'Enter a job title for this admin.';
      } else if (title.length > 60) {
        newErrors.title = 'Use 60 characters or fewer.';
      }
      if (!departments.trim()) {
        newErrors.departments = 'Enter at least one department for this admin.';
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
      toast.success('User updated');
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>Change the role, position and access for this account.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-role">Role</Label>
            <Select
              value={roleSlug}
              onValueChange={(value) => {
                setRoleSlug(value as RoleSlug);
                setErrors({});
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger id="edit-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-text-muted">
              {roleSlug === 'super_admin'
                ? 'Full platform access and system administration.'
                : roleSlug === 'admin'
                  ? 'Organisation management and user administration.'
                  : 'Standard user permissions.'}
            </p>
            <FieldError id="edit-role-error" message={errors.roleSlug} />
          </div>

          {/* Admin Additional Info Section */}
          {roleSlug === 'admin' && (
            <div className="space-y-4 border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-[.04em] text-text-muted">Admin details</p>

              <div className="space-y-1.5">
                <Label htmlFor="edit-title">Job title</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors({});
                  }}
                  placeholder="Sales manager"
                  disabled={isSubmitting}
                  maxLength={60}
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? 'edit-title-error' : undefined}
                />
                {errors.title
                  ? <FieldError id="edit-title-error" message={errors.title} />
                  : <p className="text-xs text-text-muted">Up to 60 characters.</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-departments">Departments</Label>
                <Input
                  id="edit-departments"
                  value={departments}
                  onChange={(e) => {
                    setDepartments(e.target.value);
                    setErrors({});
                  }}
                  placeholder="Finance, HR, Registry"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.departments}
                  aria-describedby={errors.departments ? 'edit-departments-error' : undefined}
                />
                {errors.departments
                  ? <FieldError id="edit-departments-error" message={errors.departments} />
                  : <p className="text-xs text-text-muted">Separate names with commas.</p>}
              </div>
            </div>
          )}

          {/* Account status */}
          <div className="space-y-1.5 border-t border-line pt-4">
            <Label htmlFor="edit-status">Account status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as 'active' | 'inactive')}
              disabled={isSubmitting}
            >
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-text-muted">
              {status === 'active'
                ? 'This person can sign in.'
                : 'This account is disabled and cannot sign in.'}
            </p>
          </div>

          <DialogFooter className="gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || hasErrors}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
