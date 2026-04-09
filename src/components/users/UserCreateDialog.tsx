import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ChevronLeft, ChevronRight, Mail, Lock, Users, Building } from 'lucide-react';
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
    { value: 'super_admin', label: 'Super Admin' },
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

        if (!firstName.trim()) newErrors.firstName = 'First name is required';
        if (!lastName.trim()) newErrors.lastName = 'Last name is required';

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!roleSlug) newErrors.roleSlug = 'Role is required';

        if (roleSlug === 'admin' && !title.trim()) {
            newErrors.title = 'Position is required for admin users';
        }
        if (roleSlug === 'admin' && !departmentIds.length) {
            newErrors.departmentIds = 'At least one department is required for admin users';
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
            toast.success('User created successfully');
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

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden border-none shadow-2xl">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-200">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="font-display font-bold text-display-sm text-gray-900">
                                Create New User
                            </h1>
                            <p className="font-sans text-text-sm text-gray-600 mt-1">
                                {step === 1 ? 'Add user details and account settings' : 'Configure roles and permissions'}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
                            <span className="text-sm font-semibold text-gray-900">{step}</span>
                            <span className="text-sm text-gray-600">/2</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                {/* Name Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-sans font-semibold text-text-sm text-gray-900">
                                            First Name *
                                        </Label>
                                        <Input
                                            value={firstName}
                                            onChange={(e) => {
                                                setFirstName(e.target.value);
                                                if (errors.firstName) setErrors({ ...errors, firstName: '' });
                                            }}
                                            placeholder="e.g. John"
                                            className={`h-11 border-gray-200 focus:ring-primary shadow-sm rounded-lg ${
                                                errors.firstName ? 'border-red-500' : ''
                                            }`}
                                        />
                                        {errors.firstName && (
                                            <p className="text-xs text-red-600">{errors.firstName}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-sans font-semibold text-text-sm text-gray-900">
                                            Last Name *
                                        </Label>
                                        <Input
                                            value={lastName}
                                            onChange={(e) => {
                                                setLastName(e.target.value);
                                                if (errors.lastName) setErrors({ ...errors, lastName: '' });
                                            }}
                                            placeholder="e.g. Smith"
                                            className={`h-11 border-gray-200 focus:ring-primary shadow-sm rounded-lg ${
                                                errors.lastName ? 'border-red-500' : ''
                                            }`}
                                        />
                                        {errors.lastName && (
                                            <p className="text-xs text-red-600">{errors.lastName}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label className="font-sans font-semibold text-text-sm text-gray-900 flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-blue-600" />
                                        Email Address *
                                    </Label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (errors.email) setErrors({ ...errors, email: '' });
                                        }}
                                        placeholder="user@organization.com"
                                        className={`h-11 border-gray-200 focus:ring-primary shadow-sm rounded-lg ${
                                            errors.email ? 'border-red-500' : ''
                                        }`}
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-red-600">{errors.email}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <Label className="font-sans font-semibold text-text-sm text-gray-900 flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-blue-600" />
                                        Password *
                                    </Label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password) setErrors({ ...errors, password: '' });
                                        }}
                                        placeholder="Minimum 8 characters"
                                        className={`h-11 border-gray-200 focus:ring-primary shadow-sm rounded-lg ${
                                            errors.password ? 'border-red-500' : ''
                                        }`}
                                    />
                                    {errors.password && (
                                        <p className="text-xs text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                {/* Role */}
                                <div className="space-y-2">
                                    <Label className="font-sans font-semibold text-text-xs text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                        <Users className="h-4 w-4 text-blue-600" />
                                        Role *
                                    </Label>
                                    <Select value={roleSlug} onValueChange={(v) => {
                                        setRoleSlug(v as RoleSlug);
                                        if (errors.roleSlug) setErrors({ ...errors, roleSlug: '' });
                                    }}>
                                        <SelectTrigger className="h-11 border-gray-200 bg-white shadow-sm rounded-lg">
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
                                    {errors.roleSlug && (
                                        <p className="text-xs text-red-600">{errors.roleSlug}</p>
                                    )}
                                </div>

                                {/* Admin-only fields */}
                                {roleSlug === 'admin' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 pt-4 border-t border-gray-200"
                                    >
                                        <p className="font-sans text-text-xs text-gray-600 uppercase tracking-wider font-medium">
                                            Admin Configuration
                                        </p>
                                        <div className="space-y-2">
                                            <Label className="font-sans font-semibold text-text-sm text-gray-900">
                                                Position *
                                            </Label>
                                            <Input
                                                value={title}
                                                onChange={(e) => {
                                                    setTitle(e.target.value);
                                                    if (errors.title) setErrors({ ...errors, title: '' });
                                                }}
                                                placeholder="e.g. Head of Admissions"
                                                className={`h-11 border-gray-200 focus:ring-primary shadow-sm rounded-lg ${
                                                    errors.title ? 'border-red-500' : ''
                                                }`}
                                            />
                                            {errors.title && (
                                                <p className="text-xs text-red-600">{errors.title}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-sans font-semibold text-text-sm text-gray-900 flex items-center gap-2">
                                                <Building className="h-4 w-4 text-blue-600" />
                                                Departments *
                                            </Label>
                                            {isDepartmentsLoading ? (
                                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
                                                    Loading departments...
                                                </div>
                                            ) : (
                                                <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    {departments.length === 0 ? (
                                                        <p className="text-sm text-gray-600">No departments available</p>
                                                    ) : (
                                                        departments.map((dept) => (
                                                            <label key={dept.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={departmentIds.includes(dept.id)}
                                                                    onChange={() => toggleDepartment(dept.id)}
                                                                    className="h-4 w-4 rounded border-gray-300"
                                                                />
                                                                <span className="text-sm text-gray-700 font-medium">
                                                                    {dept.name}
                                                                </span>
                                                            </label>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                            {errors.departmentIds && (
                                                <p className="text-xs text-red-600">{errors.departmentIds}</p>
                                            )}
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
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                                    <p className="font-semibold">Roles & Permissions</p>
                                    <p className="text-xs mt-1 text-blue-700">
                                        Configure permissions for {firstName} {lastName} ({email}) as a {roleSlug}
                                    </p>
                                </div>

                                {isLoadingPermissions ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {allPermissions.length === 0 ? (
                                            <p className="text-sm text-gray-600">No permissions available</p>
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
                                                        <div className="flex items-center justify-between gap-3 mb-3">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                                {resource}
                                                            </p>
                                                            <Button
                                                                onClick={toggleAllInResource}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-2 text-xs font-medium text-blue-600 hover:bg-blue-50"
                                                                disabled={roleSlug === 'super_admin'}
                                                            >
                                                                {allSelectedInResource ? 'Deselect All' : 'Select All'}
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 pl-2">
                                                            {perms.map((perm) => {
                                                                const permId = String(perm.id);
                                                                const isChecked = selectedPermissions.includes(permId) || roleSlug === 'super_admin';
                                                                return (
                                                                    <label
                                                                        key={perm.id}
                                                                        className="flex items-start gap-2 text-sm cursor-pointer group"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isChecked}
                                                                            onChange={() => {
                                                                                if (roleSlug === 'super_admin') return;
                                                                                setSelectedPermissions(prev =>
                                                                                    prev.includes(permId)
                                                                                        ? prev.filter(id => id !== permId)
                                                                                        : [...prev, permId]
                                                                                );
                                                                            }}
                                                                            disabled={roleSlug === 'super_admin'}
                                                                            className="h-4 w-4 mt-0.5 flex-shrink-0"
                                                                        />
                                                                        <div className="flex flex-col gap-0.5 min-w-0">
                                                                            <span className="text-gray-700 font-medium leading-tight">
                                                                                {perm.action}
                                                                            </span>
                                                                            {perm.description && (
                                                                                <span className="text-gray-400 text-xs leading-tight">
                                                                                    {perm.description}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700 mt-3">
                                            💡 Tip: Permissions can be customized after user creation through User Permissions.
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <DialogFooter className="flex gap-3 border-t border-gray-200 bg-gray-50 px-8 py-4">
                    <Button
                        variant="outline"
                        onClick={step === 1 ? handleClose : handlePreviousStep}
                        className="h-11"
                    >
                        {step === 1 ? 'Cancel' : (
                            <>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Back
                            </>
                        )}
                    </Button>

                    {step === 1 ? (
                        <Button
                            onClick={handleNextStep}
                            className="h-11 bg-primary text-white hover:bg-primary-dark"
                        >
                            Continue
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="h-11 bg-primary text-white hover:bg-primary-dark"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create User'
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}