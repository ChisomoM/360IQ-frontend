import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';
import { list } from '@/lib/api/crud';

export interface Role {
    id: string;
    name: string;
    slug: string;
    description: string;
    permissionCount: number;
    permissions: string[];
}

export interface Permission {
    id: string;
    code: string;
    name: string;
    description: string;
}

interface RbacContextValue {
    roles: Role[];
    permissions: Permission[];
    isLoading: boolean;
    error: Error | null;
    loadRoles: () => Promise<void>;
    loadPermissions: () => Promise<void>;
    refreshData: () => Promise<void>;
}

const RbacContext = createContext<RbacContextValue | undefined>(undefined);

export function RbacProvider({ children }: { children: ReactNode }) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadRoles = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await list('ADMIN_ROLES');
            setRoles(data ?? []);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load roles'));
        } finally {
            setIsLoading(false);
        }
    };

    const loadPermissions = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await list('ADMIN_PERMISSIONS');
            setPermissions(data ?? []);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load permissions'));
        } finally {
            setIsLoading(false);
        }
    };

    const refreshData = async () => {
        await Promise.all([loadRoles(), loadPermissions()]);
    };

    return (
        <RbacContext.Provider value={{
            roles,
            permissions,
            isLoading,
            error,
            loadRoles,
            loadPermissions,
            refreshData,
        }}>
            {children}
        </RbacContext.Provider>
    );
}

export function useRbac() {
    const context = useContext(RbacContext);
    if (!context) {
        throw new Error('useRbac must be used inside RbacProvider');
    }
    return context;
}