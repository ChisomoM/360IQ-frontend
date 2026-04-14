import { fetchData } from './crud';
import type { FetchOptions } from './crud';
import { useMockDashboardStore } from '@/lib/store/mockDashboardStore';

/**
 * Toggle this flag to use mock data instead of backend API
 * Set to false to use real backend endpoints
 */
export const USE_MOCK_DASHBOARD = true;

export interface DashboardCard {
  card_id: string;
  title: string;
  card_type: 'escalations' | 'metric' | 'chart' | 'table';
  layout_zone: 'top' | 'side' | 'middle';
  order_index: number;
  data: unknown;
  config: Record<string, unknown>;
}

export interface EscalationItem {
  document_id: string;
  document_title: string;
  document_type: string;
  department_id: string;
  department_name: string;
  current_stage: string;
  current_approver_id: string;
  approver_name: string;
  days_pending: number;
  status: 'pending' | 'urgent' | 'critical';
  created_at: string;
}

export interface SaveCardConfigRequest {
  card_id: string;
  department_id: string;
  role_id?: string | null;
  visible: boolean;
  order_index: number;
  permission_required?: string;
}

export interface DashboardCardDefinition {
  id: string;
  card_id: string;
  title: string;
  description: string;
  card_type: string;
  layout_zone: 'top' | 'side' | 'middle';
  order_index: number;
  config: Record<string, unknown>;
}

export interface DashboardCardsGroupedByZone {
  top: DashboardCard[];
  side: DashboardCard[];
  middle: DashboardCard[];
}

export interface CreateCardDefinitionRequest {
  title: string;
  description?: string;
  card_type: 'metric' | 'chart' | 'table' | 'escalations';
  layout_zone: 'top' | 'side' | 'middle';
  order_index: number;
  config?: Record<string, unknown>;
}

/**
 * Get dashboard cards visible to the logged-in user
 */
export const getDashboardCards = async (fetchOpts?: FetchOptions): Promise<DashboardCard[]> => {
  if (USE_MOCK_DASHBOARD) {
    const store = useMockDashboardStore.getState();
    return store.getVisibleCards(store.currentUserDepartments[0] || 'dept-fin-uuid');
  }

  return fetchData(
    'DASHBOARD_CARDS',
    'GET',
    {},
    null,
    {},
    {},
    fetchOpts
  );
};

/**
 * Get escalations data for the user's department
 * @param thresholdDays - Number of days to consider as escalation threshold (default: 7)
 */
export const getDashboardEscalations = async (
  thresholdDays?: number,
  fetchOpts?: FetchOptions
): Promise<EscalationItem[]> => {
  if (USE_MOCK_DASHBOARD) {
    const store = useMockDashboardStore.getState();
    return store.getEscalations(store.currentUserDepartments[0]);
  }

  const query: Record<string, string> = {};
  if (thresholdDays !== undefined) {
    query.threshold_days = String(thresholdDays);
  }

  return fetchData(
    'DASHBOARD_ESCALATIONS',
    'GET',
    {},
    null,
    query,
    {},
    fetchOpts
  );
};

/**
 * Get card configuration for a specific department and role
 */
export const getDashboardCardConfiguration = async (
  departmentId: string,
  roleId?: string,
  fetchOpts?: FetchOptions
): Promise<unknown> => {
  if (USE_MOCK_DASHBOARD) {
    const store = useMockDashboardStore.getState();
    return {
      configurations: store.getCardConfigurationsForDept(departmentId, roleId),
      departments: store.getDepartments(),
      roles: store.getRoles(),
      cardDefinitions: store.getCardDefinitions(),
    };
  }

  const query: Record<string, string> = {
    department_id: departmentId,
  };
  if (roleId) {
    query.role_id = roleId;
  }

  return fetchData(
    'DASHBOARD_CARD_CONFIG',
    'GET',
    {},
    null,
    query,
    {},
    fetchOpts
  );
};

/**
 * Update card configuration (admin only)
 */
export const updateDashboardCardConfiguration = async (
  config: SaveCardConfigRequest,
  fetchOpts?: FetchOptions
): Promise<void> => {
  if (USE_MOCK_DASHBOARD) {
    const store = useMockDashboardStore.getState();
    store.updateCardVisibility(config);
    return;
  }

  return fetchData(
    'DASHBOARD_UPDATE_CONFIG',
    'PATCH',
    {},
    config,
    {},
    {},
    fetchOpts
  );
};

/**
 * Get all card definitions (admin only)
 */
export const getDashboardCardDefinitions = async (
  fetchOpts?: FetchOptions
): Promise<DashboardCardDefinition[]> => {
  if (USE_MOCK_DASHBOARD) {
    const store = useMockDashboardStore.getState();
    return store.getCardDefinitions();
  }

  return fetchData(
    'DASHBOARD_CARD_DEFINITIONS',
    'GET',
    {},
    null,
    {},
    {},
    fetchOpts
  );
};

/**
 * Get dashboard cards grouped by layout zone (frontend convenience endpoint)
 */
export const getDashboardCardsGrouped = async (
  fetchOpts?: FetchOptions
): Promise<DashboardCardsGroupedByZone> => {
  if (USE_MOCK_DASHBOARD) {
    const store = useMockDashboardStore.getState();
    return store.getCardsGroupedByZone(store.currentUserDepartments[0] || 'dept-fin-uuid');
  }

  return fetchData(
    'DASHBOARD_CARDS_GROUPED',
    'GET',
    {},
    null,
    {},
    {},
    fetchOpts
  );
};

/**
 * Create a new card definition (admin only)
 */
export const createCardDefinition = async (
  request: CreateCardDefinitionRequest,
  fetchOpts?: FetchOptions
): Promise<DashboardCardDefinition> => {
  if (USE_MOCK_DASHBOARD) {
    const store = useMockDashboardStore.getState();
    const newId = store.createCardDefinition(request);
    const def = store.getCardDefinitions().find((d) => d.id === newId);
    return def || request as any;
  }

  return fetchData(
    'DASHBOARD_CREATE_CARD',
    'POST',
    {},
    request,
    {},
    {},
    fetchOpts
  );
};
