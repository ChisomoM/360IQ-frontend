import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { post, update, list } from '@/lib/api/crud';

export interface MakerCheckerActionCode {
    value: string;
    label: string;
    resource: string;
    description: string;
}

export interface MakerCheckerRule {
    id?: string;
    name: string;
    actionCode: string;
    requiredApprovals: number;
    approverSlug: string;
    isActive: boolean;
}

interface MakerCheckerRuleFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<MakerCheckerRule, 'id'>) => void;
    rule?: MakerCheckerRule;
    isSubmitting?: boolean;
}

const APPROVER_OPTIONS = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
];

export function MakerCheckerRuleForm({
    isOpen,
    onClose,
    onSubmit,
    rule,
}: MakerCheckerRuleFormProps) {
    const [name, setName] = useState('');
    const [actionCode, setActionCode] = useState('');
    const [requiredApprovals, setRequiredApprovals] = useState(1);
    const [approverSlug, setApproverSlug] = useState('admin');
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [actionCodes, setActionCodes] = useState<MakerCheckerActionCode[]>([]);
    const [isLoadingCodes, setIsLoadingCodes] = useState(false);

    const isEditing = !!rule?.id;

    // Fetch available action codes on mount
    useEffect(() => {
        const fetchActionCodes = async () => {
            setIsLoadingCodes(true);
            try {
                const data = await list('MAKER_CHECKER_ACTION_CODES');
                setActionCodes(data ?? []);
            } catch (err) {
                toast.error('Failed to load action codes');
                console.error(err);
            } finally {
                setIsLoadingCodes(false);
            }
        };
        fetchActionCodes();
    }, []);

    // Pre-populate when editing
    useEffect(() => {
        if (rule) {
            setName(rule.name || '');
            setActionCode(rule.actionCode || '');
            setRequiredApprovals(rule.requiredApprovals);
            setApproverSlug(rule.approverSlug || 'admin');
            setIsActive(rule.isActive);
        } else {
            setName('');
            setActionCode('');
            setRequiredApprovals(1);
            setApproverSlug('admin');
            setIsActive(true);
        }
    }, [rule, isOpen]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!name || name.length < 3) newErrors.name = 'Name must be at least 3 characters';
        if (!actionCode) newErrors.actionCode = 'Action code is required';
        if (requiredApprovals < 1 || requiredApprovals > 5)
            newErrors.requiredApprovals = 'Required approvals must be between 1 and 5';
        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = { name, actionCode, requiredApprovals, approverSlug, isActive };
            if (isEditing) {
                await update('MAKER_CHECKER_RULES', payload, { id: rule!.id! });
            } else {
                await post('MAKER_CHECKER_RULES', payload);
            }
            toast.success(`Rule ${isEditing ? 'updated' : 'created'} successfully`);
            onSubmit(payload);
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save rule');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedActionCode = actionCodes.find((ac) => ac.value === actionCode);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Rule' : 'New Rule'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="rule-name">Name</Label>
                        <Input
                            id="rule-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. User deletion requires 2 approvals"
                            disabled={isSubmitting}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <Label htmlFor="action-code">Action Code</Label>
                        <select
                            id="action-code"
                            title="Action code"
                            value={actionCode}
                            onChange={(e) => setActionCode(e.target.value)}
                            disabled={isSubmitting || isLoadingCodes}
                            className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm"
                        >
                            <option value="">
                                {isLoadingCodes ? 'Loading action codes...' : 'Select an action...'}
                            </option>
                            {actionCodes.map((ac) => (
                                <option key={ac.value} value={ac.value}>
                                    {ac.label} ({ac.resource})
                                </option>
                            ))}
                        </select>
                        {errors.actionCode && (
                            <p className="text-red-500 text-xs mt-1">{errors.actionCode}</p>
                        )}
                        {selectedActionCode && (
                            <p className="text-gray-500 text-xs mt-2 italic">
                                {selectedActionCode.description}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="required-approvals">Required Approvals (1-5)</Label>
                        <Input
                            id="required-approvals"
                            type="number"
                            min={1}
                            max={5}
                            value={requiredApprovals}
                            onChange={(e) => setRequiredApprovals(Number(e.target.value))}
                            disabled={isSubmitting}
                        />
                        {errors.requiredApprovals && (
                            <p className="text-red-500 text-xs mt-1">{errors.requiredApprovals}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="approver-slug">Approver Role</Label>
                        <select
                            id="approver-slug"
                            title="Approver role"
                            value={approverSlug}
                            onChange={(e) => setApproverSlug(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm"
                        >
                            {APPROVER_OPTIONS.map((a) => (
                                <option key={a.value} value={a.value}>
                                    {a.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="is-active"
                            type="checkbox"
                            title="Toggle active status"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            disabled={isSubmitting}
                            className="h-4 w-4"
                        />
                        <Label htmlFor="is-active">Active</Label>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || isLoadingCodes}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Update Rule' : 'Create Rule'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
