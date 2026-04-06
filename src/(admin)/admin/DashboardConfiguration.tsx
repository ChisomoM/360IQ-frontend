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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Save, Plus } from 'lucide-react';
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
        const message = err instanceof Error ? err.message : 'Failed to load configuration';
        setError(message);
        toast({
          title: 'Error',
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
        title: 'Success',
        description: 'Dashboard configuration saved successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save configuration';
      toast({
        title: 'Error',
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
      const message = err instanceof Error ? err.message : 'Failed to refresh cards';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 bg-gradient-to-b from-slate-50 to-white min-h-screen">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-6 bg-gradient-to-b from-slate-50 to-white min-h-screen">
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-red-200/50 shadow-premium-md">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-900">Error</h3>
          <p className="text-red-700 text-sm mt-2 max-w-md text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-gradient-to-b from-slate-50 to-white min-h-screen">
      {/* Header */}
      <div className="animate-fade-in-up">
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Configuration</h1>
        </div>
        <p className="text-base text-slate-600 max-w-2xl">
          Customize which cards appear on dashboards for different departments and roles. Control visibility, ordering, and required permissions.
        </p>
      </div>

      {/* Filters */}
      <Card className="border-slate-200/50 shadow-premium-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">Scope Selection</CardTitle>
          <CardDescription className="text-slate-600">Choose a department and optional role to configure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-slate-900 mb-3 block uppercase tracking-wider">
                Department
              </label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200/50 text-slate-900">
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
            <div>
              <label className="text-sm font-semibold text-slate-900 mb-3 block uppercase tracking-wider">
                Role <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Select value={selectedRole || 'all'} onValueChange={(val) => setSelectedRole(val === 'all' ? '' : val)}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200/50 text-slate-900">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Table */}
      <Card className="border-slate-200/50 shadow-premium-sm animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <CardHeader className="border-b border-slate-200/50 pb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-lg text-slate-900">Card Configuration</CardTitle>
              <CardDescription className="text-slate-600 mt-1">
                Manage visibility and order for {selectedDepartment ? 'the selected department' : 'all departments'}
              </CardDescription>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(true)}
                className="gap-2 border-slate-200/50 text-primary hover:bg-primary/5"
              >
                <Plus className="w-4 h-4" />
                Create Card
              </Button>
              <Button
                onClick={handleSaveConfiguration}
                disabled={saving}
                className="gap-2 shadow-premium-md hover:shadow-premium-lg transition-all"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {cardConfigs.length > 0 ? (
            <div className="rounded-xl border border-slate-200/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-gradient-to-r from-slate-50/50 to-slate-100/50 border-b border-slate-200/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-slate-900 text-xs uppercase tracking-wider">Card Name</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-xs uppercase tracking-wider">Type</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-xs uppercase tracking-wider w-24 text-center">
                      Visible
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 text-xs uppercase tracking-wider w-20">Order</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-xs uppercase tracking-wider">Permission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cardConfigs.map((config, idx) => (
                    <TableRow 
                      key={config.cardId} 
                      className={`hover:bg-primary/5 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} border-b border-slate-100/50`}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{config.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{config.cardId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {config.cardId.split('_')[0]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={config.visible}
                          onCheckedChange={(checked) =>
                            handleCardVisibilityChange(config.cardId, checked as boolean)
                          }
                          className="border-slate-300"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={config.orderIndex}
                          onChange={(e) =>
                            handleOrderChange(config.cardId, parseInt(e.target.value) || 0)
                          }
                          className="w-16 bg-slate-50/50 border-slate-200/50 text-slate-900"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={config.permissionRequired || 'none'}
                          onValueChange={(val) =>
                            handlePermissionChange(config.cardId, val)
                          }
                        >
                          <SelectTrigger className="text-xs bg-slate-50/50 border-slate-200/50 w-auto">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="view_analytics">View Analytics</SelectItem>
                            <SelectItem value="view_escalations">View Escalations</SelectItem>
                            <SelectItem value="configure_dashboard_cards">
                              Configure Cards
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
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl bg-slate-50/30 border border-slate-200/30">
              <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
              <p className="text-slate-600 font-medium">No cards available</p>
              <p className="text-slate-500 text-sm mt-1">Create a new card to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Card Modal */}
      <CreateCardModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCardCreated={handleCardCreated}
      />
    </div>
  );
}
