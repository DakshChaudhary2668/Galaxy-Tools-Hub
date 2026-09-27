'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getCustomerMe, getAdminMe, CustomerMeResponse, AdminMeResponse } from '@/services/auth.service';
import { ProfileDto, AdminUserDto } from '@galaxy/types';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileDto | CustomerMeResponse | null;
  adminUser: AdminUserDto | AdminMeResponse | null;
  role: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  signUp: (payload: { email: string; password: string; fullName: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileDto | CustomerMeResponse | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUserDto | AdminMeResponse | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserDetails = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.access_token) {
      setProfile(null);
      setAdminUser(null);
      setRole(null);
      return;
    }

    const token = currentSession.access_token;

    // Try checking if user is an Admin first
    try {
      const adminRes = await getAdminMe(token);
      if (adminRes && 'role' in adminRes) {
        setAdminUser(adminRes as AdminUserDto);
        setRole(adminRes.role.toUpperCase());
        return;
      }
    } catch (err) {
      // Not an admin or request failed, continue to customer check
    }

    // Otherwise, check if user is a Customer
    try {
      const profileRes = await getCustomerMe(token);
      if (profileRes) {
        setProfile(profileRes as ProfileDto);
        setRole('CUSTOMER');
      }
    } catch (err) {
      // Profile fetch failed
      setRole('CUSTOMER');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      if (!isMounted) return;
      setSession(initSession);
      setUser(initSession?.user ?? null);
      if (initSession) {
        fetchUserDetails(initSession).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`[AUTH_TRACE] onAuthStateChange fired! event: ${event}`);
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession) {
        await fetchUserDetails(newSession);
      } else {
        setProfile(null);
        setAdminUser(null);
        setRole(null);
      }
      console.log(`[AUTH_TRACE] onAuthStateChange setting isLoading to false`);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserDetails]);

  const signInWithPassword = async ({ email, password }: { email: string; password: string }) => {
    try {
      console.log(`[AUTH_TRACE] signInWithPassword initiated`);
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.session) {
        console.log(`[AUTH_TRACE] signInWithPassword manual session set`);
        setSession(data.session);
        setUser(data.user);
        console.log(`[AUTH_TRACE] signInWithPassword calling fetchUserDetails manually`);
        await fetchUserDetails(data.session);
      }
      console.log(`[AUTH_TRACE] signInWithPassword returning success`);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign-in';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async ({ email, password, fullName, phone }: { email: string; password: string; fullName: string; phone?: string }) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || ''
          }
        }
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        await fetchUserDetails(data.session);
      }
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during registration';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut().catch(() => {});
    setSession(null);
    setUser(null);
    setProfile(null);
    setAdminUser(null);
    setRole(null);
    setIsLoading(false);
  };

  const refreshSession = async () => {
    const { data: { session: refreshed } } = await supabase.auth.refreshSession();
    setSession(refreshed);
    setUser(refreshed?.user ?? null);
    if (refreshed) {
      await fetchUserDetails(refreshed);
    }
  };

  const isAdmin = Boolean(role && ['OWNER', 'MANAGER', 'STAFF', 'ADMIN'].includes(role.toUpperCase()));

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        adminUser,
        role,
        isAdmin,
        isAuthenticated: Boolean(user),
        isLoading,
        signInWithPassword,
        signUp,
        signOut,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
