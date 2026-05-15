import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { UserAccount } from '../types';
import { userAccounts as defaultAccounts } from '../data/mockData';

interface AuthContextType {
  currentUser: UserAccount | null;
  allAccounts: UserAccount[];
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifie la session au lancement de l'application
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user);
      else setLoading(false);
    });

    // Écoute les connexions/déconnexions en temps réel
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchProfile(session.user);
      else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = (user: any) => {
    // On croise l'email Supabase avec mockData pour récupérer le rôle (temporaire)
    const mockProfile = defaultAccounts.find(
      u => u.email.toLowerCase() === user.email?.toLowerCase()
    );

    if (mockProfile) {
      setCurrentUser({ ...mockProfile, id: user.id });
    } else {
      // Rôle par défaut si inconnu
      setCurrentUser({ id: user.id, email: user.email, password: '', role: 'parent', displayName: user.email.split('@')[0], studentIds: [] });
    }
    setLoading(false);
  };

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: "Email ou mot de passe incorrect." };
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, allAccounts: defaultAccounts, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
