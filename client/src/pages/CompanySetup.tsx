import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Building2, Users, ArrowRight, Copy, CheckCircle, AlertCircle, Sparkles, Lock, FileText, Search } from 'lucide-react';
import './CompanySetup.css';

type Mode = 'choose' | 'create' | 'join';

export default function CompanySetup() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { joinCompany, refetch } = useCompany();

    const [mode, setMode] = useState<Mode>('choose');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [createdCompany, setCreatedCompany] = useState<{ invite_code: string } | null>(null);

    const [formData, setFormData] = useState({
        trackingId: '',
        inviteCode: '',
    });

    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        setError('');
    };

    const handleClaimWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.trackingId.trim()) return;

        setIsLoading(true);
        setError('');
        try {
            // Claim the approved company using Tracking ID
            const { data: inviteCode, error: rpcError } = await supabase.rpc('claim_approved_company', {
                p_tracking_id: formData.trackingId.trim().toUpperCase()
            });

            if (rpcError) throw rpcError;
            if (!inviteCode) throw new Error('Could not retrieve invite code. Please contact support.');

            // Success! We claimed the workspace. Refresh context and set state.
            await refetch();
            setCreatedCompany({ invite_code: inviteCode });
        } catch (err: any) {
            setError(err?.message || 'Failed to claim workspace. Check your Tracking ID or ensure the company is officially approved.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.inviteCode.trim()) return;

        setIsLoading(true);
        setError('');
        try {
            await joinCompany(formData.inviteCode.trim());
            navigate('/admin/dashboard');
        } catch (err: any) {
            setError(err?.message || 'Invalid 1-time invite code. Please check with your administrator.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyCode = () => {
        if (createdCompany) {
            navigator.clipboard.writeText(createdCompany.invite_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="company-setup-container">
            <div className="company-setup-bg">
                <div className="bg-orb-1" />
                <div className="bg-orb-2" />
            </div>

            <div className="company-setup-content">
                {/* Header */}
                <div className="company-setup-header">
                    <img src="/logo.png" alt="ApexRecruit" style={{ width: 48, height: 48, borderRadius: 10 }} />
                    <h1>Set Up Your Workspace</h1>
                    <p>Initialize an approved company workspace or join an existing team.</p>
                </div>

                {/* Success State — Workspace Claimed */}
                {createdCompany ? (
                    <div className="setup-card success-card">
                        <div className="success-icon">
                            <CheckCircle size={32} />
                        </div>
                        <h2>🎉 Workspace Initialized!</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                            Your company is successfully linked. Share the <strong>1-time generation code</strong> below with your HR team members so they can join securely.
                        </p>

                        <div className="invite-code-display">
                            <span className="invite-label">
                                <Lock size={14} style={{ marginRight: 6 }} /> 1-Time Invite Code
                            </span>
                            <div className="invite-code-row">
                                <code className="invite-code">{createdCompany.invite_code}</code>
                                <button className="copy-btn" onClick={copyCode}>
                                    {copied ? <CheckCircle size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' }}>
                            Your colleagues will enter this exact code when choosing "Join a Company". Keep it safe!
                        </p>

                        <button className="btn-cta" onClick={() => navigate('/admin/dashboard')}>
                            Enter Dashboard <ArrowRight size={16} />
                        </button>
                    </div>

                ) : mode === 'choose' ? (
                    /* Choice Cards */
                    <div className="choice-grid">
                        <div className="choice-card choice-create" onClick={() => setMode('create')}>
                            <div className="choice-icon">
                                <Building2 size={32} />
                            </div>
                            <h3>Create / Claim Workspace</h3>
                            <p>Initialize your company workspace after admin approval using your Tracking ID.</p>
                            <div className="choice-arrow"><ArrowRight size={18} /></div>
                        </div>

                        <div className="choice-card choice-join" onClick={() => setMode('join')}>
                            <div className="choice-icon choice-icon-green">
                                <Users size={32} />
                            </div>
                            <h3>Join a Company</h3>
                            <p>Already have a 1-time invite code from your administrator? Enter it to join your team.</p>
                            <div className="choice-arrow"><ArrowRight size={18} /></div>
                        </div>
                    </div>

                ) : mode === 'create' ? (
                    /* Claim/Create Workspace using Tracking ID */
                    <div className="setup-card">
                        <div className="card-icon card-icon-purple">
                            <Building2 size={28} />
                        </div>
                        <h2>Initialize Workspace</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Enter the <strong>Tracking ID</strong> you received when your company was approved. This will securely link you as the workspace admin.
                        </p>

                        <form onSubmit={handleClaimWorkspace}>
                            <div className="field-group">
                                <label>Approved Tracking ID</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input
                                        id="trackingId"
                                        type="text"
                                        placeholder="e.g. APP-A1B2C3"
                                        style={{ textTransform: 'uppercase', paddingLeft: '2.5rem' }}
                                        value={formData.trackingId}
                                        onChange={handleChange}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="error-msg">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => { setMode('choose'); setError(''); }}>
                                    Back
                                </button>
                                <button type="submit" className="btn-cta" disabled={isLoading} style={{ flex: 1 }}>
                                    {isLoading ? 'Verifying...' : <><Sparkles size={16} /> Verify & Create Workspace</>}
                                </button>
                            </div>
                        </form>
                    </div>

                ) : (
                    /* Join Form */
                    <div className="setup-card">
                        <div className="card-icon card-icon-green">
                            <Users size={28} />
                        </div>
                        <h2>Join Your Team</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Enter the 1-time generation code your workspace administrator shared with you.
                        </p>

                        <form onSubmit={handleJoin}>
                            <div className="field-group">
                                <label>1-Time Company Code</label>
                                <input
                                    id="inviteCode"
                                    type="text"
                                    placeholder="e.g. a1b2c3d4"
                                    value={formData.inviteCode}
                                    onChange={handleChange}
                                    style={{ letterSpacing: '0.15rem', textTransform: 'lowercase', textAlign: 'center', fontSize: '1.1rem' }}
                                    maxLength={16}
                                    required
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="error-msg">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => { setMode('choose'); setError(''); }}>
                                    Back
                                </button>
                                <button type="submit" className="btn-cta" disabled={isLoading} style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                    {isLoading ? 'Joining...' : <><ArrowRight size={16} /> Join Workspace</>}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
