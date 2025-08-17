// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// This interface matches your `profiles` table.
// Make sure it includes the 'role' field.
interface Profile {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
  role?: string; // Crucial for this logic
}

// Define what our context will provide to the app.
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

  useEffect(() => {
    // Check for an active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Listen for changes in authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // If there's a user, fetch their profile
    if (user) {
      setLoading(true); // Start loading when user changes
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching profile:', error.message);
            setProfile(null); // Ensure profile is null on error
          } else {
            setProfile(data);
          }
          setLoading(false);
        });
    } else {
      // If there's no user, clear the profile and stop loading
      setProfile(null);
      setLoading(false);
    }
  }, [user]); // This effect runs whenever the user object changes

  // **MODIFIED LOGIC HERE**
  // isAdmin is now calculated based on the profile's role.
  // It will re-evaluate whenever the 'profile' state changes.
  const isAdmin = useMemo(() => profile?.role === 'admin', [profile]);

  const signIn = async (email: string, password: string) => ({ error: (await supabase.auth.signInWithPassword({ email, password })).error });
  const signUp = async (email: string, password: string) => ({ error: (await supabase.auth.signUp({ email, password })).error });
  const signOut = async () => await supabase.auth.signOut();

  // Function to update the user's profile
  const updateProfile = async (data: { name?: string; phone?: string; address?: string; }) => {
    if (!user) throw new Error("No user is logged in.");

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)
      .select() // Use .select() to get the updated data back in one go
      .single();

    // If the update is successful, update the local profile state with the returned data
    if (!error) {
       // Re-fetch to be absolutely sure we have the latest data from the DB
      const { data: updatedProfileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(updatedProfileData);
    }
    
    return { error };
  };

  if (loading && !session) { // Show loader only on initial load
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const value = { user, session, profile, loading, isAdmin, signIn, signUp, signOut, updateProfile };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};