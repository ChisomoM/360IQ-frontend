import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { post } from '@/lib/api/crud';
import type { RoleSlug } from '@/types/rbac';

export interface CreateUserPayload {
    email: string;
    password: string;
    role_slug: RoleSlug;
    title?: string;
    departments?: string[];
}

interface UserCreateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUserPayload) => void;
}

const ROLE_OPTIONS: { value: RoleSlug; label: string }[] = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
];

export function UserCreateDialog({ isOpen, onClose, onSubmit }: UserCreateDialogProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleSlug, setRoleSlug] = useState<RoleSlug>('user');
    const [title, setTitle] = useState('');
    const [departments, setDepartments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        // Email
        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            newErrors.email = 'Invalid email format (e.g. user@example.com)';
        }
        // Password — minimum 8 chars per spec
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        // Role
        if (!roleSlug) newErrors.roleSlug = 'Role is required';
        // Admin-conditional fields
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

            const payload: CreateUserPayload = {
                email,
                password,
                role_slug: roleSlug,
                ...(roleSlug === 'admin' && { title, departments: deptList }),
            };
            await post('USERS', payload);
            toast.success('User created successfully');
            onSubmit(payload);
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <Label htmlFor="create-email">Email</Label>
                        <Input
                            id="create-email"
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                            placeholder="user@example.com"
                            disabled={isSubmitting}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <Label htmlFor="create-password">Password</Label>
                        <Input
                            id="create-password"
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
                            placeholder="Min 8 characters"
                            disabled={isSubmitting}
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    {/* Role */}
                    <div>
                        <Label htmlFor="create-role">Role</Label>
                        <select
                            id="create-role"
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
                            <Label htmlFor="create-title">Title <span className="text-gray-400 text-xs">(max 60 chars)</span></Label>
                            <Input
                                id="create-title"
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
                            <Label htmlFor="create-departments">Departments <span className="text-gray-400 text-xs">(comma-separated)</span></Label>
                            <Input
                                id="create-departments"
                                value={departments}
                                onChange={(e) => { setDepartments(e.target.value); setErrors({}); }}
                                placeholder="e.g. Finance, HR, Registry"
                                disabled={isSubmitting}
                            />
                            {errors.departments && <p className="text-red-500 text-xs mt-1">{errors.departments}</p>}
                        </div>
                    )}

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || hasErrors}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create User
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}