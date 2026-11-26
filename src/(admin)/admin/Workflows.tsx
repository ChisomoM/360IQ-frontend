import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Eye, Loader2, RefreshCw, RotateCcw, Workflow as WorkflowIcon } from '@/components/icons';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SectionBody } from '@/components/shared/SectionBody';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { DocumentStatusBadge } from '@/components/documents/DocumentStatusBadge';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import { fetchData } from '@/lib/api/crud';
import type { Workflow, WorkflowStep, Document } from '@/types/dms';

/** "financial_approval" reads as "Financial approval". */
const sentenceCase = (value: string) => {
  const words = value.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export default function Workflows() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [pendingSteps, setPendingSteps] = useState<WorkflowStep[]>([]);
  const [documents, setDocuments] = useState<Record<string, Document>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [isDecisionDialogOpen, setIsDecisionDialogOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'approve' | 'reject' | 'request-changes'>('approve');
  const [comments, setComments] = useState('');

  const fetchWorkflowData = async () => {
    try {
      setLoading(true);
      // WORKFLOWS and PENDING_APPROVALS are critical; fetch them together
      const [wfData, pendingData] = await Promise.all([
        fetchData('WORKFLOWS', 'GET'),
        fetchData('PENDING_APPROVALS', 'GET'),
      ]);
      setWorkflows(wfData);
      setPendingSteps(pendingData);

      // DOCUMENTS is supplemental fallback — fetch separately so a failure doesn't break the page
      fetchData('DOCUMENTS', 'GET').then((docsData) => {
        const docMap: Record<string, Document> = {};
        docsData.forEach((d: Document) => { docMap[d.id] = d; });
        setDocuments(docMap);
      }).catch(() => { /* non-critical */ });
    } catch (error) {
      console.error('Error fetching workflow data:', error);
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflowData();
  }, []);

  const handleDecision = async () => {
    if (!selectedStep) return;

    try {
      setActionLoading(true);
      const endpointMap = {
        'approve': 'WORKFLOW_STEP_APPROVE',
        'reject': 'WORKFLOW_STEP_REJECT',
        'request-changes': 'WORKFLOW_STEP_REQUEST_CHANGES',
      } as const;
      await fetchData(endpointMap[decisionType], 'POST', { id: selectedStep.id }, { comments });
      const actionLabel = decisionType === 'request-changes' ? 'Changes requested' : decisionType === 'approve' ? 'Step approved' : 'Step rejected';
      toast.success(actionLabel);
      setIsDecisionDialogOpen(false);
      setComments('');
      fetchWorkflowData();
    } catch (error: any) {
      console.error(`Error on workflow decision:`, error);
      toast.error(error.message || `Failed to process decision`);
    } finally {
      setActionLoading(false);
    }
  };

  const openDecision = (step: WorkflowStep, type: 'approve' | 'reject' | 'request-changes') => {
    setSelectedStep(step);
    setDecisionType(type);
    setIsDecisionDialogOpen(true);
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        title="Workflows and approvals"
        description="Review pending requests and track each document's progress."
        actions={
          <Button onClick={fetchWorkflowData} variant="secondary" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Refresh
          </Button>
        }
      />

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Waiting for you
            <span className="rounded-pill bg-surface-2 px-1.5 font-mono text-xs">{pendingSteps.length}</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            All workflows
            <span className="rounded-pill bg-surface-2 px-1.5 font-mono text-xs">{workflows.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <SectionCard padded={false}>
            <SectionBody
              loading={loading}
              skeleton={<TableSkeleton rows={6} columns={5} />}
              isEmpty={pendingSteps.length === 0}
              empty={
                <EmptyState
                  icon={<CheckCircle size={24} />}
                  title="Nothing to approve"
                  description="Approval requests assigned to you appear here."
                />
              }
            >
              <Table>
                <TableHeader>
                  <TableHeaderRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Workflow type</TableHead>
                    <TableHead>Step</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableHeaderRow>
                </TableHeader>
                <TableBody>
                  {pendingSteps.map((step) => (
                    <TableRow key={step.id}>
                      <TableCell className="text-[13px] font-semibold text-text-primary">
                        {step.workflow?.document?.title || documents[step.workflow?.document_id ?? '']?.title || 'Unknown document'}
                      </TableCell>
                      <TableCell className="text-[13px] text-text-secondary">
                        {sentenceCase(step.workflow?.workflow_type || 'approval')}
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone="neutral">Step <span className="font-mono">{step.step_number}</span></StatusBadge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-text-secondary">
                        {formatDate(step.created_at) || 'Not recorded'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openDecision(step, 'approve')}
                          >
                            <CheckCircle /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDecision(step, 'request-changes')}
                          >
                            <RotateCcw /> Request changes
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDecision(step, 'reject')}
                          >
                            <XCircle /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionBody>
          </SectionCard>
        </TabsContent>

        <TabsContent value="all">
          <SectionCard padded={false}>
            <SectionBody
              loading={loading}
              skeleton={<TableSkeleton rows={6} columns={5} />}
              isEmpty={workflows.length === 0}
              empty={
                <EmptyState
                  icon={<WorkflowIcon size={24} />}
                  title="No workflows yet"
                  description="Approval workflows and their progress appear here."
                />
              }
            >
              <Table>
                <TableHeader>
                  <TableHeaderRow>
                    <TableHead>Workflow ID</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableHeaderRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((wf) => (
                    <TableRow key={wf.id}>
                      <TableCell className="font-mono text-xs text-text-secondary" title={wf.id}>
                        {wf.id.split('-')[0]}…
                      </TableCell>
                      <TableCell className="text-[13px] font-semibold text-text-primary">
                        {wf.document?.title || documents[wf.document_id]?.title || 'Unknown document'}
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-[8rem] items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-surface-2">
                            <div
                              className="h-full rounded-pill bg-signal transition-all"
                              style={{ width: `${(wf.current_step_index / wf.total_steps) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-text-secondary">{wf.current_step_index}/{wf.total_steps}</span>
                        </div>
                      </TableCell>
                      <TableCell><DocumentStatusBadge status={wf.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="View document" title="View document" onClick={() => navigate(`/admin/documents/${wf.document_id}`)}>
                          <Eye />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionBody>
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Decision dialog */}
      <Dialog open={isDecisionDialogOpen} onOpenChange={setIsDecisionDialogOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {decisionType === 'approve' ? 'Approve this step' : decisionType === 'request-changes' ? 'Request changes' : 'Reject this step'}
            </DialogTitle>
            <DialogDescription>
              {decisionType === 'request-changes'
                ? 'Describe what needs to change. The document goes back to the person who started the workflow.'
                : 'Add a comment for this decision. It is shown in the workflow history.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="decision-comments">Comments{decisionType === 'request-changes' ? ' (required)' : ''}</Label>
            <Textarea
              id="decision-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={decisionType === 'request-changes' ? 'Update the notice period in clause 4' : 'Checked against the signed copy'}
            />
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDecisionDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDecision}
              disabled={actionLoading || (decisionType === 'request-changes' && !comments.trim())}
              variant={decisionType === 'reject' ? 'destructive' : 'default'}
            >
              {actionLoading && <Loader2 className="animate-spin" />}
              {decisionType === 'approve' ? 'Approve step' : decisionType === 'request-changes' ? 'Send request' : 'Reject step'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
