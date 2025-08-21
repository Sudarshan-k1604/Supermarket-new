// ================================
// src/contexts/AuthContext.tsx
// ================================
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// 1. Add is_staff to the Profile interface
interface Profile {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
  role?: string;
  is_staff?: boolean; // <-- MODIFIED: Add new property
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean; // <-- ADDED: Expose isStaff status
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; address?: string }) => Promise<{ error: any }>;
  requestPasswordReset: (email: string) => Promise<{ error: any }>;
  updateUserPassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Establish initial session and subscribe to auth changes
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load profile when user changes
  useEffect(() => {
    let active = true;
    const run = async () => {
      if (user) {
        setLoading(true);
        // The select('*') will automatically fetch the new is_staff column
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!active) return;
        if (error) {
          console.error('Error fetching profile:', error.message);
          setProfile(null);
        } else {
          setProfile(data as Profile);
        }
        setLoading(false);
      } else {
        setProfile(null);
        setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [user]);

  // 2. Calculate isAdmin and isStaff statuses
  const isAdmin = useMemo(() => profile?.role === 'admin', [profile]);
  
  // <-- ADDED: Calculate isStaff status
  const isStaff = useMemo(() => {
    // A user is considered 'staff' only if their role is 'admin' AND is_staff is true.
    return profile?.role === 'admin' && profile?.is_staff === true;
  }, [profile]);


  const signIn = async (email: string, password: string) => ({
    error: (await supabase.auth.signInWithPassword({ email, password })).error,
  });

  const signUp = async (email: string, password: string) => ({
    error: (await supabase.auth.signUp({ email, password })).error,
  });

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    return { error };
  };

  const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const updateProfile = async (data: { name?: string; phone?: string; address?: string }) => {
    if (!user) throw new Error('No user is logged in.');
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)
      .select()
      .single();

    if (!error) {
      const { data: updatedProfileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(updatedProfileData as Profile);
    }
    return { error };
  };

  // 3. Provide isStaff in the context value
  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAdmin,
    isStaff, // <-- MODIFIED: Add isStaff to the context value
    signIn,
    signUp,
    signOut,
    updateProfile,
    requestPasswordReset,
    updateUserPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};