import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from '@/components/icons';
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
    { value: 'super_admin', label: 'Super admin' },
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
        if (!name || name.length < 3) newErrors.name = 'Enter a name of at least 3 characters.';
        if (!actionCode) newErrors.actionCode = 'Choose an action code.';
        if (requiredApprovals < 1 || requiredApprovals > 5)
            newErrors.requiredApprovals = 'Enter a number from 1 to 5.';
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
            toast.success(`Rule ${isEditing ? 'updated' : 'created'}`);
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
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit rule' : 'Create rule'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="rule-name">Name</Label>
                        <Input
                            id="rule-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="User deletion needs 2 approvals"
                            disabled={isSubmitting}
                        />
                        {errors.name && <p className="text-risk text-xs">{errors.name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="action-code">Action code</Label>
                        <Select
                            value={actionCode}
                            // Radix emits '' while options are still loading; keep the chosen code.
                            onValueChange={(value) => value && setActionCode(value)}
                            disabled={isSubmitting || isLoadingCodes}
                        >
                            <SelectTrigger id="action-code">
                                <SelectValue placeholder={isLoadingCodes ? 'Loading action codes' : 'Choose an action'} />
                            </SelectTrigger>
                            <SelectContent>
                                {actionCodes.map((ac) => (
                                    <SelectItem key={ac.value} value={ac.value}>
                                        {ac.label} ({ac.resource})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.actionCode && (
                            <p className="text-risk text-xs">{errors.actionCode}</p>
                        )}
                        {selectedActionCode && (
                            <p className="text-text-muted text-xs">
                                {selectedActionCode.description}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="required-approvals">Required approvals (1 to 5)</Label>
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
                            <p className="text-risk text-xs">{errors.requiredApprovals}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="approver-slug">Approver role</Label>
                        <Select
                            value={approverSlug}
                            onValueChange={(value) => value && setApproverSlug(value)}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger id="approver-slug">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {APPROVER_OPTIONS.map((a) => (
                                    <SelectItem key={a.value} value={a.value}>
                                        {a.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch
                            id="is-active"
                            checked={isActive}
                            onCheckedChange={setIsActive}
                            disabled={isSubmitting}
                        />
                        <Label htmlFor="is-active">Active</Label>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || isLoadingCodes}>
                            {isSubmitting && <Loader2 className="animate-spin" />}
                            {isEditing ? 'Save rule' : 'Create rule'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
