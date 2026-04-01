import React, { useState, useEffect } from 'react';
import { MakerCheckerRule, PermissionAction, RoleSlug } from '@/types/rbac';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Omit 'id' and add any form-specific fields. 
// Note: we add 'name' as requested, though it might be mapped to 'resource' or handled differently outside
export type RuleFormData = Omit<MakerCheckerRule, 'id'> & { name?: string };

export interface MakerCheckerRuleFormProps {
  rule?: MakerCheckerRule & { name?: string };
  onSubmit: (data: RuleFormData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export default function MakerCheckerRuleForm({ rule, onSubmit, isSubmitting, onCancel }: MakerCheckerRuleFormProps) {
  const [name, setName] = useState('');
  const [actionCode, setActionCode] = useState<PermissionAction | ''>('');
  const [resourceType, setResourceType] = useState('');
  const [requiredApprovals, setRequiredApprovals] = useState<number | ''>('');
  const [approverSlug, setApproverSlug] = useState<RoleSlug | ''>('');
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (rule) {
      setName(rule.name || '');
      setActionCode(rule.action as PermissionAction || '');
      setResourceType(rule.resource || '');
      setRequiredApprovals(rule.requiredApprovals || '');
      setApproverSlug((rule.approverRoles && rule.approverRoles[0]) || '');
      setIsActive(rule.isActive !== false);
    }
  }, [rule]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name || name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }
    if (!actionCode) {
      newErrors.actionCode = 'Action code is required';
    }
    if (!resourceType) {
      newErrors.resourceType = 'Resource type is required';
    }
    if (requiredApprovals === '' || requiredApprovals < 1 || requiredApprovals > 5) {
      newErrors.requiredApprovals = 'Required approvals must be between 1 and 5';
    }
    if (!approverSlug) {
      newErrors.approverSlug = 'Approver is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    validate();
  }, [name, actionCode, resourceType, requiredApprovals, approverSlug, isActive]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name,
      action: actionCode as PermissionAction,
      resource: resourceType,
      requiredApprovals: Number(requiredApprovals),
      approverRoles: [approverSlug as RoleSlug],
      isActive,
    });
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md bg-white p-6 rounded-md border">
      <div>
        <Label htmlFor="rule-name">Name <span className="text-red-500">*</span></Label>
        <Input id="rule-name" value={name} onChange={e => setName(e.target.value)} />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="rule-action">Action Code <span className="text-red-500">*</span></Label>
        <select
          id="rule-action"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={actionCode}
          onChange={e => setActionCode(e.target.value as PermissionAction)}
        >
          <option value="" disabled>Select Action</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
        {errors.actionCode && <p className="text-red-500 text-sm mt-1">{errors.actionCode}</p>}
      </div>

      <div>
        <Label htmlFor="rule-resource">Resource Type <span className="text-red-500">*</span></Label>
        <Input id="rule-resource" value={resourceType} onChange={e => setResourceType(e.target.value)} />
        {errors.resourceType && <p className="text-red-500 text-sm mt-1">{errors.resourceType}</p>}
      </div>

      <div>
        <Label htmlFor="rule-approvals">Required Approvals <span className="text-red-500">*</span></Label>
        <Input 
          id="rule-approvals" 
          type="number" 
          min="1" 
          max="5"
          value={requiredApprovals} 
          onChange={e => setRequiredApprovals(e.target.value ? Number(e.target.value) : '')} 
        />
        {errors.requiredApprovals && <p className="text-red-500 text-sm mt-1">{errors.requiredApprovals}</p>}
      </div>

      <div>
        <Label htmlFor="rule-approver">Approver Role <span className="text-red-500">*</span></Label>
        <select
          id="rule-approver"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={approverSlug}
          onChange={e => setApproverSlug(e.target.value as RoleSlug)}
        >
          <option value="" disabled>Select Role</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
        </select>
        {errors.approverSlug && <p className="text-red-500 text-sm mt-1">{errors.approverSlug}</p>}
      </div>

      <div className="flex items-center space-x-2 pt-2">
         <input type="checkbox" id="rule-active" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
         <Label htmlFor="rule-active">Is Active</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={hasErrors || isSubmitting}>
          {isSubmitting ? 'Saving...' : (rule ? 'Update Rule' : 'Create Rule')}
        </Button>
      </div>
    </form>
  );
}
