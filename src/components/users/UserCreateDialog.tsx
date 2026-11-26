import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ChevronLeft, ChevronRight, AlertCircle } from '@/components/icons';
import { toast } from 'sonner';
import { post, list } from '@/lib/api/crud';
import type { RoleSlug, Permission } from '@/types/rbac';

export interface CreateUserPayload {
    identifier: string;
    first_name: string;
    last_name: string;
    password: string;
    role_id: string;
    is_active: boolean;
    position?: string;
    department_ids?: string[];
}

interface UserCreateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUserPayload) => void;
}

interface Department {
    id: string;
    name: string;
}

const ROLE_OPTIONS: { value: RoleSlug; label: string }[] = [
    { value: 'super_admin', label: 'Super admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
];

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

export function UserCreateDialog({ isOpen, onClose, onSubmit }: UserCreateDialogProps) {
    const [step, setStep] = useState(1);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleSlug, setRoleSlug] = useState<RoleSlug>('user');
    const [title, setTitle] = useState('');
    const [departmentIds, setDepartmentIds] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Permissions state for Step 2
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

    // Fetch departments on mount
    useEffect(() => {
        if (isOpen) {
            fetchDepartments();
            if (step === 2) {
                loadPermissions();
            }
        }
    }, [isOpen, step]);

    const fetchDepartments = async () => {
        setIsDepartmentsLoading(true);
        try {
            const data: any = await list('DEPARTMENTS');
            if (Array.isArray(data)) {
                setDepartments(data);
            } else if (data?.items && Array.isArray(data.items)) {
                setDepartments(data.items);
            } else if (data?.data && Array.isArray(data.data)) {
                setDepartments(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch departments:', error);
            setDepartments([]);
        } finally {
            setIsDepartmentsLoading(false);
        }
    };

    const loadPermissions = async () => {
        setIsLoadingPermissions(true);
        try {
            const data = await list('ADMIN_PERMISSIONS');
            setAllPermissions(data ?? []);
        } catch (error) {
            console.error('Error loading permissions:', error);
        } finally {
            setIsLoadingPermissions(false);
        }
    };

    const validateStep1 = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!firstName.trim()) newErrors.firstName = 'Enter a first name.';
        if (!lastName.trim()) newErrors.lastName = 'Enter a last name.';

        if (!email.trim()) {
            newErrors.email = 'Enter an email address.';
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            newErrors.email = 'Enter a full email address, like name@company.co.zm.';
        }

        if (!password) {
            newErrors.password = 'Enter a password.';
        } else if (password.length < 8) {
            newErrors.password = 'Use at least 8 characters.';
        }

        if (!roleSlug) newErrors.roleSlug = 'Choose a role.';

        if (roleSlug === 'admin' && !title.trim()) {
            newErrors.title = 'Enter a position for this admin.';
        }
        if (roleSlug === 'admin' && !departmentIds.length) {
            newErrors.departmentIds = 'Choose at least one department for this admin.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handlePreviousStep = () => {
        setStep(1);
    };

    const toggleDepartment = (deptId: string) => {
        setDepartmentIds(prev =>
            prev.includes(deptId)
                ? prev.filter(id => id !== deptId)
                : [...prev, deptId]
        );
    };

    const handleSubmit = async () => {
        if (!validateStep1()) return;

        setIsSubmitting(true);
        try {
            const payload: CreateUserPayload = {
                identifier: email.trim(),
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                password,
                role_id: roleSlug,
                is_active: isActive,
                ...(roleSlug === 'admin' && {
                    position: title.trim(),
                    department_ids: departmentIds
                }),
            };

            await post('USERS', payload);
            toast.success('User created');
            onSubmit(payload);
            handleClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setRoleSlug('user');
        setTitle('');
        setDepartmentIds([]);
        setIsActive(true);
        setErrors({});
        setSelectedPermissions([]);
        onClose();
    };

    const fieldError = (key: string) =>
        errors[key] ? (
            <p id={`create-user-${key}-error`} className="flex items-center gap-1 text-xs text-risk">
                <AlertCircle size={14} />
                {errors[key]}
            </p>
        ) : null;

    const errorProps = (key: string) => ({
        'aria-invalid': !!errors[key],
        'aria-describedby': errors[key] ? `create-user-${key}-error` : undefined,
    });

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <p className="text-xs text-text-muted">Step <span className="font-mono">{step}</span> of <span className="font-mono">2</span></p>
                    <DialogTitle>Create user</DialogTitle>
                    <DialogDescription>
                        {step === 1 ? 'Add the user details and account settings.' : 'Choose permissions for this user.'}
                    </DialogDescription>
                </DialogHeader>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {/* Name Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="create-user-first-name">First name</Label>
                                    <Input
                                        id="create-user-first-name"
                                        value={firstName}
                                        onChange={(e) => {
                                            setFirstName(e.target.value);
                                            if (errors.firstName) setErrors({ ...errors, firstName: '' });
                                        }}
                                        placeholder="Natasha"
                                        {...errorProps('firstName')}
                                    />
                                    {fieldError('firstName')}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="create-user-last-name">Last name</Label>
                                    <Input
                                        id="create-user-last-name"
                                        value={lastName}
                                        onChange={(e) => {
                                            setLastName(e.target.value);
                                            if (errors.lastName) setErrors({ ...errors, lastName: '' });
                                        }}
                                        placeholder="Lungu"
                                        {...errorProps('lastName')}
                                    />
                                    {fieldError('lastName')}
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <Label htmlFor="create-user-email">Email address</Label>
                                <Input
                                    id="create-user-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) setErrors({ ...errors, email: '' });
                                    }}
                                    placeholder="name@company.co.zm"
                                    {...errorProps('email')}
                                />
                                {fieldError('email')}
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <Label htmlFor="create-user-password">Password</Label>
                                <Input
                                    id="create-user-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) setErrors({ ...errors, password: '' });
                                    }}
                                    {...errorProps('password')}
                                />
                                {errors.password ? fieldError('password') : (
                                    <p className="text-xs text-text-muted">At least 8 characters.</p>
                                )}
                            </div>

                            {/* Role */}
                            <div className="space-y-1.5">
                                <Label htmlFor="create-user-role">Role</Label>
                                <Select value={roleSlug} onValueChange={(v) => {
                                    setRoleSlug(v as RoleSlug);
                                    if (errors.roleSlug) setErrors({ ...errors, roleSlug: '' });
                                }}>
                                    <SelectTrigger id="create-user-role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLE_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldError('roleSlug')}
                            </div>

                            {/* Admin-only fields */}
                            {roleSlug === 'admin' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 pt-4 border-t border-line"
                                >
                                    <p className="text-xs font-semibold uppercase tracking-[.04em] text-text-muted">
                                        Admin settings
                                    </p>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="create-user-position">Position</Label>
                                        <Input
                                            id="create-user-position"
                                            value={title}
                                            onChange={(e) => {
                                                setTitle(e.target.value);
                                                if (errors.title) setErrors({ ...errors, title: '' });
                                            }}
                                            placeholder="Sales manager"
                                            {...errorProps('title')}
                                        />
                                        {fieldError('title')}
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-sm font-medium text-text-secondary">Departments</p>
                                        {isDepartmentsLoading ? (
                                            <div role="status" aria-busy="true" aria-label="Loading departments" className="grid gap-2 py-2">
                                                <div className="skeleton h-4 w-1/2 rounded-xs" />
                                                <div className="skeleton h-4 w-2/3 rounded-xs" />
                                            </div>
                                        ) : (
                                            <div className="space-y-1 p-2 rounded-md border border-line">
                                                {departments.length === 0 ? (
                                                    <p className="p-2 text-sm text-text-muted">No departments yet.</p>
                                                ) : (
                                                    departments.map((dept) => (
                                                        <label key={dept.id} className="flex items-center gap-2 cursor-pointer hover:bg-surface-2 p-2 rounded-sm">
                                                            <Checkbox
                                                                checked={departmentIds.includes(dept.id)}
                                                                onCheckedChange={() => toggleDepartment(dept.id)}
                                                            />
                                                            <span className="text-sm text-text-primary font-medium">
                                                                {dept.name}
                                                            </span>
                                                        </label>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                        {fieldError('departmentIds')}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            <div className="rounded-md bg-field p-4 text-sm text-text-secondary">
                                <p className="font-semibold text-text-primary">Roles and permissions</p>
                                <p className="text-xs mt-1">
                                    Permissions for {firstName} {lastName} ({email}), role {roleSlug.replace(/_/g, ' ')}.
                                </p>
                            </div>

                            {isLoadingPermissions ? (
                                <div role="status" aria-busy="true" aria-label="Loading permissions" className="grid gap-3 py-4">
                                    <div className="skeleton h-4 w-1/3 rounded-xs" />
                                    <div className="skeleton h-4 w-full rounded-xs" />
                                    <div className="skeleton h-4 w-2/3 rounded-xs" />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {allPermissions.length === 0 ? (
                                        <p className="text-sm text-text-muted">No permissions available.</p>
                                    ) : (
                                        Object.entries(
                                            allPermissions.reduce<Record<string, typeof allPermissions>>((acc, perm) => {
                                                if (!acc[perm.resource]) acc[perm.resource] = [];
                                                acc[perm.resource].push(perm);
                                                return acc;
                                            }, {})
                                        ).map(([resource, perms]) => {
                                            const resourcePermsIds = perms.map(p => String(p.id));
                                            const allSelectedInResource = resourcePermsIds.length > 0 && resourcePermsIds.every(id =>
                                                selectedPermissions.includes(id) || roleSlug === 'super_admin'
                                            );

                                            const toggleAllInResource = () => {
                                                if (roleSlug === 'super_admin') return;

                                                if (allSelectedInResource) {
                                                    // Deselect all
                                                    setSelectedPermissions(prev =>
                                                        prev.filter(id => !resourcePermsIds.includes(id))
                                                    );
                                                } else {
                                                    // Select all
                                                    setSelectedPermissions(prev => [
                                                        ...prev,
                                                        ...resourcePermsIds.filter(id => !prev.includes(id))
                                                    ]);
                                                }
                                            };

                                            return (
                                                <div key={resource}>
                                                    <div className="flex items-center justify-between gap-3 mb-2">
                                                        <p className="text-xs font-semibold text-text-muted uppercase tracking-[.04em]">
                                                            {resource}
                                                        </p>
                                                        <Button
                                                            type="button"
                                                            onClick={toggleAllInResource}
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={roleSlug === 'super_admin'}
                                                        >
                                                            {allSelectedInResource ? 'Clear all' : 'Select all'}
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                                                        {perms.map((perm) => {
                                                            const permId = String(perm.id);
                                                            const isChecked = selectedPermissions.includes(permId) || roleSlug === 'super_admin';
                                                            return (
                                                                <label
                                                                    key={perm.id}
                                                                    className="flex items-start gap-2 text-sm cursor-pointer group"
                                                                >
                                                                    <Checkbox
                                                                        checked={isChecked}
                                                                        onCheckedChange={() => {
                                                                            if (roleSlug === 'super_admin') return;
                                                                            setSelectedPermissions(prev =>
                                                                                prev.includes(permId)
                                                                                    ? prev.filter(id => id !== permId)
                                                                                    : [...prev, permId]
                                                                            );
                                                                        }}
                                                                        disabled={roleSlug === 'super_admin'}
                                                                        className="mt-0.5"
                                                                    />
                                                                    <span className="flex flex-col gap-0.5 min-w-0">
                                                                        <span className="text-text-primary font-medium leading-tight">
                                                                            {perm.action}
                                                                        </span>
                                                                        {perm.description && (
                                                                            <span className="text-text-muted text-xs leading-tight">
                                                                                {perm.description}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <p className="rounded-md bg-field p-3 text-xs text-text-secondary">
                                        You can change permissions after the user is created, from Manage permissions.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <DialogFooter className="gap-3 pt-2">
                    <Button
                        variant="secondary"
                        onClick={step === 1 ? handleClose : handlePreviousStep}
                    >
                        {step === 1 ? 'Cancel' : (
                            <>
                                <ChevronLeft />
                                Back
                            </>
                        )}
                    </Button>

                    {step === 1 ? (
                        <Button onClick={handleNextStep}>
                            Continue
                            <ChevronRight />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    Creating
                                </>
                            ) : (
                                'Create user'
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
