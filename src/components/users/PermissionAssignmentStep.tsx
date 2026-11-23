import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
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

  const getActionColor = (action: string): string => {
    switch (action.toLowerCase()) {
      case 'read':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'write':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'delete':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'approve':
        return 'bg-signal-tint border-line text-signal-text';
      case 'manage':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'export':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'sign':
        return 'bg-surface-2 border-line text-text-secondary';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-positive-tint border border-line rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-1">Permission Assignment</h3>
        <p className="text-sm text-blue-700 leading-relaxed">
          Assign permissions to control what this user can access and do in the system. Use the quick-select buttons to streamline your workflow.
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
            <Card
              key={resource}
              className="border-gray-150 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden bg-white"
            >
              <CardHeader className="pb-3 bg-surface-2">
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => toggleCategory(resource)}
                    className="flex items-center gap-3 flex-1 hover:bg-white/50 rounded-lg px-2 py-1 transition"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 capitalize text-sm">
                        {resource.replace(/_/g, ' ')}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {progress.total} permission{progress.total !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                    <div className="text-right">
                      <div className="font-semibold text-sm text-gray-900">
                        {progress.selected}
                      </div>
                      <div className="text-xs text-gray-500">
                        of {progress.total}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectAllForResource(resource)}
                        className="text-xs h-8 border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 rounded-lg"
                      >
                        All
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deselectAllForResource(resource)}
                        className="text-xs h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-6 space-y-5">
                  {actions.map((action) => {
                    const actionPerms = actionGrouped[action];
                    const actionSelectedCount = actionPerms.filter((p) =>
                      selectedPermissions.includes(String(p.id))
                    ).length;

                    return (
                      <div key={action} className={`rounded-xl border p-5 transition ${getActionColor(action)}`}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold capitalize text-sm">
                            {action.replace(/_/g, ' ')} Permissions
                          </h4>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-xs font-semibold">
                                {actionSelectedCount}
                              </div>
                              <div className="text-xs opacity-75">
                                of {actionPerms.length}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                actionSelectedCount === actionPerms.length
                                  ? deselectAllForAction(resource, action)
                                  : selectAllForAction(resource, action)
                              }
                              className="text-xs h-7 px-2 hover:bg-white/30 rounded-lg font-medium"
                            >
                              {actionSelectedCount === actionPerms.length
                                ? 'Deselect'
                                : 'Select All'}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {actionPerms.map((perm) => {
                            const isSelected = selectedPermissions.includes(String(perm.id));
                            return (
                              <label
                                key={perm.id}
                                className="flex items-start gap-3 cursor-pointer hover:bg-white/40 p-3 rounded-lg transition group"
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => togglePermission(String(perm.id))}
                                  className="mt-1 group-hover:border-current"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm leading-snug">
                                    {perm.description || `${perm.resource}.${perm.action}`}
                                  </p>
                                  {perm.description && (
                                    <p className="text-xs opacity-70 mt-1">
                                      Scope: {perm.resource}.{perm.action}
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
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {categories.length === 0 && (
        <Card className="border-dashed bg-surface-2 rounded-lg">
          <CardContent className="py-16 text-center text-gray-500">
            <p className="font-medium">No permissions available to assign</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
