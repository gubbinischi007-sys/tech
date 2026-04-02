import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Shield, Building, CheckCircle, XCircle, Clock, ExternalLink, Search, AlertCircle, ArrowLeft } from 'lucide-react';
import './PlatformAdmin.css';

interface Company {
    id: string;
    name: string;
    email: string;
    status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'needs_info';
    document_url?: string;
    tracking_id?: string;
    rejection_reason?: string;
    created_at: string;
    admin_doc_verified?: boolean;
    admin_bg_checked?: boolean;
    admin_notes?: string;
    extracted_tax_id?: string;
    extracted_keywords?: string[];
}

export default function PlatformAdmin() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

    useEffect(() => {
        fetchCompanies();
    }, [statusFilter]);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            let query = supabase.from('companies').select('*').order('created_at', { ascending: false });
            
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            
            setCompanies(data || []);
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateCompliance = async (id: string, updates: any) => {
        // Set timestamps when checkmarks are toggled
        if (updates.admin_doc_verified === true) updates.admin_doc_verified_at = new Date().toISOString();
        if (updates.admin_doc_verified === false) updates.admin_doc_verified_at = null;
        
        if (updates.admin_bg_checked === true) updates.admin_bg_checked_at = new Date().toISOString();
        if (updates.admin_bg_checked === false) updates.admin_bg_checked_at = null;

        // Optimistically update the UI to prevent switch lag
        setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

        try {
            const { error } = await supabase.from('companies').update(updates).eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error('Failed compliance sync:', error);
            alert('Failed to save compliance state to the database.');
            // Revert on fail
            fetchCompanies();
        }
    };

    const handleVerify = async (id: string, newStatus: 'approved' | 'rejected' | 'needs_info') => {
        try {
            let reason = null;
            if (newStatus === 'rejected') {
                reason = prompt('Please provide a reason for permanently rejecting this application (visible to the company):') || 'Does not meet platform requirements.';
            } else if (newStatus === 'needs_info') {
                reason = prompt('What information exactly do you need clarified? (They will be emailed this request):') || 'Please provide additional verifiable business documentation.';
            }

            const { error } = await supabase.rpc('verify_company_application', {
                p_id: id,
                p_status: newStatus,
                p_rejection_reason: reason
            });

            if (error) throw error;
            
            // Instantly update the view
            setCompanies(prev => {
                if (statusFilter === 'all') {
                    return prev.map(c => c.id === id ? { ...c, status: newStatus, rejection_reason: reason || undefined } : c);
                } else {
                    return prev.filter(c => c.id !== id);
                }
            });
            
        } catch (error) {
            console.error('Error verifying company:', error);
            alert('Failed to verify company. You might not have the correct permissions.');
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.tracking_id && c.tracking_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Removed security checks for preview mode


    return (
        <div className="platform-admin-page">
            <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1><Shield size={28} /> Platform Administration</h1>
                    <p className="subtitle" style={{ margin: 0 }}>Manage company verifications and platform security</p>
                </div>
                <button 
                    onClick={async () => {
                        await logout();
                    }}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.6rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    title="Terminate Administrator Session"
                >
                    <XCircle size={16} /> Secure Logout
                </button>
            </header>

            <div className="admin-controls">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or Tracking ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-tabs">
                    <button
                        className={statusFilter === 'pending' ? 'active' : ''}
                        onClick={() => setStatusFilter('pending')}
                    >
                        Pending Review
                    </button>
                    <button
                        className={statusFilter === 'approved' ? 'active' : ''}
                        onClick={() => setStatusFilter('approved')}
                    >
                        Approved
                    </button>
                    <button
                        className={statusFilter === 'rejected' ? 'active' : ''}
                        onClick={() => setStatusFilter('rejected')}
                    >
                        Rejected / Needs Info
                    </button>
                    <button
                        className={statusFilter === 'all' ? 'active' : ''}
                        onClick={() => setStatusFilter('all')}
                    >
                        All
                    </button>
                </div>
            </div>

            <div className="companies-grid">
                {loading ? (
                    <div className="loading-state">Loading companies metadata...</div>
                ) : filteredCompanies.length === 0 ? (
                    <div className="empty-state">
                        <Building size={48} />
                        <p>No companies found matching your criteria.</p>
                    </div>
                ) : (
                    filteredCompanies.map(company => (
                        <div key={company.id} className="company-card" style={{ height: 'auto', display: 'flex', flexDirection: 'column' }}>
                            <div className="card-header">
                                <div className="company-info">
                                    <h3>{company.name}</h3>
                                    <p>{company.email}</p>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', margin: '4px 0' }}>
                                        Track ID: <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{company.tracking_id}</span>
                                    </span>
                                </div>
                                <span className={`status-badge ${company.status}`}>
                                    {company.status.toUpperCase().replace('_', ' ')}
                                </span>
                            </div>

                            <div className="card-body" style={{ flexGrow: 0 }}>
                                <div className="detail-item" style={{ marginBottom: '1rem' }}>
                                    <Clock size={14} />
                                    <span>Applied on: {new Date(company.created_at).toLocaleDateString()}</span>
                                </div>

                                {company.document_url && (
                                    <a
                                        href={company.document_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="doc-link"
                                        style={{ display: 'inline-flex', marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.2)', width: '100%', justifyContent: 'center' }}
                                    >
                                        <ExternalLink size={14} style={{ marginRight: '6px' }} /> View Business Document
                                    </a>
                                )}
                                
                                {/* Smart Dashboard Auto-Scraper UI */}
                                {(company.extracted_tax_id || (company.extracted_keywords && company.extracted_keywords.length > 0)) && (
                                    <div style={{ background: 'rgba(124, 58, 237, 0.05)', border: '1px solid rgba(124, 58, 237, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <Shield size={14} color="#a78bfa" />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Auto-Scraper Results</span>
                                        </div>
                                        
                                        {company.extracted_tax_id && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tax Registration ID</span>
                                                <span style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>{company.extracted_tax_id}</span>
                                            </div>
                                        )}
                                        
                                        {company.extracted_keywords && company.extracted_keywords.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {company.extracted_keywords.map((kw, i) => (
                                                    <span key={i} style={{ fontSize: '0.65rem', background: 'rgba(124, 58, 237, 0.15)', color: '#c4b5fd', padding: '2px 6px', borderRadius: '12px' }}>
                                                        ✓ {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div style={{ flexGrow: 1 }} />

                            {/* Compliance Checklist Pipeline Engine */}
                            {(company.status === 'pending' || company.status === 'needs_info') && (
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginTop: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Compliance Flow
                                    </h4>
                                    
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: company.admin_doc_verified ? '#10b981' : '#e2e8f0' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={company.admin_doc_verified || false} 
                                            onChange={(e) => updateCompliance(company.id, { admin_doc_verified: e.target.checked })}
                                            style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                                        />
                                        <span>Document Validity Verified</span>
                                    </label>
                                    
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', cursor: 'pointer', fontSize: '0.9rem', color: company.admin_bg_checked ? '#10b981' : '#e2e8f0' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={company.admin_bg_checked || false} 
                                            onChange={(e) => updateCompliance(company.id, { admin_bg_checked: e.target.checked })}
                                            style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                                        />
                                        <span>Background Check Cleared</span>
                                    </label>

                                    <textarea
                                        placeholder="Secure internal admin notes..."
                                        defaultValue={company.admin_notes || ''}
                                        onBlur={(e) => updateCompliance(company.id, { admin_notes: e.target.value })}
                                        style={{ width: '100%', minHeight: '60px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', resize: 'vertical' }}
                                    />
                                </div>
                            )}

                            <div className="card-actions" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {(company.status === 'pending' || company.status === 'needs_info') && (
                                    <>
                                        <button
                                            className="btn-approve"
                                            onClick={() => handleVerify(company.id, 'approved')}
                                            disabled={!company.admin_doc_verified || !company.admin_bg_checked}
                                            style={{ 
                                                width: '100%', 
                                                justifyContent: 'center',
                                                opacity: (!company.admin_doc_verified || !company.admin_bg_checked) ? 0.3 : 1, 
                                                cursor: (!company.admin_doc_verified || !company.admin_bg_checked) ? 'not-allowed' : 'pointer'
                                            }}
                                            title={(!company.admin_doc_verified || !company.admin_bg_checked) ? "Complete compliance checks first" : "Finalize Approval"}
                                        >
                                            <CheckCircle size={16} /> Finalize Appproval
                                        </button>

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn-reject"
                                                style={{ flex: 1, justifyContent: 'center', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)' }}
                                                onClick={() => handleVerify(company.id, 'needs_info')}
                                            >
                                                <AlertCircle size={16} /> Req Clarification
                                            </button>
                                            <button
                                                className="btn-reject"
                                                style={{ flex: 1, justifyContent: 'center' }}
                                                onClick={() => handleVerify(company.id, 'rejected')}
                                            >
                                                <XCircle size={16} /> Hard Reject
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
