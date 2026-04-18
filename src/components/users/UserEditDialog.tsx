import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Shield, Briefcase, Lock } from 'lucide-react';
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

  const containerVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
    }),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white shadow-lg">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-0"
        >
          {/* Header */}
          <DialogHeader className="border-b border-slate-200 pb-6">
            <motion.div variants={itemVariants} custom={0} className="space-y-2">
              <DialogTitle className="font-display font-bold text-display-xs text-gray-900">
                Edit User
              </DialogTitle>
              <p className="font-sans text-text-sm text-gray-500">
                Update user role, position, and access settings
              </p>
            </motion.div>
          </DialogHeader>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 py-6">
            {/* Role & Permissions Section */}
            <motion.div variants={itemVariants} custom={1} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-ch-primary/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-ch-primary" />
                </div>
                <h3 className="font-sans font-medium text-text-sm text-gray-900">
                  Role & Permissions
                </h3>
              </div>

              {/* Role Selection */}
              <div>
                <Label htmlFor="edit-role" className="font-sans font-medium text-text-sm text-gray-700">
                  Role <span className="text-danger">*</span>
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
                  className="w-full h-10 px-3 mt-2 rounded-xl border-none bg-slate-50/80 font-sans text-text-sm transition-colors duration-150
                             hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-ch-secondary outline-none
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="font-sans text-text-xs text-gray-400 mt-2">
                  {roleSlug === 'super_admin'
                    ? 'Full platform access and system administration'
                    : roleSlug === 'admin'
                      ? 'Organizational management and user administration'
                      : 'Standard user permissions'}
                </p>
                {errors.roleSlug && (
                  <p className="font-sans text-text-xs text-danger mt-2 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 bg-danger rounded-full"></span>
                    {errors.roleSlug}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Admin Additional Info Section */}
            {roleSlug === 'admin' && (
              <motion.div
                variants={itemVariants}
                custom={2}
                className="space-y-4 bg-ch-primary/5 border border-ch-primary/20 rounded-2xl p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-ch-primary/15 flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-ch-primary" />
                  </div>
                  <h3 className="font-sans font-medium text-text-sm text-gray-900">
                    Admin Details
                  </h3>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="edit-title" className="font-sans font-medium text-text-sm text-gray-700">
                    Job Title <span className="text-danger">*</span>
                  </Label>
                  <p className="font-sans text-text-xs text-gray-400 mt-1">Maximum 60 characters</p>
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
                    className="mt-2 h-10 px-3 rounded-xl border-none bg-white/70 font-sans text-text-sm transition-colors duration-150
                               hover:bg-white focus:bg-white focus:ring-1 focus:ring-ch-secondary outline-none
                               placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.title && (
                    <p className="font-sans text-text-xs text-danger mt-2 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 bg-danger rounded-full"></span>
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Departments */}
                <div>
                  <Label htmlFor="edit-departments" className="font-sans font-medium text-text-sm text-gray-700">
                    Departments <span className="text-danger">*</span>
                  </Label>
                  <p className="font-sans text-text-xs text-gray-400 mt-1">Comma-separated list (e.g. Finance, HR)</p>
                  <Input
                    id="edit-departments"
                    value={departments}
                    onChange={(e) => {
                      setDepartments(e.target.value);
                      setErrors({});
                    }}
                    placeholder="Finance, HR, Registry"
                    disabled={isSubmitting}
                    className="mt-2 h-10 px-3 rounded-xl border-none bg-white/70 font-sans text-text-sm transition-colors duration-150
                               hover:bg-white focus:bg-white focus:ring-1 focus:ring-ch-secondary outline-none
                               placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.departments && (
                    <p className="font-sans text-text-xs text-danger mt-2 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 bg-danger rounded-full"></span>
                      {errors.departments}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Account Status Section */}
            <motion.div variants={itemVariants} custom={roleSlug === 'admin' ? 3 : 2} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-ch-secondary/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-ch-secondary" />
                </div>
                <h3 className="font-sans font-medium text-text-sm text-gray-900">
                  Account Status
                </h3>
              </div>

              <div>
                <Label htmlFor="edit-status" className="font-sans font-medium text-text-sm text-gray-700">
                  Status <span className="text-danger">*</span>
                </Label>
                <select
                  id="edit-status"
                  title="User status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  disabled={isSubmitting}
                  className="w-full h-10 px-3 mt-2 rounded-xl border-none bg-slate-50/80 font-sans text-text-sm transition-colors duration-150
                             hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-ch-secondary outline-none
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <p className="font-sans text-text-xs text-gray-400 mt-2">
                  {status === 'active'
                    ? 'User can access the system'
                    : 'User is temporarily disabled and cannot access the system'}
                </p>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              variants={itemVariants}
              custom={roleSlug === 'admin' ? 4 : 3}
              className="flex gap-3 justify-end pt-6 border-t border-slate-200"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="font-sans font-medium text-text-sm h-10 px-6 rounded-xl"
                >
                  Cancel
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isSubmitting || hasErrors}
                  className="bg-primary hover:bg-primary-hover text-primary-fg font-sans font-medium text-text-sm h-10 px-6 rounded-xl transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update User
                </Button>
              </motion.div>
            </motion.div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}