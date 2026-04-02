import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, authService, AppUser } from '../lib/supabase';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface AuthContextType {
  user: {
    id: string | null;
    name: string | null;
    role: 'hr' | 'applicant' | 'super_admin' | null;
    roleTitle?: string | null;
    email: string | null;
    isAuthenticated: boolean;
  };
  /** Supabase sign-up + auto-signs the user in */
  register: (params: {
    email: string;
    password: string;
    name: string;
    role: 'hr' | 'applicant';
    roleTitle?: string;
  }) => Promise<AppUser>;
  /** Supabase sign-in */
  login: (email: string, password: string) => Promise<AppUser>;
  /** Supabase sign-out */
  logout: () => Promise<void>;
  /** Still loading the initial session */
  loading: boolean;
}

const defaultUser = {
  id: 'preview-user-id',
  name: 'Preview Master',
  role: 'hr' as 'hr' | 'applicant' | 'super_admin' | null,
  roleTitle: 'Hiring Manager',
  email: 'preview@smartcruiter.app',
  isAuthenticated: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────
// Helpers to keep localStorage in sync (for legacy historyLogger)
// ─────────────────────────────────────────────────────────
function syncLocalStorage(profile: AppUser) {
  localStorage.setItem('user', JSON.stringify({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    isAuthenticated: true,
  }));
}
function clearLocalStorage() {
  localStorage.removeItem('user');
  localStorage.removeItem('lastSessionId');
}

// ─────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(defaultUser);
  const [loading, setLoading] = useState(false); // No loading for preview mode

  // Session restoration disabled for preview
  useEffect(() => {
    // No-op for preview mode
  }, []);

  // ── Register — signs up AND populates the user state immediately ──
  const register = async ({
    email,
    password,
    name,
    role,
    roleTitle,
  }: {
    email: string;
    password: string;
    name: string;
    role: 'hr' | 'applicant' | 'super_admin';
    roleTitle?: string;
  }): Promise<AppUser> => {
    // 1. Perform Supabase Sign Up
    const data = await authService.signUp(email, password, {
      name,
      role,
      roleTitle
    });

    if (!data.user) throw new Error('Signup failed — no user returned.');

    // Build the profile from signup metadata
    const profile: AppUser = {
      id: data.user.id,
      email: data.user.email!,
      name,
      role,
      roleTitle,
      companyId: undefined,
    };

    setUser({
      id: profile.id,
      name: profile.name,
      role: profile.role,
      roleTitle: profile.roleTitle ?? null,
      email: profile.email,
      isAuthenticated: true,
    });
    syncLocalStorage(profile);
    return profile;
  };

  // ── Login ─────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<AppUser> => {
    // ── Demo Admin Bypass ──
    if (email === 'admin@platform.com' && password === 'Admin@123') {
      const demoProfile: AppUser = {
        id: 'demo-admin-id',
        email: 'admin@platform.com',
        name: 'Platform Admin',
        role: 'super_admin',
        roleTitle: 'Super Administrator',
        companyId: undefined,
      };
      setUser({
        id: demoProfile.id,
        name: demoProfile.name,
        role: demoProfile.role,
        roleTitle: demoProfile.roleTitle ?? null,
        email: demoProfile.email,
        isAuthenticated: true,
      });
      syncLocalStorage(demoProfile);
      return demoProfile;
    }

    const data = await authService.signIn(email, password);
    if (!data.user) throw new Error('Login failed — no user returned');

    const profile = await authService.getProfile(data.user.id);
    if (!profile) throw new Error('Profile not found. Please contact support.');

    setUser({
      id: profile.id,
      name: profile.name,
      role: profile.role,
      roleTitle: profile.roleTitle ?? null,
      email: profile.email,
      isAuthenticated: true,
    });

    syncLocalStorage(profile);
    return profile;
  };

  // ── Logout ────────────────────────────────────────────
  const logout = async () => {
    const sessionId = localStorage.getItem('lastSessionId');
    if (sessionId) {
      const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
      const idx = history.findIndex((h: any) => h.id === sessionId);
      if (idx !== -1) {
        history[idx].logoutTime = new Date().toISOString();
        localStorage.setItem('loginHistory', JSON.stringify(history));
      }
    }
    await authService.signOut().catch(() => {});
    setUser(defaultUser);
    clearLocalStorage();
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
