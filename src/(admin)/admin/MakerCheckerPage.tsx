import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, ToggleLeft, Trash2, Edit2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { list, remove, update } from '@/lib/api/crud';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { MakerCheckerRuleForm } from '@/components/rbac/MakerCheckerRuleForm';
import { MakerCheckerRequestCard } from '@/components/rbac/MakerCheckerRequestCard';
import type { MakerCheckerRule, MakerCheckerRequest } from '@/types/rbac';
import { useAuth } from '@/lib/context/useAuth';

type Tab = 'rules' | 'requests';

export default function MakerCheckerPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('rules');

    const [rules, setRules] = useState<MakerCheckerRule[]>([]);
    const [isLoadingRules, setIsLoadingRules] = useState(true);
    const [isRuleFormOpen, setIsRuleFormOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<MakerCheckerRule | undefined>();
    const [deleteTarget, setDeleteTarget] = useState<MakerCheckerRule | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [requests, setRequests] = useState<MakerCheckerRequest[]>([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);

    useEffect(() => {
        fetchRules();
    }, []);

    useEffect(() => {
        if (activeTab === 'requests') fetchRequests();
    }, [activeTab]);

    const fetchRules = async () => {
        setIsLoadingRules(true);
        try {
            const data = await list('MAKER_CHECKER_RULES');
            setRules(data ?? []);
        } catch {
            toast.error('Failed to load rules');
        } finally {
            setIsLoadingRules(false);
        }
    };

    const fetchRequests = async () => {
        setIsLoadingRequests(true);
        try {
            const data = await list('MAKER_CHECKER_REQUESTS', {}, { status: 'pending' });
            setRequests(data ?? []);
        } catch {
            toast.error('Failed to load requests');
        } finally {
            setIsLoadingRequests(false);
        }
    };

    const handleToggleRule = async (rule: MakerCheckerRule) => {
        try {
            await update('MAKER_CHECKER_RULES', { isActive: !rule.isActive }, { id: String(rule.id) });
            setRules((prev) =>
                prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r))
            );
            toast.success(`Rule ${rule.isActive ? 'deactivated' : 'activated'}`);
        } catch {
            toast.error('Failed to toggle rule');
        }
    };

    const handleDeleteRule = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await remove('MAKER_CHECKER_RULES', { id: String(deleteTarget.id) });
            setRules((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            toast.success('Rule deleted');
            setDeleteTarget(null);
        } catch {
            toast.error('Failed to delete rule');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleApprove = (id: string) => {
        setRequests((prev) => prev.filter((r) => String(r.id) !== id));
    };

    const handleReject = (id: string) => {
        setRequests((prev) => prev.filter((r) => String(r.id) !== id));
    };

    return (
        <div className="w-full space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Maker-Checker</h1>
                <p className="text-gray-600 mt-1">
                    Configure approval rules and review pending requests
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                {(['rules', 'requests'] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab
                                ? 'border-[#1e3c21] text-[#1e3c21]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab === 'rules' ? 'Rules' : 'Pending Requests'}
                    </button>
                ))}
            </div>

            {/* Rules Tab */}
            {activeTab === 'rules' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button
                            onClick={() => { setEditingRule(undefined); setIsRuleFormOpen(true); }}
                            className="bg-[#febb00] text-[#1e3c21] hover:bg-[#e8a900] font-bold"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Rule
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="p-0 overflow-hidden rounded-xl border-0 shadow-lg">
                            <Table>
                                <TableHeader className="bg-gray-900">
                                    <TableRow>
                                        <TableHead className="text-white">Name</TableHead>
                                        <TableHead className="text-white">Action</TableHead>
                                        <TableHead className="text-white">Resource</TableHead>
                                        <TableHead className="text-white">Approvals</TableHead>
                                        <TableHead className="text-white">Approver</TableHead>
                                        <TableHead className="text-white">Status</TableHead>
                                        <TableHead className="text-white text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingRules ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-20">
                                                <Loader2 className="h-10 w-10 animate-spin mx-auto text-[#1e3c21]" />
                                                <p className="mt-4 text-gray-500">Loading rules...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : rules.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-20 text-gray-500">
                                                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                                No rules yet. Create your first rule.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rules.map((rule) => (
                                            <TableRow key={String(rule.id)} className="hover:bg-gray-50">
                                                <TableCell className="font-medium">{rule.resource}</TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                                                        {rule.action}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{rule.resource}</TableCell>
                                                <TableCell>{rule.requiredApprovals}</TableCell>
                                                <TableCell>{rule.approverRoles.join(', ')}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${rule.isActive
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {rule.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title={rule.isActive ? 'Deactivate' : 'Activate'}
                                                            onClick={() => handleToggleRule(rule)}
                                                            className="hover:text-[#1e3c21]"
                                                        >
                                                            <ToggleLeft className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title="Edit rule"
                                                            onClick={() => { setEditingRule(rule); setIsRuleFormOpen(true); }}
                                                            className="hover:text-blue-600"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title="Delete rule"
                                                            onClick={() => setDeleteTarget(rule)}
                                                            className="hover:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
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
                </div>
            )}

            {/* Pending Requests Tab */}
            {activeTab === 'requests' && (
                <div className="space-y-4">
                    {isLoadingRequests ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-[#1e3c21]" />
                        </div>
                    ) : requests.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-20 text-gray-500">
                                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No pending requests.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {requests.map((req) => (
                                <MakerCheckerRequestCard
                                    key={String(req.id)}
                                    request={{
                                        id: String(req.id),
                                        actionCode: req.action,
                                        resourceType: req.resource,
                                        description: `${req.action} on ${req.resource}`,
                                        initiatorId: String(req.requestedBy),
                                        initiatorName: String(req.requestedBy),
                                        requiredApprovals: 2,
                                        currentApprovals: req.approvals.filter(
                                            (a) => a.decision === 'approved'
                                        ).length,
                                        status: req.status === 'cancelled' ? 'pending' : req.status,
                                    }}
                                    currentUserId={String(user?.id ?? '')}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <MakerCheckerRuleForm
                isOpen={isRuleFormOpen}
                onClose={() => { setIsRuleFormOpen(false); setEditingRule(undefined); }}
                onSubmit={() => fetchRules()}
                rule={editingRule}
            />

            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
            >
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Rule?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this maker-checker rule. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteRule}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}