import { useState, useEffect } from 'react';
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
import { ClipboardList, CheckCircle, XCircle, Clock, Eye, Loader2, MessageSquare, User } from 'lucide-react';
import { toast } from 'sonner';
import { fetchData } from '@/lib/api/crud';
import type { Workflow, WorkflowStep, Document } from '@/types/dms';
import dayjs from 'dayjs';

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [pendingSteps, setPendingSteps] = useState<WorkflowStep[]>([]);
  const [documents, setDocuments] = useState<Record<string, Document>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [isDecisionDialogOpen, setIsDecisionDialogOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState('');

  const fetchWorkflowData = async () => {
    try {
      setLoading(true);
      const [wfData, pendingData, docsData] = await Promise.all([
        fetchData('WORKFLOWS', 'GET'),
        fetchData('PENDING_APPROVALS', 'GET'),
        fetchData('DOCUMENTS', 'GET'),
      ]);
      setWorkflows(wfData);
      setPendingSteps(pendingData);
      
      // Map documents for easy lookup
      const docMap: Record<string, Document> = {};
      docsData.forEach((d: Document) => { docMap[d.id] = d; });
      setDocuments(docMap);
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
      const endpoint = decisionType === 'approve' ? 'WORKFLOW_STEP_APPROVE' : 'WORKFLOW_STEP_REJECT';
      await fetchData(endpoint, 'POST', { id: selectedStep.id }, { comments });
      toast.success(`Step ${decisionType}d successfully`);
      setIsDecisionDialogOpen(false);
      setComments('');
      fetchWorkflowData();
    } catch (error: any) {
      console.error(`Error ${decisionType}ing step:`, error);
      toast.error(error.message || `Failed to ${decisionType} step`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
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
                    <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-10 w-10 animate-spin mx-auto text-[#E5600B]" /></TableCell></TableRow>
                  ) : pendingSteps.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-10 text-green-500" />
                      All caught up! No pending approvals for you.
                    </TableCell></TableRow>
                  ) : (
                    pendingSteps.map((step) => (
                      <TableRow key={step.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-semibold text-gray-900 py-4">
                          {documents[step.workflow_id]?.title || 'Unknown Document'}
                        </TableCell>
                        <TableCell className="uppercase text-xs font-bold text-gray-500">
                           approval
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                            Step {step.step_number}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {/* We don't have created_at in step model yet, assume from workflow if needed */}
                          {dayjs().format('MMM DD, YYYY')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
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
                    <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-10 w-10 animate-spin mx-auto text-[#E5600B]" /></TableCell></TableRow>
                  ) : workflows.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-gray-500">No active workflows found.</TableCell></TableRow>
                  ) : (
                    workflows.map((wf) => (
                      <TableRow key={wf.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-mono text-xs text-gray-500">
                          {wf.id.split('-')[0]}...
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          {documents[wf.document_id]?.title || 'Unknown Document'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                               <div
                                 className="h-full bg-primary-blue transition-all"
                                 style={{ width: `${((wf.current_step_index + 1) / wf.total_steps) * 100}%` }}
                               />
                             </div>
                             <span className="text-xs font-bold text-gray-600">{wf.current_step_index + 1}/{wf.total_steps}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(wf.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
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
            <DialogTitle className={`flex items-center gap-2 ${decisionType === 'approve' ? 'text-green-600' : 'text-red-600'}`}>
              {decisionType === 'approve' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {decisionType === 'approve' ? 'Approve' : 'Reject'} Workflow Step
            </DialogTitle>
            <DialogDescription>
              Provide comments for this decision. This will be visible in the workflow history.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label>Comments</Label>
            <Textarea 
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Reason for approval/rejection..."
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDecisionDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleDecision} 
              disabled={actionLoading}
              className={decisionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm {decisionType === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
