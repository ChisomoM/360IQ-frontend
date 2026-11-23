import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, Eye, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { fetchData } from '@/lib/api/crud';
import type { Workflow, WorkflowStep, Document } from '@/types/dms';
import dayjs from 'dayjs';

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
      const actionLabel = decisionType === 'request-changes' ? 'Changes requested' : `Step ${decisionType}d`;
      toast.success(`${actionLabel} successfully`);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-positive-tint text-positive">Approved</Badge>;
      case 'pending': return <Badge className="bg-caution-tint text-caution">Pending</Badge>;
      case 'rejected': return <Badge className="bg-risk-tint text-risk">Rejected</Badge>;
      case 'cancelled': return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflows & Approvals</h1>
          <p className="text-gray-600 mt-1">Review pending requests and track document progression</p>
        </div>
        <Button onClick={fetchWorkflowData} variant="outline" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-primary-blue data-[state=active]:text-white px-6">
            Pending My Approval ({pendingSteps.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary-blue data-[state=active]:text-white px-6">
            All Workflows ({workflows.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card className="border-none shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-900">
                  <TableRow>
                    <TableHead className="text-white">Document</TableHead>
                    <TableHead className="text-white">Workflow Type</TableHead>
                    <TableHead className="text-white">Step</TableHead>
                    <TableHead className="text-white">Requested</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : pendingSteps.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-10 text-positive" />
                      All caught up! No pending approvals for you.
                    </TableCell></TableRow>
                  ) : (
                    pendingSteps.map((step) => (
                      <TableRow key={step.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-semibold text-gray-900 py-4">
                          {step.workflow?.document?.title || documents[step.workflow?.document_id ?? '']?.title || 'Unknown Document'}
                        </TableCell>
                        <TableCell className="uppercase text-xs font-bold text-gray-500">
                          {step.workflow?.workflow_type?.replace(/_/g, ' ') || 'approval'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-signal-tint text-signal-text border-line">
                            Step {step.step_number}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {step.created_at ? dayjs(step.created_at).format('MMM DD, YYYY') : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              className="bg-positive hover:opacity-90 text-white"
                              onClick={() => {
                                setSelectedStep(step);
                                setDecisionType('approve');
                                setIsDecisionDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-amber-400 text-amber-700 hover:bg-amber-50"
                              onClick={() => {
                                setSelectedStep(step);
                                setDecisionType('request-changes');
                                setIsDecisionDialogOpen(true);
                              }}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" /> Request Changes
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                setSelectedStep(step);
                                setDecisionType('reject');
                                setIsDecisionDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <Card className="border-none shadow-lg overflow-hidden">
            <CardContent className="p-0">
               <Table>
                <TableHeader className="bg-gray-900">
                  <TableRow>
                    <TableHead className="text-white">Workflow ID</TableHead>
                    <TableHead className="text-white">Document</TableHead>
                    <TableHead className="text-white">Progress</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : workflows.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-gray-500">No active workflows found.</TableCell></TableRow>
                  ) : (
                    workflows.map((wf) => (
                      <TableRow key={wf.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-mono text-xs text-gray-500">
                          {wf.id.split('-')[0]}...
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          {wf.document?.title || documents[wf.document_id]?.title || 'Unknown Document'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                               <div
                                 className="h-full bg-primary-blue transition-all"
                                 style={{ width: `${(wf.current_step_index / wf.total_steps) * 100}%` }}
                               />
                             </div>
                             <span className="text-xs font-bold text-gray-600">{wf.current_step_index}/{wf.total_steps}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(wf.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/documents/${wf.document_id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Decision Dialog */}
      <Dialog open={isDecisionDialogOpen} onOpenChange={setIsDecisionDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${decisionType === 'approve' ? 'text-positive' : decisionType === 'request-changes' ? 'text-caution' : 'text-risk'}`}>
              {decisionType === 'approve' ? <CheckCircle className="h-5 w-5" /> : decisionType === 'request-changes' ? <RotateCcw className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {decisionType === 'approve' ? 'Approve' : decisionType === 'request-changes' ? 'Request Changes' : 'Reject'} Workflow Step
            </DialogTitle>
            <DialogDescription>
              {decisionType === 'request-changes'
                ? 'Describe what changes are needed. The document will be returned to the initiator for revision.'
                : 'Provide comments for this decision. This will be visible in the workflow history.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label>Comments{decisionType === 'request-changes' ? ' (required)' : ''}</Label>
            <Textarea 
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={decisionType === 'request-changes' ? 'Describe the changes needed...' : 'Reason for approval/rejection...'}
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDecisionDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleDecision} 
              disabled={actionLoading || (decisionType === 'request-changes' && !comments.trim())}
              className={
                decisionType === 'approve'
                  ? 'bg-positive hover:opacity-90 text-white'
                  : decisionType === 'request-changes'
                  ? 'bg-caution hover:opacity-90 text-white'
                  : 'bg-risk hover:opacity-90 text-white'
              }
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {decisionType === 'approve' ? 'Confirm Approval' : decisionType === 'request-changes' ? 'Send Request' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
