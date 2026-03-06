import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';
import { Building2, Users, ArrowRight, Copy, CheckCircle, AlertCircle, Sparkles, Lock } from 'lucide-react';
import './CompanySetup.css';

type Mode = 'choose' | 'create' | 'join';

export default function CompanySetup() {
    const navigate = useNavigate();
    const { createCompany, joinCompany } = useCompany();

    const [mode, setMode] = useState<Mode>('choose');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [createdCompany, setCreatedCompany] = useState<{ name: string; invite_code: string } | null>(null);

    const [formData, setFormData] = useState({
        companyName: '',
        companySlug: '',
        inviteCode: '',
    });

    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        if (id === 'companyName' && !formData.companySlug) {
            setFormData(prev => ({
                ...prev,
                companyName: value,
                companySlug: value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 30)
            }));
        }
        setError('');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.companyName.trim()) return;

        setIsLoading(true);
        setError('');
        try {
            const slug = formData.companySlug || formData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const comp = await createCompany(formData.companyName.trim(), slug);
            setCreatedCompany({ name: comp.name, invite_code: comp.invite_code });
        } catch (err: any) {
            setError(err?.message?.includes('unique') ? 'That company slug is already taken. Try a different name.' : (err?.message || 'Failed to create workspace.'));
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
            setError(err?.message || 'Invalid invite code. Please check with your administrator.');
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
                    <img src="/logo.png" alt="SmartCruiter" style={{ width: 48, height: 48, borderRadius: 10 }} />
                    <h1>Set Up Your Workspace</h1>
                    <p>Create a dedicated space for your company or join an existing team.</p>
                </div>

                {/* Success State — Company Created */}
                {createdCompany ? (
                    <div className="setup-card success-card">
                        <div className="success-icon">
                            <CheckCircle size={32} />
                        </div>
                        <h2>🎉 Workspace Created!</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                            <strong style={{ color: 'white' }}>{createdCompany.name}</strong> is ready. Share the invite code below with your HR team members.
                        </p>

                        <div className="invite-code-display">
                            <span className="invite-label">
                                <Lock size={14} style={{ marginRight: 6 }} /> Invite Code
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
                            Team members must use this code when registering as HR. Keep it safe!
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
                            <h3>Create Workspace</h3>
                            <p>Set up a new company workspace. You'll get an invite code to share with your team.</p>
                            <div className="choice-arrow"><ArrowRight size={18} /></div>
                        </div>

                        <div className="choice-card choice-join" onClick={() => setMode('join')}>
                            <div className="choice-icon choice-icon-green">
                                <Users size={32} />
                            </div>
                            <h3>Join a Company</h3>
                            <p>Already have an invite code from your administrator? Enter it to join your team's workspace.</p>
                            <div className="choice-arrow"><ArrowRight size={18} /></div>
                        </div>
                    </div>

                ) : mode === 'create' ? (
                    /* Create Form */
                    <div className="setup-card">
                        <div className="card-icon card-icon-purple">
                            <Building2 size={28} />
                        </div>
                        <h2>Create Your Workspace</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Give your company a unique name and URL slug. You'll be the workspace admin.
                        </p>

                        <form onSubmit={handleCreate}>
                            <div className="field-group">
                                <label>Company Name</label>
                                <input
                                    id="companyName"
                                    type="text"
                                    placeholder="e.g. Acme Technologies"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="field-group">
                                <label>Workspace Slug <span style={{ color: '#64748b', fontWeight: 400 }}>(URL-friendly name)</span></label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.875rem', pointerEvents: 'none' }}>
                                        smartcruiter.app/
                                    </span>
                                    <input
                                        id="companySlug"
                                        type="text"
                                        placeholder="acme-technologies"
                                        value={formData.companySlug}
                                        onChange={handleChange}
                                        style={{ paddingLeft: '9.5rem' }}
                                        pattern="[a-z0-9\-]+"
                                        title="Lowercase letters, numbers, and hyphens only"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="error-msg">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => { setMode('choose'); setError(''); }}>
                                    Back
                                </button>
                                <button type="submit" className="btn-cta" disabled={isLoading} style={{ flex: 1 }}>
                                    {isLoading ? 'Creating...' : <><Sparkles size={16} /> Create Workspace</>}
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
                            Enter the invite code your workspace administrator shared with you.
                        </p>

                        <form onSubmit={handleJoin}>
                            <div className="field-group">
                                <label>Invite Code</label>
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

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
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
