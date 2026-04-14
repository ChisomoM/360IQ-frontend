import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  DashboardCard,
  DashboardCardDefinition,
  DashboardCardsGroupedByZone,
  EscalationItem,
  CreateCardDefinitionRequest,
  SaveCardConfigRequest,
} from '@/lib/api/dashboard';
import {
  MOCK_CARD_DEFINITIONS,
  MOCK_ESCALATIONS,
  MOCK_CARD_CONFIGURATIONS,
  MOCK_DEPARTMENTS,
  MOCK_ROLES,
  MOCK_CHART_REVENUE_DATA,
  MOCK_CHART_HIRING_DATA,
  MOCK_TASKS_TABLE_DATA,
  MOCK_COMPLIANCE_TABLE_DATA,
  type CardConfig,
  type MockDepartment,
  type MockRole,
} from '@/lib/mocks/dashboardMockData';

interface MockDashboardState {
  // Data
  cardDefinitions: DashboardCardDefinition[];
  cardConfigurations: CardConfig[];
  escalations: EscalationItem[];
  departments: MockDepartment[];
  roles: MockRole[];

  // User context
  currentUserRole: string;
  currentUserDepartments: string[];

  // UI State
  lastUpdated: Date | null;
  isDemoMode: boolean;

  // Read operations
  getVisibleCards: (
    departmentId: string,
    roleId?: string
  ) => DashboardCard[];
  getCardsGroupedByZone: (
    departmentId: string,
    roleId?: string
  ) => DashboardCardsGroupedByZone;
  getCardConfigurationsForDept: (
    deptId: string,
    roleId?: string
  ) => CardConfig[];
  getEscalations: (departmentId?: string) => EscalationItem[];
  getDepartments: () => MockDepartment[];
  getRoles: () => MockRole[];
  getCardDefinitions: () => DashboardCardDefinition[];

  // Write operations
  updateCardVisibility: (config: SaveCardConfigRequest) => void;
  createCardDefinition: (req: CreateCardDefinitionRequest) => string;
  deleteCardDefinition: (cardDefinitionId: string) => void;
  reorderCards: (
    departmentId: string,
    updates: { cardDefinitionId: string; orderIndex: number }[]
  ) => void;

  // Escalation management
  markEscalationResolved: (escalationId: string) => void;
  updateEscalationStatus: (
    escalationId: string,
    status: 'pending' | 'urgent' | 'critical'
  ) => void;

  // User context
  setCurrentUserRole: (role: string) => void;
  setCurrentUserDepartments: (deptIds: string[]) => void;

  // Admin
  reset: () => void;
}

const initialState = {
  cardDefinitions: MOCK_CARD_DEFINITIONS,
  cardConfigurations: MOCK_CARD_CONFIGURATIONS,
  escalations: MOCK_ESCALATIONS,
  departments: MOCK_DEPARTMENTS,
  roles: MOCK_ROLES,
  currentUserRole: 'role-manager',
  currentUserDepartments: ['dept-fin-uuid'],
  lastUpdated: null,
  isDemoMode: true,
};

