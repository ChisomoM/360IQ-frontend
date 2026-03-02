/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from 'react';
import {
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { post } from '../api/crud';
import type {
  AuthUser,
  AuthTokens,
  AuthContextValue,
} from '@/types/auth';
import { STORAGE_KEYS } from '../../types/auth';
import { AuthContext } from './AuthContext';
import { type UserRole, USER_ROLES } from '../constants';


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
      const storedTokens = localStorage.getItem(STORAGE_KEYS.TOKENS);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

      if (storedTokens && storedUser) {
        const parsedTokens = JSON.parse(storedTokens);
        const parsedUser = JSON.parse(storedUser);

        setTokens(parsedTokens);
        setUser(parsedUser);
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

        const authTokens: AuthTokens = { token };

        // Save to storage and update context
        saveToStorage(authUser, authTokens);
        setTokens(authTokens);
        setUser(authUser);

        // Show success message
        toast.success(`Welcome back, ${authUser.firstName}!`);

        // Auto-redirect based on role
        // Auto-redirect based on role and account type
        if (authUser.accountType === 'student') {
          navigate('/student/dashboard');
        } else if (authUser.role === USER_ROLES.TEACHER) {
          navigate('/dashboard');
        } else {
          navigate('/admin/dashboard');
        }

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
    LOGOUT - Clear all auth state and redirect to login
   */
  const logout = useCallback(async () => {
    try {
      // Clear storage and state
      clearStorage();
      setTokens(null);
      setUser(null);
      setError(null);

      // Redirect to login
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Logout failed');
    }
  }, [clearStorage, navigate]);

  const changePassword = useCallback(async (newPassword: string) => {
    // TODO: Implement password change logic
    console.log('Change password not implemented yet', newPassword);
  }, []);

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
