// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// Profile interface remains the same
interface Profile {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
  role?: string;
}

// Add the new functions to the context type
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    phone?: string;
    address?: string;
  }) => Promise<{ error: any }>;
  // NEW: Add functions for password management
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

  // ... (useEffect hooks remain the same)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  useEffect(() => {
    if (user) {
      setLoading(true);
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching profile:', error.message);
            setProfile(null);
          } else {
            setProfile(data);
          }
          setLoading(false);
        });
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const isAdmin = useMemo(() => profile?.role === 'admin', [profile]);

  const signIn = async (email: string, password: string) => ({ error: (await supabase.auth.signInWithPassword({ email, password })).error });
  const signUp = async (email: string, password: string) => ({ error: (await supabase.auth.signUp({ email, password })).error });
  const signOut = async () => await supabase.auth.signOut();
  
  // NEW: Function to request a password reset email
  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`, // Redirects to your auth page
    });
    return { error };
  };

  // NEW: Function to update the user's password after they click the link
  const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  // ... (updateProfile function remains the same)
  const updateProfile = async (data: { name?: string; phone?: string; address?: string; }) => {
     if (!user) throw new Error("No user is logged in.");
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
       setProfile(updatedProfileData);
     }
     return { error };
   };


  if (loading && !session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // MODIFIED: Add the new functions to the context value
  const value = { user, session, profile, loading, isAdmin, signIn, signUp, signOut, updateProfile, requestPasswordReset, updateUserPassword };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};