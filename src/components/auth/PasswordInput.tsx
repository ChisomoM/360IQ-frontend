import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';

/** Filled input look for the sign-in forms (design system 7.2). */
export const AUTH_FIELD =
  'h-11 border-transparent bg-field text-sm hover:bg-field-hover focus-visible:bg-surface-1 disabled:bg-surface-2';

/** Password field with a keyboard reachable show and hide button. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Hide password' : 'Show password';

  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className={cn(AUTH_FIELD, 'pr-11', className)} />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={label}
        title={label}
        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-sm text-text-muted hover:text-text-primary"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
