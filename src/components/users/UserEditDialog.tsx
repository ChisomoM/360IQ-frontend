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
      <DialogContent className="sm:max-w-2xl bg-white">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900">Edit User</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">Update user role, position, and access settings</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Role & Permissions Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-6 bg-primary rounded-full"></div>
              <h3 className="text-sm font-semibold text-gray-900">Role & Permissions</h3>
            </div>

            {/* Role Selection */}
            <div>
              <Label htmlFor="edit-role" className="text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </Label>
              <select
                id="edit-role"
                title="User role"
                value={roleSlug}
                onChange={(e) => {
                  setRoleSlug(e.target.value as RoleSlug);
                  setErrors({});
                }}
                disabled={isSubmitting}
                className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm mt-1.5 font-medium bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                {roleSlug === 'super_admin'
                  ? 'Full platform access and system administration'
                  : roleSlug === 'admin'
                    ? 'Organizational management and user administration'
                    : 'Standard user permissions'}
              </p>
              {errors.roleSlug && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.roleSlug}
                </p>
              )}
            </div>
          </div>

          {/* Admin Additional Info Section */}
          {roleSlug === 'admin' && (
            <div className="space-y-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-6 bg-primary rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900">Admin Details</h3>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="edit-title" className="text-sm font-medium text-gray-700">
                  Job Title <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">Maximum 60 characters</p>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors({});
                  }}
                  placeholder="e.g. Department Manager"
                  disabled={isSubmitting}
                  maxLength={60}
                  className="mt-1.5 h-10"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Departments */}
              <div>
                <Label htmlFor="edit-departments" className="text-sm font-medium text-gray-700">
                  Departments <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">Comma-separated list (e.g. Finance, HR)</p>
                <Input
                  id="edit-departments"
                  value={departments}
                  onChange={(e) => {
                    setDepartments(e.target.value);
                    setErrors({});
                  }}
                  placeholder="Finance, HR, Registry"
                  disabled={isSubmitting}
                  className="mt-1.5 h-10"
                />
                {errors.departments && (
                  <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.departments}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Account Status Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-6 bg-primary rounded-full"></div>
              <h3 className="text-sm font-semibold text-gray-900">Account Status</h3>
            </div>

            <div>
              <Label htmlFor="edit-status" className="text-sm font-medium text-gray-700">
                Status <span className="text-red-500">*</span>
              </Label>
              <select
                id="edit-status"
                title="User status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                disabled={isSubmitting}
                className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm mt-1.5 font-medium bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                {status === 'active'
                  ? 'User can access the system'
                  : 'User is temporarily disabled and cannot access the system'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || hasErrors}
              className="bg-primary hover:bg-primary/90 text-white px-6"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}