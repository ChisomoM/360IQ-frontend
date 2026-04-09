import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { update, remove } from '@/lib/api/crud';
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
  const isResourceLocked = (resource: string): boolean => {
    return LOCKED_RESOURCES.some((locked) => resource.toLowerCase().includes(locked.toLowerCase()));
  };
  const unlockedGrouped = Object.fromEntries(Object.entries(grouped).filter(([resource]) => !isResourceLocked(resource)));
  const lockedGrouped = Object.fromEntries(Object.entries(grouped).filter(([resource]) => isResourceLocked(resource)));
  const hasChanges = JSON.stringify(selected.sort()) !== JSON.stringify(currentIds.sort());

  const toggle = (id: string, resource: string) => {
    // Don't allow toggling locked resources
    if (isResourceLocked(resource)) return;
    
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (hasChanges && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    await doSave();
  };

  const doSave = async () => {
    try {
      // Calculate delta (only changed permissions)
      const added = selected.filter(id => !currentIds.includes(id));
      const removed = currentIds.filter(id => !selected.includes(id));

      // Send individual updates for each changed permission
      const updatePromises = [
        ...added.map(permId => update('ADMIN_ROLE_PERMISSION_GRANT', {}, { slug: role.slug, permissionId: permId })),
        ...removed.map(permId => remove('ADMIN_ROLE_PERMISSION_REVOKE', { slug: role.slug, permissionId: permId }))
      ];

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

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
      <DialogContent className="max-w-2xl max-h-[90vh] bg-white flex flex-col overflow-y-auto">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Role Permissions</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">{role.name}</p>
        </DialogHeader>

        {(isSystemRole || Object.entries(grouped).some(([r]) => isResourceLocked(r))) && (
          <div className="flex-shrink-0 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
            <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              {isSystemRole && "Core permissions for this role cannot be modified. "}
              {Object.entries(grouped).some(([r]) => isResourceLocked(r)) && "System-level permissions are locked and cannot be toggled."}
            </span>
          </div>
        )}

        <div className="space-y-4 pr-4">
          {Object.entries(unlockedGrouped).map(([resource, perms]) => (
            <div key={resource}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {resource}
                </p>
              </div>
              <div className="space-y-2 pl-4">
                {perms.map((perm) => {
                  const id = String(perm.id);
                  const isChecked = selected.includes(id);
                  const isLocked = false;
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
          ))}
          {Object.keys(lockedGrouped).length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="locked-permissions">
                <AccordionTrigger className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Locked Permissions
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {Object.entries(lockedGrouped).map(([resource, perms]) => (
                      <div key={resource}>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {resource}
                          </p>
                          <Lock className="h-3 w-3 text-gray-400" title="This resource is locked and cannot be modified" />
                        </div>
                        <div className="space-y-2 pl-4">
                          {perms.map((perm) => {
                            const id = String(perm.id);
                            const isChecked = selected.includes(id);
                            return (
                              <label
                                key={id}
                                className="flex items-center gap-2 text-sm opacity-50 cursor-not-allowed"
                              >
                                <input
                                  type="checkbox"
                                  title={`${perm.resource}.${perm.action}`}
                                  checked={isChecked}
                                  disabled={true}
                                  className="h-4 w-4"
                                />
                                <span>{perm.action}</span>
                                {perm.description && (
                                  <span className="text-gray-400 text-xs">— {perm.description}</span>
                                )}
                                <Lock className="h-3 w-3 text-gray-400 ml-auto" />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          {showConfirm && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              Are you sure you want to change permissions for {role.name}?
            </div>
          )}
        </div>



        <DialogFooter className="flex-shrink-0 flex gap-2 justify-end">
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