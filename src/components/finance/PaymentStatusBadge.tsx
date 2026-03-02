import { Badge } from '@/components/ui/badge';
import type { PaymentStatus } from '@/types/finance';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function PaymentStatusBadge({ status, className = '' }: PaymentStatusBadgeProps) {
  const variants = {
    verified: {
      className: 'bg-green-500 hover:bg-green-600',
      label: 'Verified'
    },
    pending: {
      className: 'bg-yellow-500 hover:bg-yellow-600',
      label: 'Pending'
    },
    rejected: {
      className: 'bg-red-500 hover:bg-red-600',
      label: 'Rejected'
    }
  };

  const config = variants[status];

  return (
    <Badge className={`${config.className} ${className}`}>
      {config.label}
    </Badge>
  );
}
