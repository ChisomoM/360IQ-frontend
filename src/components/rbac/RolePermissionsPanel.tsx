import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { update } from '@/lib/api/crud';
import type { Role, Permission } from '@/types/rbac';

interface RolePermissionsPanelProps {
  role: Role | null;
  allPermissions: Permission[];
  onSave: (permissionIds: string[]) => void;
  isSaving: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Group permissions by resource for display
const groupByResource = (permissions: Permission[]) => {
  return permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {});
};

// System roles whose core permissions cannot be removed
const SYSTEM_ROLES = ['super_admin', 'admin'];

// Resources that should not be toggled for any role
const LOCKED_RESOURCES = ['roles', 'users', 'permissions', 'maker_checker', 'system'];

export function RolePermissionsPanel({
  role,
  allPermissions,
  onSave,
  isSaving,
  isOpen,
  onOpenChange,
}: RolePermissionsPanelProps) {
  if (!role) return null;

  const currentIds = role.permissions.map((p) => String(p.id));
  const [selected, setSelected] = useState<string[]>(currentIds);
  const [showConfirm, setShowConfirm] = useState(false);

  const isSystemRole = SYSTEM_ROLES.includes(role.slug);
  const grouped = groupByResource(allPermissions);
  const hasChanges = JSON.stringify(selected.sort()) !== JSON.stringify(currentIds.sort());

  const isResourceLocked = (resource: string): boolean => {
    return LOCKED_RESOURCES.some((locked) => resource.toLowerCase().includes(locked.toLowerCase()));
  };

  const toggle = (id: string, resource: string) => {
    // Don't allow toggling locked resources
    if (isResourceLocked(resource)) return;
    
    // System role core permissions cannot be unchecked
    if (isSystemRole && currentIds.includes(id)) return;
    
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (hasChanges) {
      setShowConfirm(true);
      return;
    }
    await doSave();
  };

  const doSave = async () => {
    try {
      await update('ADMIN_ROLE_PERMISSIONS', { permissionIds: selected }, { slug: role.slug });
      toast.success('Permissions saved');
      onSave(selected);
      setShowConfirm(false);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save permissions');
    }
  };

  const handleCancel = () => {
    setSelected(currentIds);
    setShowConfirm(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Role Permissions</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">{role.name}</p>
        </DialogHeader>

        {(isSystemRole || Object.entries(grouped).some(([r]) => isResourceLocked(r))) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
            <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              {isSystemRole && "Core permissions for this role cannot be modified. "}
              {Object.entries(grouped).some(([r]) => isResourceLocked(r)) && "System-level permissions are locked and cannot be toggled."}
            </span>
          </div>
        )}

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {Object.entries(grouped).map(([resource, perms]) => {
              const resourceLocked = isResourceLocked(resource);
              return (
                <div key={resource}>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {resource}
                    </p>
                    {resourceLocked && (
                      <Lock className="h-3 w-3 text-gray-400" title="This resource is locked and cannot be modified" />
                    )}
                  </div>
                  <div className="space-y-2 pl-4">
                    {perms.map((perm) => {
                      const id = String(perm.id);
                      const isChecked = selected.includes(id);
                      const isLocked = resourceLocked || (isSystemRole && currentIds.includes(id));
                      return (
                        <label
                          key={id}
                          className={`flex items-center gap-2 text-sm ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <input
                            type="checkbox"
                            title={`${perm.resource}.${perm.action}`}
                            checked={isChecked}
                            onChange={() => toggle(id, resource)}
                            disabled={isLocked}
                            className="h-4 w-4"
                          />
                          <span>{perm.action}</span>
                          {perm.description && (
                            <span className="text-gray-400 text-xs">— {perm.description}</span>
                          )}
                          {isLocked && <Lock className="h-3 w-3 text-gray-400 ml-auto" />}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {showConfirm && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            Are you sure you want to change permissions for {role.name}?
          </div>
        )}

        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {showConfirm ? 'Confirm' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}