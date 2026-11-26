import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/shared/EmptyState';
import { ChevronDown, ChevronUp } from '@/components/icons';
import type { Permission } from '@/types/rbac';

interface PermissionAssignmentStepProps {
  allPermissions: Permission[];
  selectedPermissions: string[];
  onPermissionsChange: (permissionIds: string[]) => void;
}

// Group permissions by resource/category
const groupByResource = (permissions: Permission[]) => {
  return permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {});
};

export function PermissionAssignmentStep({
  allPermissions,
  selectedPermissions,
  onPermissionsChange,
}: PermissionAssignmentStepProps) {
  const grouped = useMemo(() => groupByResource(allPermissions), [allPermissions]);
  const categories = Object.keys(grouped).sort();
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.slice(0, 3)) // Expand first 3 by default
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const togglePermission = (permissionId: string) => {
    if (selectedPermissions.includes(permissionId)) {
      onPermissionsChange(selectedPermissions.filter((id) => id !== permissionId));
    } else {
      onPermissionsChange([...selectedPermissions, permissionId]);
    }
  };

  const selectAllForAction = (resource: string, action: string) => {
    const permissionsToSelect = grouped[resource]
      .filter((p) => p.action === action)
      .map((p) => String(p.id));
    
    const newSelected = new Set(selectedPermissions.map(String));
    permissionsToSelect.forEach((id) => newSelected.add(id));
    
    onPermissionsChange(Array.from(newSelected));
  };

  const deselectAllForAction = (resource: string, action: string) => {
    const permissionsToDeselect = grouped[resource]
      .filter((p) => p.action === action)
      .map((p) => String(p.id));
    
    const newSelected = selectedPermissions.filter(
      (id) => !permissionsToDeselect.includes(id)
    );
    
    onPermissionsChange(newSelected);
  };

  const selectAllForResource = (resource: string) => {
    const permissionsToSelect = grouped[resource].map((p) => String(p.id));
    const newSelected = new Set(selectedPermissions.map(String));
    permissionsToSelect.forEach((id) => newSelected.add(id));
    
    onPermissionsChange(Array.from(newSelected));
  };

  const deselectAllForResource = (resource: string) => {
    const permissionsToDeselect = grouped[resource].map((p) => String(p.id));
    const newSelected = selectedPermissions.filter(
      (id) => !permissionsToDeselect.includes(id)
    );
    
    onPermissionsChange(newSelected);
  };

  const getCategoryProgress = (resource: string): { selected: number; total: number } => {
    const resourcePermissions = grouped[resource];
    const total = resourcePermissions.length;
    const selected = resourcePermissions.filter((p) =>
      selectedPermissions.includes(String(p.id))
    ).length;
    return { selected, total };
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-md bg-field p-4">
        <h3 className="font-semibold text-sm text-text-primary mb-1">Permissions</h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          Choose what this user can see and do. Select a whole group or single permissions.
        </p>
      </div>

      <div className="space-y-4">
        {categories.map((resource) => {
          const progress = getCategoryProgress(resource);
          const isExpanded = expandedCategories.has(resource);
          const resourcePermissions = grouped[resource];
          const actionGrouped = resourcePermissions.reduce<Record<string, Permission[]>>((acc, perm) => {
            if (!acc[perm.action]) acc[perm.action] = [];
            acc[perm.action].push(perm);
            return acc;
          }, {});
          const actions = Object.keys(actionGrouped).sort();

          return (
            <section
              key={resource}
              className="rounded-lg border border-line bg-surface-1 overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 p-3">
                <button
                  type="button"
                  onClick={() => toggleCategory(resource)}
                  aria-expanded={isExpanded}
                  className="flex items-center gap-3 flex-1 min-w-0 hover:bg-surface-2 rounded-md px-2 py-1 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-signal-text shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-text-muted shrink-0" />
                  )}
                  <div className="text-left">
                    <h3 className="font-semibold text-text-primary text-sm first-letter:uppercase">
                      {resource.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      <span className="font-mono">{progress.selected}</span> of <span className="font-mono">{progress.total}</span> selected
                    </p>
                  </div>
                </button>
                <div className="flex gap-1.5 ml-auto shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => selectAllForResource(resource)}
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => deselectAllForResource(resource)}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-line p-4 space-y-4">
                  {actions.map((action) => {
                    const actionPerms = actionGrouped[action];
                    const actionSelectedCount = actionPerms.filter((p) =>
                      selectedPermissions.includes(String(p.id))
                    ).length;

                    return (
                      <div key={action} className="rounded-md bg-field p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-sm text-text-primary first-letter:uppercase">
                            {action.replace(/_/g, ' ')} permissions
                          </h4>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-text-muted">
                              <span className="font-mono">{actionSelectedCount}</span> of <span className="font-mono">{actionPerms.length}</span>
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                actionSelectedCount === actionPerms.length
                                  ? deselectAllForAction(resource, action)
                                  : selectAllForAction(resource, action)
                              }
                            >
                              {actionSelectedCount === actionPerms.length
                                ? 'Clear all'
                                : 'Select all'}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          {actionPerms.map((perm) => {
                            const isSelected = selectedPermissions.includes(String(perm.id));
                            return (
                              <label
                                key={perm.id}
                                className="flex items-start gap-3 cursor-pointer hover:bg-surface-2 p-2 rounded-sm transition-colors"
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => togglePermission(String(perm.id))}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-text-primary leading-snug">
                                    {perm.description || `${perm.resource}.${perm.action}`}
                                  </p>
                                  {perm.description && (
                                    <p className="font-mono text-xs text-text-muted mt-1">
                                      {perm.resource}.{perm.action}
                                    </p>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {categories.length === 0 && (
        <EmptyState title="No permissions to assign" description="Permissions appear here once they are set up." />
      )}
    </div>
  );
}