export const useMockDashboardStore = create<MockDashboardState>()(
  immer((set, get) => ({
    ...initialState,

    // ========== READ OPERATIONS ==========

    /**
     * Get visible cards for a specific department/role combination
     * Filters by visibility rules and populates with live data
     */
    getVisibleCards: (departmentId: string, roleId?: string) => {
      const state = get();

      // Find all visible configurations for this dept/role
      const configs = state.cardConfigurations.filter((cfg) => {
        const deptMatch = cfg.departmentId === departmentId;
        const roleMatch =
          !roleId || !cfg.roleId || cfg.roleId === roleId;
        const visible = cfg.visible === true;

        return deptMatch && roleMatch && visible;
      });

      // Build cards from configurations
      const cards = configs
        .map((cfg) => {
          const def = state.cardDefinitions.find(
            (d) => d.id === cfg.cardDefinitionId
          );
          if (!def) return null;

          // Populate live data based on card type
          let data: unknown = {};

          if (def.card_type === 'escalations') {
            // Filter escalations by department
            data = state.escalations.filter(
              (e) => e.department_id === departmentId
            );
          } else if (def.card_type === 'metric') {
            // Generate appropriate metric data based on card
            if (def.card_id.includes('spend')) {
              data = {
                value: 42500,
                target: 50000,
                currency: 'USD',
                percentage: 85,
                trend: '+5%',
                trendDirection: 'up',
              };
            } else if (def.card_id.includes('headcount')) {
              data = {
                value: 23,
                target: 25,
                percentage: 92,
                trend: '+2',
                trendDirection: 'up',
              };
            } else {
              data = { value: 0, target: 0 };
            }
          } else if (def.card_type === 'chart') {
            // Return chart data based on card type
            if (def.card_id.includes('revenue')) {
              data = MOCK_CHART_REVENUE_DATA;
            } else if (def.card_id.includes('hiring')) {
              data = MOCK_CHART_HIRING_DATA;
            } else {
              data = [];
            }
          } else if (def.card_type === 'table') {
            // Return table data based on card type
            if (def.card_id.includes('tasks')) {
              data = MOCK_TASKS_TABLE_DATA;
            } else if (def.card_id.includes('compliance')) {
              data = MOCK_COMPLIANCE_TABLE_DATA;
            } else {
              data = [];
            }
          }

          return {
            card_id: def.card_id,
            title: def.title,
            card_type: def.card_type,
            layout_zone: def.layout_zone,
            order_index: cfg.orderIndex,
            data,
            config: def.config,
          } as DashboardCard;
        })
        .filter((card): card is DashboardCard => card !== null)
        .sort((a, b) => a.order_index - b.order_index);

      return cards;
    },

    /**
     * Get cards grouped by layout zone
     */
    getCardsGroupedByZone: (departmentId: string, roleId?: string) => {
      const cards = get().getVisibleCards(departmentId, roleId);

      return {
        top: cards.filter((c) => c.layout_zone === 'top'),
        side: cards.filter((c) => c.layout_zone === 'side'),
        middle: cards.filter((c) => c.layout_zone === 'middle'),
      } as DashboardCardsGroupedByZone;
    },

    /**
     * Get all card configurations for a department (optionally filtered by role)
     */
    getCardConfigurationsForDept: (deptId: string, roleId?: string) => {
      return get().cardConfigurations.filter((cfg) => {
        const deptMatch = cfg.departmentId === deptId;
        const roleMatch = !roleId || !cfg.roleId || cfg.roleId === roleId;
        return deptMatch && roleMatch;
      });
    },

    /**
     * Get escalations, optionally filtered by department
     */
    getEscalations: (departmentId?: string) => {
      const escalations = get().escalations;
      if (!departmentId) return escalations;
      return escalations.filter((e) => e.department_id === departmentId);
    },

    /**
     * Get all departments
     */
    getDepartments: () => get().departments,

    /**
     * Get all roles
     */
    getRoles: () => get().roles,

    /**
     * Get all card definitions
     */
    getCardDefinitions: () => get().cardDefinitions,

    // ========== WRITE OPERATIONS ==========

    /**
     * Update card visibility for a department/role combination
     * Creates new config entry if it doesn't exist
     */
    updateCardVisibility: (config: SaveCardConfigRequest) => {
      set((state) => {
        // Find definition by either id or card_id
        const cardDef = state.cardDefinitions.find(
          (d) => d.id === config.card_id || d.card_id === config.card_id
        );
        
        if (!cardDef) {
          console.warn(`Card definition not found for ID: ${config.card_id}`);
          return;
        }

        // Find existing configuration for this specific dept/role/definition
        const existingIndex = state.cardConfigurations.findIndex((c) =>
          c.cardDefinitionId === cardDef.id &&
          c.departmentId === config.department_id &&
          (config.role_id ? c.roleId === config.role_id : !c.roleId)
        );

        if (existingIndex >= 0) {
          // Update existing
          state.cardConfigurations[existingIndex].visible = config.visible;
          state.cardConfigurations[existingIndex].orderIndex =
            config.order_index;
          if (config.permission_required !== undefined) {
            state.cardConfigurations[existingIndex].permissionRequired =
              config.permission_required;
          }
        } else {
          // Create new configuration
          state.cardConfigurations.push({
            cardDefinitionId: cardDef.id,
            cardId: cardDef.card_id,
            title: cardDef.title,
            departmentId: config.department_id,
            roleId: config.role_id || null,
            visible: config.visible,
            orderIndex: config.order_index,
            permissionRequired: config.permission_required,
          });
        }

        state.lastUpdated = new Date();
      });
    },

    /**
     * Create a new card definition
     * Returns the generated ID
     */
    createCardDefinition: (req: CreateCardDefinitionRequest): string => {
      let newId = '';

      set((state) => {
        newId = `def-${Date.now()}`;
        state.cardDefinitions.push({
          id: newId,
          card_id: `card-${Date.now()}`,
          title: req.title,
          description: req.description || '',
          card_type: req.card_type as any,
          layout_zone: req.layout_zone,
          order_index: req.order_index,
          config: req.config || {},
        });
        state.lastUpdated = new Date();
      });

      return newId;
    },

    /**
     * Delete a card definition and all its configurations
     */
    deleteCardDefinition: (cardDefinitionId: string) => {
      set((state) => {
        state.cardDefinitions = state.cardDefinitions.filter(
          (d) => d.id !== cardDefinitionId
        );
        state.cardConfigurations = state.cardConfigurations.filter(
          (c) => c.cardDefinitionId !== cardDefinitionId
        );
        state.lastUpdated = new Date();
      });
    },

    /**
     * Reorder cards in a specific zone/department
     */
    reorderCards: (
      departmentId: string,
      updates: { cardDefinitionId: string; orderIndex: number }[]
    ) => {
      set((state) => {
        updates.forEach((update) => {
          const config = state.cardConfigurations.find(
            (c) =>
              c.cardDefinitionId === update.cardDefinitionId &&
              c.departmentId === departmentId
          );
          if (config) {
            config.orderIndex = update.orderIndex;
          }
        });
        state.lastUpdated = new Date();
      });
    },

    /**
     * Mark an escalation as resolved (removes it)
     */
    markEscalationResolved: (escalationId: string) => {
      set((state) => {
        state.escalations = state.escalations.filter(
          (e) => e.document_id !== escalationId
        );
        state.lastUpdated = new Date();
      });
    },

    /**
     * Update escalation status
     */
    updateEscalationStatus: (
      escalationId: string,
      status: 'pending' | 'urgent' | 'critical'
    ) => {
      set((state) => {
        const escalation = state.escalations.find(
          (e) => e.document_id === escalationId
        );
        if (escalation) {
          escalation.status = status;
          state.lastUpdated = new Date();
        }
      });
    },

    // ========== USER CONTEXT ==========

    /**
     * Set the current user's role for demo purposes
     */
    setCurrentUserRole: (role: string) => {
      set({ currentUserRole: role });
    },

    /**
     * Set the current user's departments for demo purposes
     */
    setCurrentUserDepartments: (deptIds: string[]) => {
      set({ currentUserDepartments: deptIds });
    },

    // ========== ADMIN ==========

    /**
     * Reset all mock data to initial state
     */
    reset: () => {
      set(initialState);
    },
  }))
);

/**
 * Hook wrapper for use in React components
 */
export function useMockDashboard() {
  return useMockDashboardStore();
}
