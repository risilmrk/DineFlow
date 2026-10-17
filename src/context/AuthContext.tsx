// ==============================================================================
// DineFlow Authentication & Role Context
// ==============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Hotel, HotelMembership, HotelRole, supabase } from '@dineflow/database';

export type UserPersona = 'super_admin' | 'hotel_owner' | 'hotel_manager' | 'guest';

export interface AuthContextType {
  user: UserProfile | null;
  activePersona: UserPersona;
  currentHotel: Hotel | null;
  userHotels: Hotel[];
  hotelMemberships: HotelMembership[];
  isSuperAdmin: boolean;
  hasPermission: (permissionId: string) => boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchPersona: (persona: UserPersona, targetHotelSlug?: string) => void;
  setCurrentHotel: (hotel: Hotel | null) => void;
  refreshUserHotels: () => Promise<void>;
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
    return (localStorage.getItem('dineflow_persona') as UserPersona) || 'hotel_owner';
  });
  const [user, setUser] = useState<UserProfile | null>(DEMO_USERS[activePersona]);
  const [currentHotel, setCurrentHotel] = useState<Hotel | null>(null);
  const [userHotels, setUserHotels] = useState<Hotel[]>([]);
  const [hotelMemberships, setHotelMemberships] = useState<HotelMembership[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user hotels list
  const refreshUserHotels = async () => {
    try {
      const { data } = await supabase.from('hotels').select('*').order('name');
      if (data) setUserHotels(data);
    } catch (err) {
      console.error('Error loading user hotels:', err);
    }
  };

  useEffect(() => {
    refreshUserHotels();
  }, []);

  // Listen to Supabase Auth state (e.g. from Google login)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || 'user@example.com',
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          created_at: session.user.created_at,
        });
        setActivePersona('hotel_owner');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || 'user@example.com',
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          created_at: session.user.created_at,
        });
        setActivePersona('hotel_owner');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActivePersona('guest');
    localStorage.removeItem('dineflow_persona');
  };

  const isSuperAdmin = activePersona === 'super_admin';

  const hasPermission = (permissionId: string): boolean => {
    if (isSuperAdmin) return true;
    if (activePersona === 'hotel_owner') return true;
    if (activePersona === 'hotel_manager') {
      const allowed = [
        'menu:view',
        'menu:manage',
        'accounting:view',
        'accounting:manage',
      ];
      return allowed.includes(permissionId);
    }
    return false;
  };

  const switchPersona = (persona: UserPersona) => {
    setActivePersona(persona);
    setUser(DEMO_USERS[persona]);
    localStorage.setItem('dineflow_persona', persona);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activePersona,
        currentHotel,
        userHotels,
        hotelMemberships,
        isSuperAdmin,
        hasPermission,
        signInWithGoogle,
        signOut,
        switchPersona,
        setCurrentHotel,
        refreshUserHotels,
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
