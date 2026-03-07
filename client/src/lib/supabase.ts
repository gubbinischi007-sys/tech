import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eluarxdyxvxwknylejaj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'hr' | 'applicant';

export interface AppUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    roleTitle?: string;
    companyId?: string;
}

// ==================== AUTH HELPERS ====================

export const authService = {
    /** Sign up a new user and store extra metadata in the `user_profiles` table */
    async signUp(email: string, password: string, meta: { name: string; role: UserRole; roleTitle?: string; companyPin?: string }) {
        // 1. Create auth user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: meta.name,
                    role: meta.role,
                    role_title: meta.roleTitle || '',
                }
            }
        });

        if (error) throw error;

        return data;
    },

    /** Sign in with email + password */
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },

    /** Sign out */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /** Get current session */
    async getSession() {
        const { data } = await supabase.auth.getSession();
        return data.session;
    },

    /** Get current user profile from user_profiles table */
    async getProfile(userId: string): Promise<AppUser | null> {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role as UserRole,
            roleTitle: data.role_title,
            companyId: data.company_id,
        };
    },

    /** Listen to auth state changes */
    onAuthStateChange(callback: (user: AppUser | null) => void) {
        return supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const profile = await authService.getProfile(session.user.id);
                callback(profile);
            } else {
                callback(null);
            }
        });
    }
};
