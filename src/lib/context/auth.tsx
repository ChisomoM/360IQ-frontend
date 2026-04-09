/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from 'react';
import {
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { jwtDecode } from 'jwt-decode';
import { post, retrieve } from '../api/crud';
import type {
  AuthUser,
  AuthTokens,
  AuthContextValue,
  AccountType,
} from '@/types/auth';
import { STORAGE_KEYS } from '../../types/auth';
import { AuthContext } from './AuthContext';
import { type UserRole, USER_ROLES } from '../constants';
import { useTenantStore } from '@/lib/store/tenantStore';
import type { TenantConfig } from '@/types/tenant';

/** Returns the stored ControlHub token — usable outside React (e.g. in API clients) */
export function getControlHubToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CH_TOKENS);
    if (!raw) return null;
    return JSON.parse(raw)?.token || null;
  } catch {
    return null;
  }
}

/** Decode JWT and extract tenant_id and optional control-hub flag */
function extractTenantFromToken(token: string): { tenantId: string | null; isControlHubAdmin: boolean } {
  try {
    const decoded = jwtDecode<{ tenant_id?: string; is_control_hub_admin?: boolean; user_type?: string }>(token);
    return {
      tenantId: decoded.tenant_id || null,
      // Support both the legacy is_control_hub_admin flag and the new user_type claim
      isControlHubAdmin: !!decoded.is_control_hub_admin || decoded.user_type === 'controlhub_admin',
    };
  } catch (err) {
    console.error('[Auth] Failed to decode JWT for tenant info:', err);
    return { tenantId: null, isControlHubAdmin: false };
  }
}

