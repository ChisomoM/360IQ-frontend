import { useState } from 'react';
import { useAuth } from '@/lib/context/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from '@/components/icons';
import { toast } from 'sonner';
import { AUTH_FIELD, PasswordInput } from './PasswordInput';

export function ChangePasswordModal() {
  const auth = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await auth.changePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
    } catch (_error) {
      toast.error(`Couldn't change your password. ${_error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!auth.forceChangePassword) return null;

  return (
    <Dialog open={auth.forceChangePassword} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>Change your password</DialogTitle>
          <DialogDescription>
            Replace your temporary password before you continue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-[13px] font-medium text-text-secondary">New password</Label>
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-[13px] font-medium text-text-secondary">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type it again"
              className={AUTH_FIELD}
              required
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Change password
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
