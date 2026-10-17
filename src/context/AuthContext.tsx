// ==============================================================================
// DineFlow Authentication & Role Context
// ==============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Hotel, HotelMembership, HotelRole } from '../types';

export type UserPersona = 'super_admin' | 'hotel_owner' | 'hotel_manager' | 'guest';

export interface AuthContextType {
  user: UserProfile | null;
  activePersona: UserPersona;
  currentHotel: Hotel | null;
  hotelMemberships: HotelMembership[];
  isSuperAdmin: boolean;
  hasPermission: (permissionId: string) => boolean;
  switchPersona: (persona: UserPersona, targetHotelSlug?: string) => void;
  setCurrentHotel: (hotel: Hotel | null) => void;
  loading: boolean;
}

const DEMO_USERS: Record<UserPersona, UserProfile> = {
  super_admin: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@dineflow.com',
    full_name: 'Platform Super Admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    created_at: new Date().toISOString(),
  },
  hotel_owner: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'marco@gustobistro.com',
    full_name: 'Marco Bellini (Owner)',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    created_at: new Date().toISOString(),
  },
  hotel_manager: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'priya@malabarcoastal.com',
    full_name: 'Priya Nair (Manager)',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    created_at: new Date().toISOString(),
  },
  guest: {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'guest@visitor.com',
    full_name: 'Guest Diner',
    avatar_url: null,
    created_at: new Date().toISOString(),
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePersona, setActivePersona] = useState<UserPersona>(() => {
    return (localStorage.getItem('dineflow_persona') as UserPersona) || 'super_admin';
  });
  const [user, setUser] = useState<UserProfile | null>(DEMO_USERS[activePersona]);
  const [currentHotel, setCurrentHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(DEMO_USERS[activePersona]);
    localStorage.setItem('dineflow_persona', activePersona);
  }, [activePersona]);

  const isSuperAdmin = activePersona === 'super_admin';

  const hasPermission = (permissionId: string): boolean => {
    if (isSuperAdmin) return true;
    if (activePersona === 'hotel_owner') return true; // Owner has all permissions for their hotel
    if (activePersona === 'hotel_manager') {
      const allowed = [
        'menu.view',
        'menu.manage',
        'categories.manage',
        'analytics.view',
        'accounting.view',
        'accounting.transactions.create',
      ];
      return allowed.includes(permissionId);
    }
    return false;
  };

  const switchPersona = (persona: UserPersona) => {
    setActivePersona(persona);
    setUser(DEMO_USERS[persona]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activePersona,
        currentHotel,
        hotelMemberships: [],
        isSuperAdmin,
        hasPermission,
        switchPersona,
        setCurrentHotel,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
