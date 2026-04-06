import { create } from 'zustand'
import type { TenantConfig } from '@/types/tenant'

interface TenantState {
  // Current tenant ID (from JWT)
  currentTenantId: string | null
  setTenantId: (id: string) => void

  // Tenant config (fetched from /auth/me)
  currentTenantConfig: TenantConfig | null
  setTenantConfig: (config: TenantConfig) => void

  // Status
  isLoadingConfig: boolean
  configError: Error | null

  // Cleanup
  clear: () => void
}

export const useTenantStore = create<TenantState>((set) => ({
  currentTenantId: null,
  setTenantId: (id: string) => set({ currentTenantId: id }),

  currentTenantConfig: null,
  setTenantConfig: (config: TenantConfig) => set({ currentTenantConfig: config }),

  isLoadingConfig: false,
  configError: null,

  clear: () =>
    set({
      currentTenantId: null,
      currentTenantConfig: null,
      isLoadingConfig: false,
      configError: null,
    }),
}))

/**
 * Hook wrapper for use in React components.
 * For non-component code (e.g., API client), use useTenantStore.getState() directly.
 */
export function useTenantContext() {
  return useTenantStore((state) => ({
    currentTenantId: state.currentTenantId,
    currentTenantConfig: state.currentTenantConfig,
    isLoadingConfig: state.isLoadingConfig,
    error: state.configError,
  }))
}
