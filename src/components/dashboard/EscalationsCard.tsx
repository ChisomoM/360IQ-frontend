import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle } from '@/components/icons';
import { SectionCard } from '@/components/shared/SectionCard';
import { SectionBody } from '@/components/shared/SectionBody';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import type { EscalationItem } from '@/lib/api/dashboard';

interface EscalationsCardProps {
  data: EscalationItem[];
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function EscalationsCard({
  data,
  isLoading = false,
  title = 'Escalations and overdue items',
  description = 'Documents with approvals past their SLA',
}: EscalationsCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <StatusBadge tone="risk" label="Critical" />;
      case 'urgent':
        return <StatusBadge tone="caution" label="Urgent" />;
      default:
        return <StatusBadge tone="neutral" label="Pending" />;
    }
  };

  const criticalCount = data.filter(d => d.status === 'critical').length;
  const urgentCount = data.filter(d => d.status === 'urgent').length;

  return (
    <SectionCard
      eyebrow={description}
      title={title}
      padded={false}
      actions={
        !isLoading && (
          <>
            {criticalCount > 0 && <StatusBadge tone="risk" label={`${criticalCount} critical`} />}
            {urgentCount > 0 && <StatusBadge tone="caution" label={`${urgentCount} urgent`} />}
          </>
        )
      }
    >
      <SectionBody
        loading={isLoading}
        skeleton={<TableSkeleton rows={4} columns={6} />}
        isEmpty={!data || data.length === 0}
        empty={
          <EmptyState
            icon={<CheckCircle size={24} />}
            title="No escalations"
            description="All approvals are within their SLA."
          />
        }
      >
        <div className="overflow-x-auto">
          <Table className="min-w-[720px] xl:min-w-0">
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Approver</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, idx) => (
                <TableRow key={`${item.document_id}-${idx}`}>
                  <TableCell className="max-w-[18rem] font-semibold">{item.document_title}</TableCell>
                  <TableCell className="text-[13px] text-text-secondary">{item.department_name}</TableCell>
                  <TableCell className="text-[13px] text-text-secondary">Step {item.current_stage}</TableCell>
                  <TableCell className="text-[13px] text-text-secondary">{item.approver_name}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-text-secondary">{item.days_pending}d</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionBody>
    </SectionCard>
  );
}
