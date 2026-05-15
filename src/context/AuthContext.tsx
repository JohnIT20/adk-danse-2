import React, { createContext, useContext, useState, useCallback } from 'react';
import type { UserAccount } from '../types';
import { userAccounts as defaultAccounts } from '../data/mockData';

interface AuthContextType {
  currentUser: UserAccount | null;
  allAccounts: UserAccount[];
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem('adk_current_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function loadAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem('adk_user_accounts');
    return raw ? JSON.parse(raw) : defaultAccounts;
  } catch { return defaultAccounts; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(loadUser);
  const [allAccounts] = useState<UserAccount[]>(loadAccounts);

  const login = useCallback((email: string, password: string) => {
    const found = allAccounts.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );
    if (!found) {
      return { ok: false, error: 'Email ou mot de passe incorrect.' };
    }
    setCurrentUser(found);
    localStorage.setItem('adk_current_user', JSON.stringify(found));
    return { ok: true };
  }, [allAccounts]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('adk_current_user');
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, allAccounts, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
