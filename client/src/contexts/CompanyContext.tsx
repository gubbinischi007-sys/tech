import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { setCompanyId } from '../services/api';

interface Company {
    id: string;
    name: string;
    slug: string;
    invite_code: string;
    logo_url?: string;
    plan: string;
    status: string;
    document_url?: string;
}

interface CompanyContextType {
    company: Company | null;
    loading: boolean;
    /** Create a new company workspace (first-time HR setup) */
    createCompany: (name: string, slug: string, documentUrl?: string) => Promise<Company>;
    /** Join an existing company using invite code */
    joinCompany: (inviteCode: string) => Promise<Company>;
    refetch: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setCompanyId(company?.id || null);
    }, [company?.id]);

    const fetchCompany = async () => {
        if (!user.id || user.role !== 'hr') {
            setLoading(false);
            return;
        }

        try {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('company_id')
                .eq('id', user.id)
                .single();

            if (profile?.company_id) {
                const { data: comp } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', profile.company_id)
                    .single();

                setCompany(comp || null);
            } else {
                setCompany(null);
            }
        } catch (err) {
            console.warn('Could not load company:', err);
            setCompany(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user.isAuthenticated) {
            fetchCompany();
        } else {
            setCompany(null);
            setLoading(false);
        }
    }, [user.id, user.isAuthenticated]);

    const createCompany = async (name: string, slug: string, documentUrl?: string): Promise<Company> => {
        if (!user.id) throw new Error('Not authenticated');
        
        // 1. Insert the company row
        const { data: comp, error: compError } = await supabase
            .from('companies')
            .insert({ 
                name, 
                slug, 
                email: user.email,
                document_url: documentUrl,
                status: 'pending' 
            })
            .select()
            .single();

        if (compError || !comp) throw new Error(compError?.message || 'Failed to create company');

        // 2. Link the user profile to this company
        const { error: profileError } = await supabase
            .from('user_profiles')
            .update({ company_id: comp.id })
            .eq('id', user.id);

        if (profileError) throw new Error(profileError.message);

        setCompany(comp);
        return comp;
    };

    const joinCompany = async (inviteCode: string): Promise<Company> => {
        if (!user.id) throw new Error('Not authenticated');

        // Find the company by invite code
        const { data: comp, error } = await supabase
            .from('companies')
            .select('*')
            .eq('invite_code', inviteCode.trim().toLowerCase())
            .single();

        if (error || !comp) throw new Error('Invalid invite code. Please check with your administrator.');

        // Link this user profile to the company
        const { error: profileError } = await supabase
            .from('user_profiles')
            .update({ company_id: comp.id })
            .eq('id', user.id);

        if (profileError) throw new Error(profileError.message);

        setCompany(comp);
        return comp;
    };

    return (
        <CompanyContext.Provider value={{ company, loading, createCompany, joinCompany, refetch: fetchCompany }}>
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompany() {
    const ctx = useContext(CompanyContext);
    if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
    return ctx;
}
