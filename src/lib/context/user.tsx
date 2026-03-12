import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Firebase removed — use a lightweight local user type for OAuth helpers
export interface AppUser {
  id: string;
  provider?: string;
  displayName?: string;
  email?: string;
  photo?: string;
}

interface UserContextType {
  user: AppUser | null;
  oAuthLogin: (userData: AppUser) => Promise<void>;
  oAuthRegister: (userData: AppUser) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user] = useState<AppUser | null>(null);

  const oAuthLogin = async (userData: AppUser) => {
    console.log('OAuth login (no-op):', userData);
  };

  const oAuthRegister = async (userData: AppUser) => {
    console.log('OAuth register (no-op):', userData);
  };

  return (
    <UserContext.Provider value={{ user, oAuthLogin, oAuthRegister }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};