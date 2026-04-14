import { useTenantStore } from '@/lib/store/tenantStore';

/** Thrown when a response contains data belonging to a different tenant. */
export class ResponseValidationError extends Error {
  constructor(
    message: string,
    public readonly securityIssue: boolean = true,
  ) {
    super(message);
    this.name = 'ResponseValidationError';
  }
}

/**
 * Validates that the response data belongs to the current tenant.
 * Handles both single objects and arrays.
 *
 * - Skips validation when no tenant is in the store (e.g. public endpoints).
 * - Skips items that don't have a `tenant_id` field (not all models are tenant-scoped).
 */
export function validateResponseTenant(data: unknown): void {
  const expectedTenant = useTenantStore.getState().currentTenantId;

  // Nothing to validate against — public endpoint or pre-auth
  if (!expectedTenant || !data || typeof data !== 'object') return;

  // Single object
  if (!Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    if (record.tenant_id && record.tenant_id !== expectedTenant) {
      const msg = `[Security] Cross-tenant data detected: expected "${expectedTenant}", got "${record.tenant_id}"`;
      console.error(msg);
      throw new ResponseValidationError(msg);
    }
    return;
  }

  // Array — check all elements
  for (const item of data as Record<string, unknown>[]) {
    if (item && typeof item === 'object' && item.tenant_id && item.tenant_id !== expectedTenant) {
      const msg = `[Security] Cross-tenant item detected: expected "${expectedTenant}", got "${item.tenant_id}"`;
      console.error(msg);
      throw new ResponseValidationError(msg);
    }
  }
}
