//Depracated: This page is no longer used

import { useEffect, useState } from 'react';
import {
  getDashboardCardDefinitions,
  getDashboardCardConfiguration,
  updateDashboardCardConfiguration,
  type DashboardCardDefinition,
  type SaveCardConfigRequest,
  USE_MOCK_DASHBOARD,
} from '@/lib/api/dashboard';
import { fetchData } from '@/lib/api/crud';
import { useMockDashboard } from '@/lib/store/mockDashboardStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { SectionBody } from '@/components/shared/SectionBody';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LayoutDashboard, Save, Plus } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { CreateCardModal } from '@/components/dashboard/CreateCardModal';

interface CardConfig {
  cardDefinitionId: string;
  cardId: string;
  title: string;
  departmentId: string;
  roleId?: string | null;
  visible: boolean;
  orderIndex: number;
  permissionRequired?: string;
}

export default function DashboardConfigurationPage() {
  const [cardDefinitions, setCardDefinitions] = useState<DashboardCardDefinition[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  const [cardConfigs, setCardConfigs] = useState<CardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { toast } = useToast();
  const mockStore = useMockDashboard();

  // Load card definitions and configurations on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load card definitions
        const cards = await getDashboardCardDefinitions();
        setCardDefinitions(cards || []);

        // Load departments and roles
        let deptList: { id: string; name: string }[] = [];
        let roleList: { id: string; name: string }[] = [];

        if (USE_MOCK_DASHBOARD) {
          // Use mock store directly
          deptList = mockStore.getDepartments().map((d) => ({ id: d.id, name: d.name }));
          roleList = mockStore.getRoles().map((r) => ({ id: r.id, name: r.name }));
        } else {
          // Load from backend API
          const [deptRes, rolesRes] = await Promise.all([
            fetchData('DEPARTMENTS', 'GET', {}, null, { page: '1', limit: '200' }),
            fetchData('ROLES', 'GET', {}, null, { page: '1', limit: '200' }),
          ]);

          deptList = (Array.isArray(deptRes) ? deptRes : (deptRes as any)?.data ?? []) as {
            id: string;
            name: string;
          }[];
          roleList = (Array.isArray(rolesRes) ? rolesRes : (rolesRes as any)?.data ?? []) as {
            id: string;
            name: string;
          }[];
        }

        setDepartments(deptList);
        setRoles(roleList);

        // Set default department to first available
        if (deptList.length > 0) {
          setSelectedDepartment(deptList[0].id);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Couldn't load the configuration";
        setError(message);
        toast({
          title: "Couldn't load the configuration",
          description: message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load configurations when department/role selection changes
  useEffect(() => {
    if (!selectedDepartment) return;

    const loadConfigs = async () => {
      try {
        const configResponse = await getDashboardCardConfiguration(
          selectedDepartment,
          selectedRole || undefined
        );

        // Handle both array and object response formats
        let configsList = Array.isArray(configResponse)
          ? configResponse
          : (configResponse as any)?.configurations || [];

        if (configsList.length > 0) {
          const mapped = (configsList as any[]).map((cfg: any, idx: number) => ({
            cardDefinitionId: cfg.cardDefinitionId || cfg.card_definition_id,
            cardId: cfg.cardId || cardDefinitions.find(cd => cd.id === (cfg.cardDefinitionId || cfg.card_definition_id))?.card_id || '',
            title: cfg.title || cardDefinitions.find(cd => cd.id === (cfg.cardDefinitionId || cfg.card_definition_id))?.title || '',
            departmentId: cfg.departmentId || cfg.department_id,
            roleId: cfg.roleId || cfg.role_id,
            visible: cfg.visible !== undefined ? cfg.visible : true,
            orderIndex: cfg.orderIndex || cfg.order_index || idx,
            permissionRequired: cfg.permissionRequired || cfg.permission_required,
          }));
          setCardConfigs(mapped);
        } else {
          throw new Error('No configurations found');
        }
      } catch (err) {
        // If no configs exist, create default configs for all cards
        const defaultConfigs = cardDefinitions.map((card, idx) => ({
          cardDefinitionId: card.id,
          cardId: card.card_id,
          title: card.title,
          departmentId: selectedDepartment,
          roleId: selectedRole || null,
          visible: true,
          orderIndex: idx,
          permissionRequired: undefined,
        }));
        setCardConfigs(defaultConfigs);
      }
    };

    loadConfigs();
  }, [selectedDepartment, selectedRole, cardDefinitions]);

  const handleCardVisibilityChange = (cardId: string, visible: boolean) => {
    setCardConfigs((prev) =>
      prev.map((cfg) =>
        cfg.cardId === cardId ? { ...cfg, visible } : cfg
      )
    );
  };

  const handleOrderChange = (cardId: string, order: number) => {
    setCardConfigs((prev) =>
      prev.map((cfg) =>
        cfg.cardId === cardId ? { ...cfg, orderIndex: order } : cfg
      )
    );
  };

  const handlePermissionChange = (cardId: string, permission: string) => {
    setCardConfigs((prev) =>
      prev.map((cfg) =>
        cfg.cardId === cardId ? { ...cfg, permissionRequired: permission === 'none' ? undefined : permission } : cfg
      )
    );
  };

  const handleSaveConfiguration = async () => {
    try {
      setSaving(true);

      for (const config of cardConfigs) {
        const req: SaveCardConfigRequest = {
          card_id: config.cardId,
          department_id: config.departmentId,
          role_id: config.roleId,
          visible: config.visible,
          order_index: config.orderIndex,
          permission_required: config.permissionRequired,
        };

        await updateDashboardCardConfiguration(req);
      }

      toast({
        title: 'Configuration saved',
        description: 'Dashboards use the new card settings.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Try saving again.';
      toast({
        title: "Couldn't save the configuration",
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCardCreated = async () => {
    // Reload card definitions
    try {
      const cards = await getDashboardCardDefinitions();
      setCardDefinitions(cards || []);
      
      // Reset configs to defaults for the newly created card
      if (selectedDepartment) {
        const defaultConfigs = (cards || []).map((card, idx) => ({
          cardDefinitionId: card.id,
          cardId: card.card_id,
          title: card.title,
          departmentId: selectedDepartment,
          roleId: selectedRole || null,
          visible: true,
          orderIndex: idx,
          permissionRequired: undefined,
        }));
        setCardConfigs(defaultConfigs);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reload the page to see the new card.';
      toast({
        title: "Couldn't refresh the cards",
        description: message,
        variant: 'destructive',
      });
    }
  };

  if (loading || error) {
    return (
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
        <PageHeader title="Dashboard configuration" />
        <SectionCard padded={false}>
          <SectionBody loading={loading} error={error} skeleton={<TableSkeleton columns={5} />}>
            {null}
          </SectionBody>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      {/* Header */}
      <PageHeader
        title="Dashboard configuration"
        description="Choose which cards appear on each department's and role's dashboard, their order and the permission they need."
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Create card
            </Button>
            <Button onClick={handleSaveConfiguration} disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving' : 'Save configuration'}
            </Button>
          </>
        }
      />

      {/* Filters */}
      <SectionCard title="Scope">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="config-department">Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger id="config-department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="config-role">Role (optional)</Label>
              <Select value={selectedRole || 'all'} onValueChange={(val) => setSelectedRole(val === 'all' ? '' : val)}>
                <SelectTrigger id="config-role">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
      </SectionCard>

      {/* Configuration Table */}
      <SectionCard
        eyebrow={selectedDepartment ? 'Selected department' : 'All departments'}
        title="Cards"
        padded={false}
      >
          {cardConfigs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Card name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-24 text-center">Visible</TableHead>
                    <TableHead className="w-24">Order</TableHead>
                    <TableHead>Permission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cardConfigs.map((config) => (
                    <TableRow key={config.cardId}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-text-primary">{config.title}</p>
                          <p className="mt-1 font-mono text-xs text-text-muted">{config.cardId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone="neutral" label={config.cardId.split('_')[0]} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          aria-label={`Show ${config.title}`}
                          checked={config.visible}
                          onCheckedChange={(checked) =>
                            handleCardVisibilityChange(config.cardId, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          aria-label={`Order of ${config.title}`}
                          value={config.orderIndex}
                          onChange={(e) =>
                            handleOrderChange(config.cardId, parseInt(e.target.value) || 0)
                          }
                          className="w-20 font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={config.permissionRequired || 'none'}
                          onValueChange={(val) =>
                            handlePermissionChange(config.cardId, val)
                          }
                        >
                          <SelectTrigger className="w-44" aria-label={`Permission for ${config.title}`}>
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="view_analytics">View analytics</SelectItem>
                            <SelectItem value="view_escalations">View escalations</SelectItem>
                            <SelectItem value="configure_dashboard_cards">
                              Configure cards
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={<LayoutDashboard size={24} />}
              title="No cards yet"
              description="Create a card to choose where it appears."
            />
          )}
      </SectionCard>

      {/* Create Card Modal */}
      <CreateCardModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCardCreated={handleCardCreated}
      />
    </div>
  );
}
