import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, ToggleLeft, Trash2, Edit2, ClipboardList } from 'lucide-react';
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
            <div className="w-full space-y-6">
                <div>
                    <h1 className="font-display font-bold text-display-sm text-gray-900">Maker-Checker</h1>
                    <p className="font-sans text-text-md text-gray-500 mt-1">
                        Configure approval rules and review pending requests
                    </p>
                </div>

            {/* Tabs — Frosted Pill Surface Pattern */}
            <motion.div
                className="flex bg-slate-50/80 p-1 rounded-xl gap-0.5 w-fit"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
                {(['rules', 'requests'] as Tab[]).map((tab) => (
                    <motion.button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="relative h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 outline-none capitalize transition-colors duration-150"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                        {activeTab === tab && (
                            <motion.span
                                layoutId="tabActivePill"
                                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                            />
                        )}
                        <span className="relative z-10">
                            {tab === 'rules' ? 'Rules' : 'Pending Requests'}
                        </span>
                    </motion.button>
                ))}
            </motion.div>

            {/* Rules Tab */}
            {activeTab === 'rules' && (
                <div className="space-y-4">
                    <motion.div
                        className="flex justify-end"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    >
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                            <Button
                                onClick={() => { setEditingRule(undefined); setIsRuleFormOpen(true); }}
                                className="bg-primary text-white hover:bg-ch-primary-700 font-semibold"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                New Rule
                            </Button>
                        </motion.div>
                    </motion.div>

                    <Card>
                        <CardContent className="p-0 overflow-hidden rounded-xl border-0 shadow-lg">
                            <Table>
                                <TableHeader className="bg-slate-900">
                                    <TableRow>
                                        <TableHead className="text-white font-semibold">Name</TableHead>
                                        <TableHead className="text-white font-semibold">Action</TableHead>
                                        <TableHead className="text-white font-semibold">Resource</TableHead>
                                        <TableHead className="text-white font-semibold">Approvals</TableHead>
                                        <TableHead className="text-white font-semibold">Approver</TableHead>
                                        <TableHead className="text-white font-semibold">Status</TableHead>
                                        <TableHead className="text-white font-semibold text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingRules ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-20">
                                                <Loader2 className="h-10 w-10 animate-spin mx-auto text-ch-primary" />
                                                <p className="mt-4 text-gray-500 font-sans">Loading rules...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : rules.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-20 text-gray-500">
                                                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                                <p className="font-sans">No rules yet. Create your first rule.</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rules.map((rule, idx) => (
                                            <motion.tr
                                                key={String(rule.id)}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: idx * 0.05 }}
                                                className="hover:bg-slate-50/60 transition-colors duration-150 cursor-pointer"
                                                whileHover={{ x: 2 }}
                                            >
                                                <TableCell className="font-sans font-medium text-gray-900">{rule.name}</TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700">
                                                        {rule.action}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-sans text-gray-700">{rule.resource}</TableCell>
                                                <TableCell className="font-sans text-gray-700 font-medium">{rule.requiredApprovals}</TableCell>
                                                <TableCell className="font-sans text-gray-700">{rule.approverSlug}</TableCell>
                                                <TableCell>
                                                    <motion.span
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                                            rule.isActive
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-500'
                                                        }`}
                                                    >
                                                        {rule.isActive ? 'Active' : 'Inactive'}
                                                    </motion.span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                title={rule.isActive ? 'Deactivate' : 'Activate'}
                                                                onClick={() => handleToggleRule(rule)}
                                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 outline-none"
                                                            >
                                                                <ToggleLeft className="h-4 w-4" />
                                                            </Button>
                                                        </motion.div>
                                                        <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                title="Edit rule"
                                                                onClick={() => { setEditingRule(rule); setIsRuleFormOpen(true); }}
                                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 outline-none"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                        </motion.div>
                                                        <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                title="Delete rule"
                                                                onClick={() => setDeleteTarget(rule)}
                                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 outline-none"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </motion.div>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
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
                        <motion.div
                            className="flex items-center justify-center py-20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Loader2 className="h-10 w-10 animate-spin text-ch-primary" />
                        </motion.div>
                    ) : requests.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-20 text-gray-500">
                                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="font-sans">No pending requests.</p>
                            </CardContent>
                        </Card>
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
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 8 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
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
                    </motion.div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </PageTransition>
    );
}