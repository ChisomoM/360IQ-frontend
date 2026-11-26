import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, buttonVariants } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { Loader2, Plus, Trash2, Edit2, ClipboardList } from '@/components/icons';
import { toast } from 'sonner';
import { PageTransition } from '@/components/PageTransition';
import { list, remove, update, post } from '@/lib/api/crud';
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
            await post('MAKER_CHECKER_RULE_TOGGLE', {}, { ruleId: String(rule.id) });
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
            await remove('MAKER_CHECKER_RULE_DETAIL', { ruleId: String(deleteTarget.id) });
            setRules((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            toast.success('Rule deleted');
            setDeleteTarget(null);
        } catch {
            toast.error('Failed to delete rule');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleApprove = async (id: string, comment: string) => {
        try {
            await post('MAKER_CHECKER_APPROVE', { comment }, { id });
            toast.success('Request approved');
            fetchRequests(); // Refetch to update the list
        } catch (error) {
            toast.error('Failed to approve request');
            throw error; // Re-throw to let the card handle it
        }
    };

    const handleReject = async (id: string, comment: string) => {
        try {
            await post('MAKER_CHECKER_REJECT', { comment }, { id });
            toast.success('Request rejected');
            fetchRequests(); // Refetch to update the list
        } catch (error) {
            toast.error('Failed to reject request');
            throw error; // Re-throw to let the card handle it
        }
    };

    const getRequiredApprovals = (ruleId: number | string): number => {
        const rule = rules.find((r) => r.id === ruleId);
        return rule?.requiredApprovals ?? 2; // Fallback to 2 if rule not found
    };

    return (
        <PageTransition>
            <div className="w-full flex flex-col gap-5">
                <PageHeader
                    title="Maker-checker"
                    description="Set approval rules and review pending requests."
                    actions={activeTab === 'rules' && (
                        <Button onClick={() => { setEditingRule(undefined); setIsRuleFormOpen(true); }}>
                            <Plus />
                            Create rule
                        </Button>
                    )}
                />

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)}>
            <TabsList>
                <TabsTrigger value="rules">Rules</TabsTrigger>
                <TabsTrigger value="requests">Pending requests</TabsTrigger>
            </TabsList>

            {/* Rules Tab */}
            <TabsContent value="rules">
                    <SectionCard padded={false}>
                        {isLoadingRules ? (
                            <TableSkeleton rows={5} columns={7} />
                        ) : rules.length === 0 ? (
                            <EmptyState
                                icon={<ClipboardList size={24} />}
                                title="No rules yet"
                                description="Rules require a second person to approve sensitive actions. Create the first one."
                            />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead scope="col">Name</TableHead>
                                        <TableHead scope="col">Action</TableHead>
                                        <TableHead scope="col">Resource</TableHead>
                                        <TableHead scope="col" className="text-right">Approvals</TableHead>
                                        <TableHead scope="col">Approver</TableHead>
                                        <TableHead scope="col">Status</TableHead>
                                        <TableHead scope="col" className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rules.map((rule) => (
                                        <TableRow key={String(rule.id)}>
                                            <TableCell className="font-semibold">{rule.name}</TableCell>
                                            <TableCell className="font-mono text-xs text-text-secondary">{rule.action}</TableCell>
                                            <TableCell className="text-text-secondary">{rule.resource}</TableCell>
                                            <TableCell className="text-right font-mono text-xs text-text-secondary">{rule.requiredApprovals}</TableCell>
                                            <TableCell className="text-text-secondary">{rule.approverSlug}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={rule.isActive ? 'active' : 'inactive'} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Switch
                                                        checked={!!rule.isActive}
                                                        onCheckedChange={() => handleToggleRule(rule)}
                                                        title={rule.isActive ? 'Deactivate' : 'Activate'}
                                                        aria-label={`${rule.isActive ? 'Deactivate' : 'Activate'} ${rule.name}`}
                                                        className="mr-2"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Edit rule"
                                                        aria-label="Edit rule"
                                                        onClick={() => { setEditingRule(rule); setIsRuleFormOpen(true); }}
                                                        className="h-8 w-8"
                                                    >
                                                        <Edit2 />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Delete rule"
                                                        aria-label="Delete rule"
                                                        onClick={() => setDeleteTarget(rule)}
                                                        className="h-8 w-8 text-risk hover:text-risk hover:bg-risk-tint"
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </SectionCard>
            </TabsContent>

            {/* Pending Requests Tab */}
            <TabsContent value="requests">
                    {isLoadingRequests ? (
                        <SectionCard padded={false}>
                            <TableSkeleton rows={4} columns={3} />
                        </SectionCard>
                    ) : requests.length === 0 ? (
                        <SectionCard padded={false}>
                            <EmptyState
                                icon={<ClipboardList size={24} />}
                                title="No pending requests"
                                description="Requests that need approval appear here."
                            />
                        </SectionCard>
                    ) : (
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: {},
                                visible: { transition: { staggerChildren: 0.06 } },
                            }}
                        >
                            {requests.map((req) => (
                                <motion.div
                                    key={String(req.id)}
                                    variants={{
                                        hidden: { opacity: 0, y: 10 },
                                        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
                                    }}
                                >
                                    <MakerCheckerRequestCard
                                        request={{
                                            id: String(req.id),
                                            actionCode: req.action,
                                            resourceType: req.resource,
                                            description: `${req.action} on ${req.resource}`,
                                            initiatorId: String(req.requestedBy),
                                            initiatorName: String(req.requestedBy),
                                            requiredApprovals: getRequiredApprovals(req.ruleId),
                                            currentApprovals: req.approvals.filter(
                                                (a) => a.decision === 'approved'
                                            ).length,
                                            status: req.status === 'cancelled' ? 'pending' : req.status,
                                        }}
                                        currentUserId={String(user?.id ?? '')}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
            </TabsContent>
            </Tabs>

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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this rule?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The maker-checker rule is deleted permanently. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteRule}
                            disabled={isDeleting}
                            className={buttonVariants({ variant: 'destructive' })}
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete rule
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </PageTransition>
    );
}