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
  /** Supabase sign-up */
  register: (params: {
    email: string;
    password: string;
    name: string;
    role: 'hr' | 'applicant';
    roleTitle?: string;
  }) => Promise<void>;
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
            // Keep localStorage in sync for historyLogger (legacy support)
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

    // Listen for auth state changes (token refresh, sign-out from another tab, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(defaultUser);
        clearLocalStorage();
      } else if (session?.user) {
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

  // ── Register ──────────────────────────────────────────
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
  }) => {
    await authService.signUp(email, password, { name, role, roleTitle });
    // Don't auto-login — user should verify email (or we can auto-login if email confirm is off)
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
    // Record logout time in loginHistory (legacy historyLogger support)
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

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

// ─────────────────────────────────────────────────────────
// Helpers (keep localStorage in sync for historyLogger)
// ─────────────────────────────────────────────────────────
function syncLocalStorage(profile: AppUser) {
  const timestamp = new Date().toISOString();
  const sessionId = crypto.randomUUID();

  localStorage.setItem('userRole', profile.role);
  localStorage.setItem('userEmail', profile.email);
  localStorage.setItem('userName', profile.name);
  if (profile.roleTitle) localStorage.setItem('userRoleTitle', profile.roleTitle);

  if (profile.role === 'hr') {
    const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
    history.forEach((h: any) => {
      if (h.email === profile.email && h.logoutTime === null) {
        h.logoutTime = timestamp;
      }
    });
    history.push({
      id: sessionId,
      email: profile.email,
      name: profile.name,
      loginTime: timestamp,
      logoutTime: null,
      role: profile.role,
    });
    localStorage.setItem('loginHistory', JSON.stringify(history));
    localStorage.setItem('lastSessionId', sessionId);
    localStorage.setItem('lastLoginTime', timestamp);
  }
}

function clearLocalStorage() {
  localStorage.removeItem('userRole');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userRoleTitle');
  localStorage.removeItem('lastLoginTime');
}
