import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CustomerUser, AuthProvider } from '../types';
import { storeService } from '../services/storeService';
import { authService, AuthConfig } from '../services/authService';

export interface CustomerAuthResult {
  success: boolean;
  user?: CustomerUser;
  error?: string;
  requiresSetup?: boolean;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
  loginRedirectNotice: string | null;
  authConfig: AuthConfig;
  refreshAuthConfig: () => Promise<AuthConfig>;
  updateAuthConfig: (config: { googleClientId?: string; facebookAppId?: string }) => Promise<AuthConfig>;
  openLoginModal: (notice?: string) => void;
  closeLoginModal: () => void;
  loginWithGoogle: () => Promise<CustomerAuthResult>;
  loginWithFacebook: () => Promise<CustomerAuthResult>;
  loginWithCustom: (data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    provider: AuthProvider;
  }) => Promise<CustomerUser>;
  updateProfile: (updates: Partial<CustomerUser>) => void;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const CURRENT_CUSTOMER_KEY = 'trb_current_customer_v1';

// Known dummy identifiers to purge immediately if cached from older previews
const DUMMY_IDENTIFIERS = new Set([
  'mahmudul.hasan@gmail.com',
  'nafis.fcommerce@facebook.com',
  'tanvir.ahmed@apexholdings.bd',
  'farhan.c@chittagongshipping.com',
  'z.rahman@venturepartners.bd',
  'cust_google_tanvir',
  'cust_fb_farhan',
  'cust_google_zubair',
]);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_CUSTOMER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          (DUMMY_IDENTIFIERS.has(parsed.email?.toLowerCase()) ||
            DUMMY_IDENTIFIERS.has(parsed.id) ||
            parsed.name === 'Mahmudul Hasan' ||
            parsed.name === 'Nafis Chowdhury')
        ) {
          localStorage.removeItem(CURRENT_CUSTOMER_KEY);
          return null;
        }
        return parsed;
      }
      return null;
    } catch (e) {
      console.error('Failed to parse current customer from storage:', e);
      return null;
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginRedirectNotice, setLoginRedirectNotice] = useState<string | null>(null);
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
    googleClientId: '',
    facebookAppId: '',
    hasGoogleConfigured: false,
    hasFacebookConfigured: false,
  });

  const refreshAuthConfig = useCallback(async () => {
    const conf = await authService.getAuthConfig();
    setAuthConfig(conf);
    return conf;
  }, []);

  useEffect(() => {
    refreshAuthConfig();
  }, [refreshAuthConfig]);

  useEffect(() => {
    if (customer) {
      localStorage.setItem(CURRENT_CUSTOMER_KEY, JSON.stringify(customer));
    } else {
      localStorage.removeItem(CURRENT_CUSTOMER_KEY);
    }
  }, [customer]);

  const updateAuthConfig = async (config: { googleClientId?: string; facebookAppId?: string }) => {
    const updated = await authService.saveAuthConfig(config);
    setAuthConfig(updated);
    return updated;
  };

  const openLoginModal = (notice?: string) => {
    setLoginRedirectNotice(notice || null);
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setLoginRedirectNotice(null);
  };

  // REAL GOOGLE AUTH (No dummy fallbacks)
  const loginWithGoogle = async (): Promise<CustomerAuthResult> => {
    const result = await authService.signInWithGoogle();
    if (result.user) {
      const saved = storeService.upsertCustomer(result.user);
      setCustomer(saved);
      closeLoginModal();
      return { success: true, user: saved };
    }
    return {
      success: false,
      error: result.error,
      requiresSetup: result.requiresSetup,
    };
  };

  // REAL FACEBOOK AUTH (No dummy fallbacks)
  const loginWithFacebook = async (): Promise<CustomerAuthResult> => {
    const result = await authService.signInWithFacebook();
    if (result.user) {
      const saved = storeService.upsertCustomer(result.user);
      setCustomer(saved);
      closeLoginModal();
      return { success: true, user: saved };
    }
    return {
      success: false,
      error: result.error,
      requiresSetup: result.requiresSetup,
    };
  };

  // REAL CUSTOMER PROFILE WITH USER'S ACTUAL DETAILS
  const loginWithCustom = async (data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    provider: AuthProvider;
  }): Promise<CustomerUser> => {
    const customProfile: CustomerUser = {
      id: `${data.provider}_${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || '',
      address: data.address?.trim() || '',
      district: 'Dhaka',
      deliveryZone: 'inside-dhaka',
      provider: data.provider,
      avatar:
        data.provider === 'facebook'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      joinedAt: new Date().toISOString(),
    };

    const saved = storeService.upsertCustomer(customProfile);
    setCustomer(saved);
    closeLoginModal();
    return saved;
  };

  const updateProfile = (updates: Partial<CustomerUser>) => {
    if (!customer) return;
    const updated: CustomerUser = {
      ...customer,
      ...updates,
    };
    setCustomer(updated);
    storeService.upsertCustomer(updated);
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem(CURRENT_CUSTOMER_KEY);
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isAuthenticated: !!customer,
        isLoginModalOpen,
        loginRedirectNotice,
        authConfig,
        refreshAuthConfig,
        updateAuthConfig,
        openLoginModal,
        closeLoginModal,
        loginWithGoogle,
        loginWithFacebook,
        loginWithCustom,
        updateProfile,
        logout,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
