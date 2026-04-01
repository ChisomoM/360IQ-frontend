import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { post, update } from '@/lib/api/crud';

export interface MakerCheckerRule {
    id?: string;
    name: string;
    actionCode: string;
    resourceType: string;
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

const ACTION_CODE_OPTIONS = [
    { value: 'user.delete', label: 'User Deletion' },
    { value: 'user.create', label: 'User Creation' },
    { value: 'document.approve', label: 'Document Approval' },
    { value: 'payment.process', label: 'Payment Processing' },
    { value: 'role.assign', label: 'Role Assignment' },
];

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
    const [resourceType, setResourceType] = useState('');
    const [requiredApprovals, setRequiredApprovals] = useState(1);
    const [approverSlug, setApproverSlug] = useState('admin');
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isEditing = !!rule?.id;

    // Pre-populate when editing
    useEffect(() => {
        if (rule) {
            setName(rule.name);
            setActionCode(rule.actionCode);
            setResourceType(rule.resourceType);
            setRequiredApprovals(rule.requiredApprovals);
            setApproverSlug(rule.approverSlug);
            setIsActive(rule.isActive);
        } else {
            setName('');
            setActionCode('');
            setResourceType('');
            setRequiredApprovals(1);
            setApproverSlug('admin');
            setIsActive(true);
        }
    }, [rule]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!name || name.length < 3) newErrors.name = 'Name must be at least 3 characters';
        if (!actionCode) newErrors.actionCode = 'Action code is required';
        if (!resourceType) newErrors.resourceType = 'Resource type is required';
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
            const payload = { name, actionCode, resourceType, requiredApprovals, approverSlug, isActive };
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
                            disabled={isSubmitting}
                            className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm"
                        >
                            <option value="">Select action...</option>
                            {ACTION_CODE_OPTIONS.map((a) => (
                                <option key={a.value} value={a.value}>{a.label}</option>
                            ))}
                        </select>
                        {errors.actionCode && <p className="text-red-500 text-xs mt-1">{errors.actionCode}</p>}
                    </div>

                    <div>
                        <Label htmlFor="resource-type">Resource Type</Label>
                        <Input
                            id="resource-type"
                            value={resourceType}
                            onChange={(e) => setResourceType(e.target.value)}
                            placeholder="e.g. user, document, payment"
                            disabled={isSubmitting}
                        />
                        {errors.resourceType && <p className="text-red-500 text-xs mt-1">{errors.resourceType}</p>}
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
                        {errors.requiredApprovals && <p className="text-red-500 text-xs mt-1">{errors.requiredApprovals}</p>}
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
                                <option key={a.value} value={a.value}>{a.label}</option>
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
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Update Rule' : 'Create Rule'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}