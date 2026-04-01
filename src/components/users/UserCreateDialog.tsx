import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { post } from '@/lib/api/crud';

interface CreateUserPayload {
    email: string;
    password: string;
    role_slug: string;
    title?: string;
}

interface UserCreateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUserPayload) => void;
}

const ROLE_OPTIONS = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
];

export function UserCreateDialog({ isOpen, onClose, onSubmit }: UserCreateDialogProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleSlug, setRoleSlug] = useState('user');
    const [title, setTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (!roleSlug) newErrors.roleSlug = 'Role is required';
        if (roleSlug === 'admin' && !title) newErrors.title = 'Title is required for admin';
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
            const payload: CreateUserPayload = { email, password, role_slug: roleSlug };
            if (roleSlug === 'admin' && title) payload.title = title;
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            disabled={isSubmitting}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            disabled={isSubmitting}
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    <div>
                        <Label htmlFor="create-role">Role</Label>
                        <select
                            id="create-role"
                            title="User role"
                            value={roleSlug}
                            onChange={(e) => setRoleSlug(e.target.value)}
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
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Department Manager"
                                disabled={isSubmitting}
                            />
                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                        </div>
                    )}

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create User
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}