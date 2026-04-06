import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, AlertTriangle, Clock } from 'lucide-react';
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
  title = 'Escalations & Overdue Items',
  description = 'Documents with pending approvals exceeding SLA thresholds',
}: EscalationsCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return (
          <Badge className="bg-red-100/80 text-red-900 border border-red-200/50 font-semibold">
            ⚠️ Critical
          </Badge>
        );
      case 'urgent':
        return (
          <Badge className="bg-amber-100/80 text-amber-900 border border-amber-200/50 font-semibold">
            ⚡ Urgent
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100/80 text-blue-900 border border-blue-200/50 font-semibold">
            🕐 Pending
          </Badge>
        );
    }
  };

  const getRowBackground = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-50/40 hover:bg-red-50/80 border-l-4 border-l-red-500';
      case 'urgent':
        return 'bg-amber-50/40 hover:bg-amber-50/80 border-l-4 border-l-amber-500';
      default:
        return 'bg-blue-50/20 hover:bg-blue-50/60 border-l-4 border-l-blue-400';
    }
  };

  const criticalCount = data.filter(d => d.status === 'critical').length;
  const urgentCount = data.filter(d => d.status === 'urgent').length;

  if (isLoading) {
    return (
      <Card className="border-slate-200/50 shadow-premium-sm">
        <CardHeader className="border-b border-slate-200/50 pb-4">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin inline-block">
                <AlertTriangle className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium mt-3">Loading escalations...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/50 shadow-premium-sm hover:shadow-premium-md transition-all duration-300 bg-white overflow-hidden">
      <CardHeader className="border-b border-slate-200/50 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="p-2 bg-red-100/50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg font-bold text-slate-900">{title}</CardTitle>
              <CardDescription className="mt-1 break-words text-sm text-slate-600">{description}</CardDescription>
            </div>
          </div>
          {data.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              {criticalCount > 0 && (
                <div className="text-center px-3 py-2 bg-red-50/60 rounded-lg border border-red-200/50">
                  <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
                  <p className="text-xs text-red-700 font-medium">Critical</p>
                </div>
              )}
              {urgentCount > 0 && (
                <div className="text-center px-3 py-2 bg-amber-50/60 rounded-lg border border-amber-200/50">
                  <p className="text-2xl font-bold text-amber-600">{urgentCount}</p>
                  <p className="text-xs text-amber-700 font-medium">Urgent</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {data && data.length > 0 ? (
          <div className="rounded-xl border border-slate-200/30 overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[720px] xl:min-w-0">
              <TableHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 border-b border-slate-200/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-wider">Document</TableHead>
                  <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-wider">Department</TableHead>
                  <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-wider">Stage</TableHead>
                  <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-wider">Approver</TableHead>
                  <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-wider text-center">Days</TableHead>
                  <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => (
                  <TableRow
                    key={`${item.document_id}-${idx}`}
                    className={`transition-all duration-200 ${getRowBackground(item.status)} last:border-b-0`}
                  >
                    <TableCell className="max-w-[18rem] py-4 font-semibold text-slate-900">
                      {item.document_title}
                    </TableCell>
                    <TableCell className="text-slate-700 text-sm font-medium">{item.department_name}</TableCell>
                    <TableCell className="text-slate-700 text-sm">
                      <span className="px-2 py-1 bg-slate-100/60 rounded text-xs font-medium">
                        Step {item.current_stage}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-700 text-sm">{item.approver_name}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {getStatusIcon(item.status)}
                        <span className="font-bold text-slate-900">{item.days_pending}d</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {getStatusBadge(item.status)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl bg-gradient-to-br from-emerald-50/40 to-emerald-100/20 border border-emerald-200/30">
            <div className="p-3 bg-emerald-100/50 rounded-full mb-3">
              <AlertCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-slate-900 font-bold">All Clear! ✨</p>
            <p className="text-slate-600 text-sm mt-1">No escalations - all approvals are within SLA</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