/** Fetch tenant config from /tenant/config and populate store */
async function fetchTenantConfig(): Promise<void> {
  const tenantId = useTenantStore.getState().currentTenantId;
  if (!tenantId) return;

  useTenantStore.setState({ isLoadingConfig: true, configError: null });
  try {
    const data: any = await retrieve('TENANT_CONFIG');
    // Backend returns { branding: {...}, settings: {...} }
    if (data) {
      useTenantStore.getState().setTenantConfig(data as TenantConfig);
    }
  } catch (err) {
    // Non-fatal: branding simply falls back to defaults
    console.warn('[Auth] Could not fetch tenant config:', err);
    useTenantStore.setState({ configError: err instanceof Error ? err : new Error(String(err)) });
  } finally {
    useTenantStore.setState({ isLoadingConfig: false });
  }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceChangePassword] = useState(false);
  const navigate = useNavigate();

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKENS);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (err) {
      console.error('Failed to clear storage:', err);
    }
  }, []);


  const restoreSessionFromStorage = useCallback(() => {
    try {
      // If we are on a ControlHub path, restore the CH session
      const isCHPath = window.location.pathname.startsWith('/controlhub');

      if (isCHPath) {
        const storedCHTokens = localStorage.getItem(STORAGE_KEYS.CH_TOKENS);
        const storedCHUser = localStorage.getItem(STORAGE_KEYS.CH_USER);
        if (storedCHTokens && storedCHUser) {
          setTokens(JSON.parse(storedCHTokens));
          setUser(JSON.parse(storedCHUser));
        }
        // No CH session — ControlHubLayout will redirect to /controlhub/login
        setIsLoading(false);
        return;
      }

      // Regular tenant user session restore
      const storedTokens = localStorage.getItem(STORAGE_KEYS.TOKENS);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

      if (storedTokens && storedUser) {
        const parsedTokens = JSON.parse(storedTokens);
        const parsedUser = JSON.parse(storedUser);

        setTokens(parsedTokens);
        setUser(parsedUser);

        // Restore tenant store from stored token
        const token = parsedTokens?.token || parsedTokens?.access_token;
        if (token) {
          const { tenantId, isControlHubAdmin } = extractTenantFromToken(token);
          if (tenantId) {
            useTenantStore.getState().setTenantId(tenantId);
            // Fetch branding/config for the restored tenant
            fetchTenantConfig().catch(() => { });
          }
          // Patch user with control-hub flag if decoded from JWT
          if (isControlHubAdmin && parsedUser) {
            parsedUser.isControlHubAdmin = true;
          }
        } else if (parsedUser?.tenantId) {
          // Fallback: tenant ID was persisted on the user object
          useTenantStore.getState().setTenantId(parsedUser.tenantId);
          fetchTenantConfig().catch(() => { });
        }
      }

    } catch (err) {
      console.error('Failed to restore session from storage:', err);
      clearStorage();
    } finally {
      setIsLoading(false);
    }
  }, [clearStorage]);

  /**
   * Persist auth state to localStorage
   */
  const saveToStorage = useCallback(
    (authUser: AuthUser, authTokens: AuthTokens) => {
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authUser));
        localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(authTokens));
      } catch (err) {
        console.error('Failed to save auth state to storage:', err);
        toast.error('Failed to save authentication state');
      }
    },
    []
  );


  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Go Backend Login
        const response: any = await post('LOGIN', { identifier: email, password });

        // Backend returns: { token: string, user: models.User }
        const { token, user: backendUser } = response;

        if (!token || !backendUser) {
          throw new Error('Invalid response from server');
        }

        // Map backend User to AuthUser
        const authUser: AuthUser = {
          id: backendUser.id,
          email: backendUser.email,
          firstName: backendUser.first_name,
          lastName: backendUser.last_name,
          role: backendUser.role?.name as UserRole,
          permissions: backendUser.role?.permissions?.map((p: any) => p.code) || [],
          isActive: backendUser.is_active,
          isVerified: backendUser.is_verified,
          myReferralCode: backendUser.my_referral_code,
          assignedRegions: Array.isArray(backendUser.assigned_regions)
            ? backendUser.assigned_regions
            : typeof backendUser.assigned_regions === 'string'
              ? JSON.parse(backendUser.assigned_regions)
              : [],
          accountType: (backendUser.account_type || 'admin') as AccountType,
          is_superUser: backendUser.role?.name === USER_ROLES.SUPER_ADMIN,

          // Support both snake_case and camelCase for UI components
          first_name: backendUser.first_name,
          last_name: backendUser.last_name,
        };

        // Extract tenant_id and control-hub flag from JWT
        const { tenantId, isControlHubAdmin } = extractTenantFromToken(token);
        if (tenantId) {
          authUser.tenantId = tenantId;
          useTenantStore.getState().setTenantId(tenantId);
        } else {
          // Fallback to env variable if JWT doesn't include tenant_id (dev mode)
          const fallbackTenant = import.meta.env.VITE_TENANT_ID || 'dims';
          authUser.tenantId = fallbackTenant;
          useTenantStore.getState().setTenantId(fallbackTenant);
          console.warn('[Auth] JWT missing tenant_id, falling back to:', fallbackTenant);
        }
        if (isControlHubAdmin) {
          authUser.isControlHubAdmin = true;
        }

        const authTokens: AuthTokens = { token };

        // Save to storage and update context
        saveToStorage(authUser, authTokens);
        setTokens(authTokens);
        setUser(authUser);

        // Background: fetch full tenant config (branding) - non-blocking
        fetchTenantConfig().catch(() => { /* silent - handled inside */ });

        // Show success message
        toast.success(`Welcome back, ${authUser.firstName}!`);
          navigate('/admin/dashboard');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Login failed';
        setError(errorMsg);
        toast.error(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [saveToStorage, navigate]
  );

  /**
    LOGOUT - Clear auth state for the current account type and redirect
   */
  const logout = useCallback(async () => {
    try {
      if (user?.accountType === 'controlhub_admin') {
        localStorage.removeItem(STORAGE_KEYS.CH_TOKENS);
        localStorage.removeItem(STORAGE_KEYS.CH_USER);
        setTokens(null);
        setUser(null);
        setError(null);
        navigate('/controlhub/login');
      } else {
        clearStorage();
        setTokens(null);
        setUser(null);
        setError(null);
        useTenantStore.getState().clear();
        navigate('/login');
        toast.success('Logged out successfully');
      }
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Logout failed');
    }
  }, [user, clearStorage, navigate]);

  const changePassword = useCallback(async (newPassword: string) => {
    // TODO: Implement password change logic
    console.log('Change password not implemented yet', newPassword);
  }, []);

  const controlHubLogin = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // const ROUTING_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8032/api/v1/';
      const ROUTING_URL: string = import.meta.env.VITE_BACKEND_URL || "http://102.211.186.58/api/v1/";
      const res = await fetch(`${ROUTING_URL}controlhub/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Invalid credentials');
      }

      const json = await res.json();
      const payload = json?.data ?? json;
      const { token: newToken, email: userEmail, role } = payload;

      if (!newToken) throw new Error('No token received from server');

      const chUser: AuthUser = { email: userEmail, role, accountType: 'controlhub_admin' };
      const chTokens: AuthTokens = { token: newToken };

      localStorage.setItem(STORAGE_KEYS.CH_TOKENS, JSON.stringify(chTokens));
      localStorage.setItem(STORAGE_KEYS.CH_USER, JSON.stringify(chUser));
      setUser(chUser);
      setTokens(chTokens);

      navigate('/controlhub/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    restoreSessionFromStorage();
  }, [restoreSessionFromStorage]);



  const value: AuthContextValue = {
    // State
    user,
    tokens,
    isLoading,
    isAuthenticated: !!user && !!tokens,
    error,
    forceChangePassword,

    // Methods
    login,
    controlHubLogin,
    logout,
    changePassword,
    setUser,
    setTokens,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
