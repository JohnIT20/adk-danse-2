import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { UserAccount } from '../types';

interface AuthContextType {
  currentUser: UserAccount | null;
  allAccounts: UserAccount[];
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  linkStudentToParent: (studentId: string) => Promise<void>;
  unlinkStudentFromParent: (studentId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (user: any) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Sécurité anti-blocage : on force le rôle admin pour vos adresses
    const isAdminEmail = user.email === 'admin@adkdanse.be' || user.email === 'admin@annedkdanse.be';

    if (profile) {
      if (isAdminEmail && profile.role !== 'admin') {
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
        profile.role = 'admin';
      }
      // Catch-up linking: pull any orphan students whose parentEmail matches
      // this account but that aren't yet listed in studentIds.
      if (profile.role === 'parent') {
        const { data: orphans } = await supabase
          .from('students')
          .select('id')
          .ilike('parentEmail', user.email);
        const currentIds: string[] = profile.studentIds ?? [];
        const missing = (orphans ?? [])
          .map((o: { id: string }) => o.id)
          .filter((id: string) => !currentIds.includes(id));
        if (missing.length > 0) {
          const merged = [...currentIds, ...missing];
          await supabase.from('profiles').update({ studentIds: merged }).eq('id', user.id);
          profile.studentIds = merged;
        }
      }
      setCurrentUser({ ...profile, password: '' } as UserAccount);
    } else {
      const role = isAdminEmail ? 'admin' : 'parent';
      if (isAdminEmail) {
        await supabase.from('profiles').insert({ id: user.id, email: user.email, role: 'admin', displayName: 'Administrateur' });
      }
      setCurrentUser({ id: user.id, email: user.email, password: '', role, displayName: user.email.split('@')[0], studentIds: [] });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Vérifie la session au lancement de l'application
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user);
      else setLoading(false);
    });

    // Écoute les connexions/déconnexions en temps réel
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLoading(true);
        fetchProfile(session.user);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: "Email ou mot de passe incorrect." };
    if (data.user) {
      await fetchProfile(data.user);
    }
    return { ok: true };
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }, []);

  const linkStudentToParent = useCallback(async (studentId: string) => {
    if (!currentUser) return;
    const updatedIds = [...currentUser.studentIds, studentId];
    await supabase.from('profiles').update({ studentIds: updatedIds }).eq('id', currentUser.id);
    setCurrentUser(prev => prev ? { ...prev, studentIds: updatedIds } : prev);
  }, [currentUser]);

  const unlinkStudentFromParent = useCallback(async (studentId: string) => {
    if (!currentUser) return;
    const updatedIds = currentUser.studentIds.filter(id => id !== studentId);
    await supabase.from('profiles').update({ studentIds: updatedIds }).eq('id', currentUser.id);
    setCurrentUser(prev => prev ? { ...prev, studentIds: updatedIds } : prev);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, allAccounts: [], login, logout, linkStudentToParent, unlinkStudentFromParent }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
