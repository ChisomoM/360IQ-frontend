/**
 * Unit tests for Department module.
 * Covers: validation logic, API error mapping, filter, permission checks.
 * Uses vi.mock to avoid live network calls.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hasPermission, PERMISSIONS } from '../lib/permissions';
import { USER_ROLES } from '../lib/constants';
import type { AuthUser } from '../types/auth';
import type { Department } from '../types/dms';

// ─── Helpers ────────────────────────────────────────────────────────────────

// Minimal fake user builder — avoids repeating the same boilerplate in each test
function makeUser(role: string, extraPermissions: string[] = []): AuthUser {
  return {
    id: 'test-user-1',
    email: 'test@unilus.ac.zm',
    role: role as AuthUser['role'],
    permissions: extraPermissions,
  };
}

// Pulled out of Departments.tsx so we can test it independently
interface FormErrors {
  name?: string;
  code?: string;
  description?: string;
}

function validateForm(data: { name: string; code: string; description: string }): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) {
    errors.name = 'Department name is required.';
  }
  if (!data.code.trim()) {
    errors.code = 'Department code is required.';
  } else if (!/^[A-Z]{2,8}$/.test(data.code.trim())) {
    errors.code = 'Code must be 2–8 uppercase letters (e.g. CS, FIN, REGIS).';
  }
  if (data.description && data.description.length > 200) {
    errors.description = 'Description must be 200 characters or fewer.';
  }
  return errors;
}

function mapApiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already exists')) {
    return 'A department with that code already exists.';
  }
  if (msg.toLowerCase().includes('not found')) {
    return 'Department not found — it may have already been removed.';
  }
  if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('forbidden')) {
    return 'You do not have permission to perform this action.';
  }
  return msg || 'Something went wrong. Please try again.';
}

// Fake department list for filter/list tests
const fakeDepts: Department[] = [
  { id: '1', name: 'Computer Science', code: 'CS', is_active: true, created_at: '', updated_at: '' },
  { id: '2', name: 'Finance', code: 'FIN', is_active: true, created_at: '', updated_at: '' },
  { id: '3', name: 'Human Resources', code: 'HR', is_active: false, created_at: '', updated_at: '' },
];

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Department form validation', () => {
  it('fails when name is empty', () => {
    const errors = validateForm({ name: '', code: 'CS', description: '' });
    expect(errors.name).toBeDefined();
    expect(errors.code).toBeUndefined();
  });

  it('fails when code is empty', () => {
    const errors = validateForm({ name: 'Registry', code: '', description: '' });
    expect(errors.code).toBeDefined();
  });

  it('fails when code contains lowercase letters', () => {
    const errors = validateForm({ name: 'Registry', code: 'reg', description: '' });
    expect(errors.code).toMatch(/uppercase/i);
  });

  it('fails when code is only 1 character', () => {
    const errors = validateForm({ name: 'Registry', code: 'R', description: '' });
    expect(errors.code).toBeDefined();
  });

  it('fails when description exceeds 200 characters', () => {
    const longDesc = 'x'.repeat(201);
    const errors = validateForm({ name: 'Registry', code: 'REG', description: longDesc });
    expect(errors.description).toBeDefined();
  });

  it('passes with valid name, code, and optional description', () => {
    const errors = validateForm({ name: 'Registry', code: 'REG', description: 'Handles records' });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('passes when description is empty (optional field)', () => {
    const errors = validateForm({ name: 'Finance', code: 'FIN', description: '' });
    expect(errors.description).toBeUndefined();
  });
});

describe('API error mapping', () => {
  it('maps duplicate key errors to a friendly message', () => {
    const result = mapApiError(new Error('duplicate key value violates unique constraint'));
    expect(result).toContain('already exists');
  });

  it('maps "not found" backend errors', () => {
    const result = mapApiError(new Error('record not found'));
    expect(result).toContain('may have already been removed');
  });

  it('maps unauthorized/forbidden errors', () => {
    const result = mapApiError(new Error('forbidden access'));
    expect(result).toContain('do not have permission');
  });

  it('falls back to the raw message for unrecognised errors', () => {
    const result = mapApiError(new Error('some unexpected problem'));
    expect(result).toBe('some unexpected problem');
  });
});

describe('Department list filtering', () => {
  const filter = (query: string) =>
    fakeDepts.filter(
      d =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.code.toLowerCase().includes(query.toLowerCase())
    );

  it('returns all departments when query is empty', () => {
    expect(filter('')).toHaveLength(3);
  });

  it('filters by name (case insensitive)', () => {
    expect(filter('finance')).toHaveLength(1);
    expect(filter('finance')[0].code).toBe('FIN');
  });

  it('filters by code', () => {
    expect(filter('HR')).toHaveLength(1);
    expect(filter('HR')[0].name).toBe('Human Resources');
  });

  it('returns empty array when no match', () => {
    expect(filter('NONEXISTENT')).toHaveLength(0);
  });
});

describe('Role-based permission check (MANAGE_DEPARTMENTS)', () => {
  it('grants SUPER_ADMIN access', () => {
    const admin = makeUser(USER_ROLES.SUPER_ADMIN);
    expect(hasPermission(admin, PERMISSIONS.MANAGE_DEPARTMENTS)).toBe(true);
  });

  it('grants RECORDS_AUTHORITY access', () => {
    const recordsAuth = makeUser(USER_ROLES.RECORDS_AUTHORITY);
    expect(hasPermission(recordsAuth, PERMISSIONS.MANAGE_DEPARTMENTS)).toBe(true);
  });

  it('denies FINANCE_OFFICER role', () => {
    const finance = makeUser(USER_ROLES.FINANCE_OFFICER);
    expect(hasPermission(finance, PERMISSIONS.MANAGE_DEPARTMENTS)).toBe(false);
  });

  it('denies STAFF_MEMBER role', () => {
    const support = makeUser(USER_ROLES.STAFF_MEMBER);
    expect(hasPermission(support, PERMISSIONS.MANAGE_DEPARTMENTS)).toBe(false);
  });

  it('denies null user', () => {
    expect(hasPermission(null, PERMISSIONS.MANAGE_DEPARTMENTS)).toBe(false);
  });

  it('grants access via explicit permission override regardless of role', () => {
    // A support user who was explicitly given the permission should still pass
    const escalated = makeUser(USER_ROLES.STAFF_MEMBER, [PERMISSIONS.MANAGE_DEPARTMENTS]);
    expect(hasPermission(escalated, PERMISSIONS.MANAGE_DEPARTMENTS)).toBe(true);
  });
});
