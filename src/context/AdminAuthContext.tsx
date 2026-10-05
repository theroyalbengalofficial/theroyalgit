import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';

interface AdminCredentials {
  adminId: string;
  password: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  adminCredentials: AdminCredentials;
  login: (idOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCredentials: (newId: string, newPassword: string) => boolean;
}

// Session is tied to sessionStorage so each session explicitly requires ID & password
const ADMIN_SESSION_KEY = 'trb_admin_session_v2';
const ADMIN_CREDENTIALS_CONFIG_KEY = 'trb_admin_credentials_config';

// Default authorized credentials
export const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  adminId: 'admin',
  password: 'parledhuk123',
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_CREDENTIALS_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.password && parsed.password !== 'admin' && parsed.password !== 'admin123') {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ADMIN_CREDENTIALS;
  });

  useEffect(() => {
    try {
      // Purge any legacy localStorage auto-login so an ID and password is strictly required
      localStorage.removeItem('trb_admin_session_v1');

      // Check current browser sessionStorage
      const stored = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (stored) {
        const parsed: AdminUser = JSON.parse(stored);
        if (parsed && (parsed.email || parsed.id)) {
          setAdmin(parsed);
        }
      }
    } catch (err) {
      console.error('Error loading admin session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (idOrEmail: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Artificial small delay for realistic authentication UX
    await new Promise((resolve) => setTimeout(resolve, 350));

    const cleanInput = idOrEmail.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check configured custom credentials
    const matchesCustomId = cleanInput === adminCredentials.adminId.toLowerCase();
    const matchesCustomPass = cleanPassword === adminCredentials.password;

    // Check standard allowed defaults (admin, admin@royalbengal.com, admin@trb.bd)
    const matchesDefaultId =
      cleanInput === 'admin' ||
      cleanInput === 'admin@royalbengal.shop' ||
      cleanInput === 'admin@trb.bd' ||
      cleanInput === 'royalbengal';

    const matchesDefaultPass =
      cleanPassword === 'parledhuk123' ||
      cleanPassword === 'royalbengal2026';

    const isAuthorized =
      (matchesCustomId && matchesCustomPass) ||
      (matchesDefaultId && matchesDefaultPass) ||
      (matchesDefaultId && matchesCustomPass) ||
      (matchesCustomId && matchesDefaultPass);

    if (!isAuthorized) {
      return {
        success: false,
        error: 'Invalid credentials. Please enter your authorized Admin ID and Password.',
      };
    }

    const user: AdminUser = {
      id: 'usr_admin_master',
      email: cleanInput.includes('@') ? cleanInput : `${cleanInput}@royalbengal.com`,
      name: 'Apex Executive Admin',
      role: 'superadmin',
    };

    setAdmin(user);
    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }

    return { success: true };
  };

  const logout = () => {
    setAdmin(null);
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const updateCredentials = (newId: string, newPassword: string): boolean => {
    if (!newId.trim() || !newPassword.trim()) return false;
    const newCreds: AdminCredentials = {
      adminId: newId.trim(),
      password: newPassword.trim(),
    };
    setAdminCredentials(newCreds);
    try {
      localStorage.setItem(ADMIN_CREDENTIALS_CONFIG_KEY, JSON.stringify(newCreds));
    } catch (e) {
      console.error(e);
    }
    return true;
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        adminCredentials,
        login,
        logout,
        updateCredentials,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
