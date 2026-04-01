import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { update } from '@/lib/api/crud';
import type { Role, Permission } from '@/types/rbac';

interface RolePermissionsPanelProps {
  role: Role;
  allPermissions: Permission[];
  onSave: (permissionIds: string[]) => void;
  isSaving: boolean;
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

export function RolePermissionsPanel({
  role,
  allPermissions,
  onSave,
  isSaving,
}: RolePermissionsPanelProps) {
  const currentIds = role.permissions.map((p) => String(p.id));
  const [selected, setSelected] = useState<string[]>(currentIds);
  const [showConfirm, setShowConfirm] = useState(false);

  const isSystemRole = SYSTEM_ROLES.includes(role.slug);
  const grouped = groupByResource(allPermissions);
  const hasChanges = JSON.stringify(selected.sort()) !== JSON.stringify(currentIds.sort());

  const toggle = (id: string) => {
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
      await update('ROLES', { permissionIds: selected }, { id: String(role.id) });
      toast.success('Permissions saved');
      onSave(selected);
      setShowConfirm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save permissions');
    }
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Edit Permissions</h3>
        <p className="text-sm text-gray-500">{role.name}</p>
        {isSystemRole && (
          <p className="text-xs text-yellow-600 mt-1">
            Core permissions for this role cannot be removed
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(grouped).map(([resource, perms]) => (
          <div key={resource}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {resource}
            </p>
            <div className="space-y-2">
              {perms.map((perm) => {
                const id = String(perm.id);
                const isChecked = selected.includes(id);
                const isLocked = isSystemRole && currentIds.includes(id);
                return (
                  <label
                    key={id}
                    className={`flex items-center gap-2 text-sm ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <input
                      type="checkbox"
                      title={`${perm.resource}.${perm.action}`}
                      checked={isChecked}
                      onChange={() => toggle(id)}
                      disabled={isLocked}
                      className="h-4 w-4"
                    />
                    <span>{perm.action}</span>
                    {perm.description && (
                      <span className="text-gray-400 text-xs">— {perm.description}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {showConfirm && (
        <div className="p-4 bg-yellow-50 border-t border-yellow-200">
          <p className="text-sm text-yellow-800 mb-3">
            Are you sure you want to change permissions for {role.name}?
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={doSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Confirm
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!showConfirm && (
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex-1"
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelected(currentIds)}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}