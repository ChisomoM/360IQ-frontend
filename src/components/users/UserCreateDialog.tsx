import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RoleSlug } from '@/types/rbac';

export interface CreateUserPayload {
  email: string;
  password?: string;
  roleSlug: RoleSlug | '';
  title?: string;
  departments?: string[];
}

export interface UserCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserPayload) => void;
}

export default function UserCreateDialog({ isOpen, onClose, onSubmit }: UserCreateDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleSlug, setRoleSlug] = useState<RoleSlug | ''>('');
  const [title, setTitle] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!roleSlug) {
      newErrors.roleSlug = 'Role is required';
    }

    if (roleSlug === 'admin') {
      if (!title) {
        newErrors.title = 'Title is required for admin';
      } else if (title.length > 60) {
        newErrors.title = 'Title cannot exceed 60 characters';
      }

      if (!departments.length) {
        newErrors.departments = 'At least one department is required for admin';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (isOpen) validate();
  }, [email, password, roleSlug, title, departments, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        email,
        password,
        roleSlug,
        title: roleSlug === 'admin' ? title : undefined,
        departments: roleSlug === 'admin' ? departments : undefined,
      });
      // reset form
      setEmail('');
      setPassword('');
      setRoleSlug('');
      setTitle('');
      setDepartments([]);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const opts = Array.from(e.target.selectedOptions).map(o => o.value);
    setDepartments(opts);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
            <select
              id="role"
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={roleSlug}
              onChange={e => setRoleSlug(e.target.value as RoleSlug)}
            >
              <option value="" disabled>Select Role</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            {errors.roleSlug && <p className="text-red-500 text-sm mt-1">{errors.roleSlug}</p>}
          </div>

          {roleSlug === 'admin' && (
            <>
              <div>
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="departments">Departments <span className="text-red-500">*</span></Label>
                <select
                  id="departments"
                  multiple
                  className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={departments}
                  onChange={handleDeptChange}
                >
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="IT">IT</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                {errors.departments && <p className="text-red-500 text-sm mt-1">{errors.departments}</p>}
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={hasErrors || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
