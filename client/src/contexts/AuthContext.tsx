import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, authService, AppUser } from '../lib/supabase';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface AuthContextType {
  user: {
    id: string | null;
    name: string | null;
    role: 'hr' | 'applicant' | null;
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
  id: null,
  name: null,
  role: null as 'hr' | 'applicant' | null,
  roleTitle: null,
  email: null,
  isAuthenticated: false,
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
  const [loading, setLoading] = useState(true);

  // On mount: restore session from Supabase (persists across refreshes)
  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        const session = await authService.getSession();
        if (session?.user && mounted) {
          const profile = await authService.getProfile(session.user.id);
          if (profile && mounted) {
            setUser({
              id: profile.id,
              name: profile.name,
              role: profile.role,
              roleTitle: profile.roleTitle ?? null,
              email: profile.email,
              isAuthenticated: true,
            });
            syncLocalStorage(profile);
          }
        }
      } catch (err) {
        console.warn('Session restore failed:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    restoreSession();

    // Listen for auth state changes (token refresh, sign-out, etc.)
    // Skip SIGNED_IN if we're already authenticated — register() and login() handle that themselves
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(defaultUser);
        clearLocalStorage();
        if (mounted) setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Only refresh on token rotation — don't race with register/login
        const profile = await authService.getProfile(session.user.id);
        if (profile && mounted) {
          setUser({
            id: profile.id,
            name: profile.name,
            role: profile.role,
            roleTitle: profile.roleTitle ?? null,
            email: profile.email,
            isAuthenticated: true,
          });
          syncLocalStorage(profile);
        }
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
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
    role: 'hr' | 'applicant';
    roleTitle?: string;
  }): Promise<AppUser> => {
    const data = await authService.signUp(email, password, { name, role, roleTitle });

    // signUp with email-confirm disabled returns a live session immediately
    if (!data.user) throw new Error('Signup failed — no user returned.');

    // Build the profile from signup metadata we ALREADY KNOW — no extra DB call needed.
    // Calling getProfile() here races with onAuthStateChange (SIGNED_IN), causing an
    // IndexedDB lock conflict. The DB trigger creates the profile record automatically.
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
    await authService.signOut();
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
