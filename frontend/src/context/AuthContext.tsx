import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type UserRole = 'ADMIN' | 'USER' | null;

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setRole(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ role, setRole, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
