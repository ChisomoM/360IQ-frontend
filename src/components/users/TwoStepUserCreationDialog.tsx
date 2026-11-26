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
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { PermissionAssignmentStep } from '@/components/users/PermissionAssignmentStep';
import { Loader2, ChevronRight, ChevronLeft } from '@/components/icons';
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
      toast.error('Enter a first name.');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Enter a last name.');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Enter an email address.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Enter a full email address, like name@company.co.zm.');
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      toast.error('Use at least 8 characters for the password.');
      return false;
    }
    if (!formData.role) {
      toast.error('Choose a role.');
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

      toast.success('User created');
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <p className="text-xs text-text-muted">Step <span className="font-mono">{step}</span> of <span className="font-mono">2</span></p>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Add the user details.' : 'Choose permissions for this user.'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="flex gap-2" aria-hidden="true">
          <div className="flex-1 h-1.5 bg-signal rounded-pill transition-all duration-300" />
          <div
            className={`flex-1 h-1.5 rounded-pill transition-all duration-300 ${
              step >= 2
                ? 'bg-signal'
                : 'bg-surface-2'
            }`}
          />
        </div>

        {/* Step 1: User Details */}
        {step === 1 && (
          <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Natasha"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Lungu"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@company.co.zm"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                disabled={isSubmitting}
              />
              <p className="text-xs text-text-muted">At least 8 characters.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(val) =>
                  setFormData({ ...formData, role: val as UserRole })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">
                    System administrator
                  </SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="records_authority">
                    Records authority
                  </SelectItem>
                  <SelectItem value="dept_head">Department head</SelectItem>
                  <SelectItem value="staff_member">Staff member</SelectItem>
                  <SelectItem value="finance_officer">Finance officer</SelectItem>
                  <SelectItem value="hr_officer">HR officer</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-text-muted">
                {getRoleDescription(formData.role)}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Permission Assignment */}
        {step === 2 && (
          <div>
            {isLoadingPermissions ? (
              <TableSkeleton rows={5} columns={2} />
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
        <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-line">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          {step === 2 && (
            <Button
              variant="secondary"
              onClick={handlePreviousStep}
              disabled={isSubmitting}
            >
              <ChevronLeft />
              Back
            </Button>
          )}

          {step === 1 ? (
            <Button
              onClick={handleNextStep}
              disabled={isSubmitting}
            >
              Continue
              <ChevronRight />
            </Button>
          ) : (
            <Button
              onClick={handleCreateUser}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="animate-spin" />
              )}
              Create user
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
