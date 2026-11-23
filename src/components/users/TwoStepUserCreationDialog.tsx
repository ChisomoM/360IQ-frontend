import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PermissionAssignmentStep } from '@/components/users/PermissionAssignmentStep';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { fetchData, list } from '@/lib/api/crud';
import type { UserRole } from '@/lib/constants';
import type { Permission } from '@/types/rbac';

interface TwoStepUserCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
}

export function TwoStepUserCreationDialog({
  isOpen,
  onClose,
  onUserCreated,
}: TwoStepUserCreationDialogProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

  // Step 1: User details
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'admin' as UserRole,
  });

  // Step 2: Permissions
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Load permissions when dialog opens or step 2 is reached
  useEffect(() => {
    if (isOpen && step === 2) {
      loadPermissions();
    }
  }, [isOpen, step]);

  const loadPermissions = async () => {
    setIsLoadingPermissions(true);
    try {
      const data = await list('ADMIN_PERMISSIONS');
      setAllPermissions(data ?? []);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const validateStep1 = (): boolean => {
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return false;
    }
    if (!formData.role) {
      toast.error('Role is required');
      return false;
    }
    return true;
  };

  const handleNextStep = async () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handlePreviousStep = () => {
    setStep(1);
  };

  const handleCreateUser = async () => {
    if (!validateStep1()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        role_name: formData.role,
        is_active: true,
        is_verified: true,
      };

      await fetchData('USERS', 'POST', {}, payload);

      // Note: Permission assignment to user would happen here if the backend supports it
      // await fetchData('USER_PERMISSIONS', 'POST', {}, {
      //   user_id: newUser.id,
      //   permission_ids: selectedPermissions,
      // });

      toast.success('User created successfully');
      handleClose();
      onUserCreated?.();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'admin',
    });
    setSelectedPermissions([]);
    onClose();
  };

  const getRoleDescription = (role: UserRole): string => {
    const descriptions: Record<string, string> = {
      super_admin: 'Full system access',
      admin: 'Administrative access',
      user: 'Standard user access',
      records_authority: 'Records management authority',
      dept_head: 'Department head functionality',
      staff_member: 'Staff member access',
      finance_officer: 'Finance officer access',
      hr_officer: 'HR officer access',
      auditor: 'Auditor access',
    };
    return descriptions[role] || 'Standard access';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto rounded-xl shadow-lg">
        <DialogHeader className="border-b border-gray-100 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold text-text-primary">
                Create New User
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-gray-500 font-medium">
                {step === 1 ? 'Step 1: User Details' : 'Step 2: Permission Assignment'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-signal-tint rounded-md border border-line">
              <span className="text-sm font-semibold text-signal-text">{step}</span>
              <span className="text-sm text-signal-text">/2</span>
            </div>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="flex gap-3 my-6">
          <div className="flex-1 h-1.5 bg-signal rounded-full transition-all duration-300" />
          <div
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              step >= 2
                ? 'bg-signal'
                : 'bg-surface-2'
            }`}
          />
        </div>

        {/* Step 1: User Details */}
        {step === 1 && (
          <div className="grid gap-5 py-8">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="John"
                  disabled={isSubmitting}
                  className="border-gray-200 rounded-lg focus:border-blue-400 focus:ring-blue-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Doe"
                  disabled={isSubmitting}
                  className="border-gray-200 rounded-lg focus:border-blue-400 focus:ring-blue-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@360iq.com"
                disabled={isSubmitting}
                className="border-gray-200 rounded-lg focus:border-blue-400 focus:ring-blue-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
                disabled={isSubmitting}
                className="border-gray-200 rounded-lg focus:border-blue-400 focus:ring-blue-50"
              />
              <p className="text-xs text-gray-500 mt-2">Minimum 8 characters required</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(val) =>
                  setFormData({ ...formData, role: val as UserRole })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="role" className="border-gray-200 rounded-lg">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">
                    System Administrator
                  </SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="records_authority">
                    Records Authority
                  </SelectItem>
                  <SelectItem value="dept_head">Department Head</SelectItem>
                  <SelectItem value="staff_member">Staff Member</SelectItem>
                  <SelectItem value="finance_officer">Finance Officer</SelectItem>
                  <SelectItem value="hr_officer">HR Officer</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                {getRoleDescription(formData.role)}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Permission Assignment */}
        {step === 2 && (
          <div className="py-8">
            {isLoadingPermissions ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 bg-signal rounded-full animate-spin" style={{maskImage: 'conic-gradient(transparent 70%, black)'}} />
                </div>
                <p className="text-gray-600 font-medium">Loading permissions...</p>
              </div>
            ) : (
              <PermissionAssignmentStep
                allPermissions={allPermissions}
                selectedPermissions={selectedPermissions}
                onPermissionsChange={setSelectedPermissions}
              />
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            Cancel
          </Button>

          {step === 2 && (
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={isSubmitting}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}

          {step === 1 ? (
            <Button
              onClick={handleNextStep}
              disabled={isSubmitting}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCreateUser}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create User
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
