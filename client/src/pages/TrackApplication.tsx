import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Activity, Search, CheckCircle, Clock, XCircle, ArrowRight,
    AlertCircle, Copy, Check, Building2, FileSearch, Sparkles,
    ChevronLeft, Shield, RotateCcw
} from 'lucide-react';

type StatusString = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'needs_info';

interface StatusData {
    id: string;
    name: string;
    status: StatusString;
    rejection_reason?: string;
    created_at?: string;
    updated_at?: string;
    tracking_id?: string;
    setup_completed?: boolean;
    admin_doc_verified?: boolean;
    admin_bg_checked?: boolean;
    admin_doc_verified_at?: string;
    admin_bg_checked_at?: string;
}

const STATUS_CONFIG: Record<StatusString, { label: string; color: string; bg: string; border: string; icon: JSX.Element }> = {
    pending: {
        label: 'Pending Review',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.1)',
        border: 'rgba(245,158,11,0.25)',
        icon: <Clock size={14} />,
    },
    reviewing: {
        label: 'Under Review',
        color: '#6366f1',
        bg: 'rgba(99,102,241,0.1)',
        border: 'rgba(99,102,241,0.25)',
        icon: <FileSearch size={14} />,
    },
    approved: {
        label: 'Approved',
        color: '#10b981',
        bg: 'rgba(16,185,129,0.1)',
        border: 'rgba(16,185,129,0.25)',
        icon: <CheckCircle size={14} />,
    },
    rejected: {
        label: 'Not Approved',
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.1)',
        border: 'rgba(239,68,68,0.25)',
        icon: <XCircle size={14} />,
    },
    needs_info: {
        label: 'Info Required',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.1)',
        border: 'rgba(245,158,11,0.25)',
        icon: <AlertCircle size={14} />,
    },
};

export default function TrackApplication() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [statusData, setStatusData] = useState<StatusData | null>(null);
    const [error, setError] = useState('');
    const [trackingId, setTrackingId] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!trackingId.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const { data, error: rpcError } = await supabase.rpc('get_application_status', {
                p_tracking_id: trackingId.trim().toUpperCase()
            });

            if (rpcError) throw rpcError;
            if (!data) {
                setError('No application found with that Tracking ID. Please double-check and try again.');
                return;
            }

            setStatusData(data);
        } catch (err: any) {
            setError(err?.message || 'Failed to retrieve application status. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // ======= Real-time Subscription =======
    useEffect(() => {
        if (!statusData?.id) return;

        const channel = supabase
            .channel(`track-${statusData.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'companies',
                    filter: `id=eq.${statusData.id}`,
                },
                async (payload) => {
                    // When any change happens, re-fetch via RPC to get the full formatted StatusData
                    console.log('Realtime change detected, refreshing...', payload);
                    handleSearch();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [statusData?.id]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Date unknown';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatShortDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });
    };

    // Returns a date label for each timeline step
    const getStageDate = (stepIndex: number, status: StatusString, created_at?: string): { label: string; color: string } | null => {
        if (!created_at) return null;
        const submitted = new Date(created_at);
        const reviewStart = new Date(submitted.getTime() + 2 * 60 * 60 * 1000);   // +2 hrs
        const decision   = new Date(submitted.getTime() + 24 * 60 * 60 * 1000);  // +24 hrs

        const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        if (stepIndex === 0) {
            // Always show actual submission time
            return { label: fmt(submitted), color: '#10b981' };
        }
        if (stepIndex === 1) {
            // Document Verification
            return statusData.admin_doc_verified && statusData.admin_doc_verified_at
                ? { label: `${fmt(new Date(statusData.admin_doc_verified_at))}`, color: '#10b981' }
                : { label: `Review expected within 1–2 business days`, color: '#475569' };
        }
        if (stepIndex === 2) {
            // Background check
            return statusData.admin_bg_checked && statusData.admin_bg_checked_at
                ? { label: `${fmt(new Date(statusData.admin_bg_checked_at))}`, color: '#10b981' }
                : { label: `Typically takes 2–3 business days`, color: '#475569' };
        }
        if (stepIndex === 3) {
            // Final decision
            if (['approved', 'rejected', 'needs_info'].includes(status)) {
                const decisionTime = statusData.updated_at ? new Date(statusData.updated_at) : decision;
                return { label: `${fmt(decisionTime)}`, color: status === 'approved' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b' };
            }
            return { label: `Usually issued within 1–2 business days`, color: '#475569' };
        }
        return null;
    };

    const getStageIndex = (status: StatusString): number => {
        if (status === 'pending')   return 1; // step 0 active = received
        if (status === 'reviewing') return 3; // step 1 done (doc), step 2 active (bg check)
        return 4; // final decision active or all done
    };

    const stages = [
        { label: 'Application Received',   desc: 'Your registration form was securely received.',          statuses: ['pending','reviewing','approved','rejected','needs_info'] },
        { label: 'Document Verification',  desc: 'Admin is checking your submitted business documents.',    statuses: ['reviewing','approved','rejected','needs_info'] },
        { label: 'Background Check',       desc: 'Company background and entity legitimacy validation.',    statuses: ['approved','rejected','needs_info'] },
        { label: 'Final Decision',         desc: 'Platform team issues an approval or denial.',             statuses: ['approved','rejected','needs_info'] },
    ];

    const cfg = statusData ? STATUS_CONFIG[statusData.status] : null;

    return (
        <div style={{ minHeight: '100vh', background: '#080c14', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Background orbs */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
                <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />
            </div>

            {/* Top Navigation Bar */}
            <nav style={{ position: 'relative', zIndex: 10, padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,12,20,0.8)', backdropFilter: 'blur(12px)' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
                    <img src="/logo.png" alt="ApexRecruit" style={{ width: 32, height: 32, borderRadius: 8 }} />
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>ApexRecruit</span>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link to="/register-company" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', padding: '0.4rem 0.75rem', borderRadius: 6, transition: 'all 0.2s' }}
                        onMouseOver={e => (e.currentTarget.style.color = 'white')}
                        onMouseOut={e => (e.currentTarget.style.color = '#94a3b8')}>
                        Register Company
                    </Link>
                    <Link to="/login?role=hr" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '0.85rem', textDecoration: 'none', padding: '0.4rem 0.9rem', borderRadius: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        HR Login <ArrowRight size={13} />
                    </Link>
                </div>
            </nav>

            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem 4rem', position: 'relative', zIndex: 1 }}>

                {/* Page Header */}
                <div style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: 520 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '0.35rem 0.9rem', marginBottom: '1.25rem' }}>
                        <Sparkles size={13} color="#818cf8" />
                        <span style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Application Tracker</span>
                    </div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'white', margin: '0 0 0.75rem', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                        Track Your Application
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>
                        Enter your Tracking ID to check the real-time status of your company registration.
                    </p>
                </div>

                {/* Search Card */}
                <div style={{ width: '100%', maxWidth: 560, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '2rem', marginBottom: '2rem', backdropFilter: 'blur(8px)' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                placeholder="e.g. APP-A1B2C3"
                                value={trackingId}
                                onChange={e => { setTrackingId(e.target.value); setError(''); }}
                                style={{
                                    width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 10, color: 'white', fontSize: '0.95rem', outline: 'none',
                                    letterSpacing: '0.06em', fontWeight: 600, textTransform: 'uppercase',
                                    boxSizing: 'border-box', fontFamily: 'monospace',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                                required
                            />
                        </div>
                        <button type="submit" disabled={isLoading} style={{
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none',
                            borderRadius: 10, padding: '0 1.4rem', color: 'white', fontWeight: 700,
                            fontSize: '0.9rem', cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1, whiteSpace: 'nowrap', display: 'flex',
                            alignItems: 'center', gap: '0.4rem', transition: 'opacity 0.2s'
                        }}>
                            {isLoading ? <><Activity size={15} style={{ animation: 'spin 1s linear infinite' }} /> Searching...</> : <>Search <ArrowRight size={15} /></>}
                        </button>
                    </form>

                    {error && (
                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.85rem 1rem' }}>
                            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                            <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.85rem', lineHeight: 1.5 }}>{error}</p>
                        </div>
                    )}

                    <p style={{ margin: '1rem 0 0', fontSize: '0.75rem', color: '#475569', textAlign: 'center' }}>
                        Your Tracking ID was shown after submitting your company registration (format: APP-XXXXXX)
                    </p>
                </div>

                {/* Results */}
                {statusData && cfg && (
                    <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeSlideIn 0.35s ease' }}>

                        {/* Company Info Card */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.5rem', backdropFilter: 'blur(8px)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                    <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Building2 size={22} color="#818cf8" />
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, color: 'white', fontSize: '1.2rem', fontWeight: 700 }}>{statusData.name}</h2>
                                        <p style={{ margin: '0.2rem 0 0', color: '#475569', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Clock size={12} /> Submitted {formatDate(statusData.created_at)}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 20, padding: '0.35rem 0.85rem' }}>
                                    <span style={{ color: cfg.color, display: 'flex' }}>{cfg.icon}</span>
                                    <span style={{ color: cfg.color, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.02em' }}>{cfg.label}</span>
                                </div>
                            </div>

                        </div>

                        {/* Timeline Card */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.75rem', backdropFilter: 'blur(8px)' }}>
                            <h3 style={{ margin: '0 0 1.75rem', color: 'white', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Shield size={16} color="#6366f1" /> Application Progress
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                                {stages.map((stage, i) => {
                                    const status = statusData.status;

                                    // Unified logic for the 4-step progress tracker
                                    const isComplete = (
                                        (i === 0) || // Application is always 'Received' if tracking
                                        (i === 1 && (statusData.admin_doc_verified || ['approved','rejected','needs_info'].includes(status))) ||
                                        (i === 2 && (statusData.admin_bg_checked || ['approved','rejected','needs_info'].includes(status))) ||
                                        (i === 3 && ['approved','rejected','needs_info'].includes(status))
                                    );

                                    const isActive = !isComplete && (
                                        (i === 1 && !statusData.admin_doc_verified) ||
                                        (i === 2 && statusData.admin_doc_verified && !statusData.admin_bg_checked) ||
                                        (i === 3 && statusData.admin_bg_checked && status === 'reviewing')
                                    );

                                    const isLast = i === stages.length - 1;

                                    let stepBg = 'rgba(255,255,255,0.05)';
                                    let stepBorder = 'rgba(255,255,255,0.08)';
                                    let stepColor = '#475569';
                                    let iconContent: JSX.Element = <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{i + 1}</span>;

                                    if (isComplete && !isActive) {
                                        stepBg = '#10b981';
                                        stepBorder = '#10b981';
                                        stepColor = 'white';
                                        iconContent = <CheckCircle size={16} />;
                                    } else if (isActive) {
                                        const activeColor = statusData.status === 'rejected' ? '#ef4444'
                                            : statusData.status === 'approved' ? '#10b981'
                                            : statusData.status === 'needs_info' ? '#f59e0b' : '#6366f1';
                                        stepBg = `${activeColor}20`;
                                        stepBorder = activeColor;
                                        stepColor = activeColor;
                                    }

                                    // Background check step special coloring (amber while reviewing)
                                    if (isActive && i === 2) {
                                        stepBg = '#f59e0b20'; stepBorder = '#f59e0b'; stepColor = '#f59e0b';
                                        iconContent = <Shield size={16} />;
                                    }

                                    // Final step special coloring
                                    if (isActive && i === 3) {
                                        if (statusData.status === 'approved') { stepBg = '#10b98120'; stepBorder = '#10b981'; stepColor = '#10b981'; iconContent = <CheckCircle size={16} />; }
                                        else if (statusData.status === 'rejected') { stepBg = '#ef444420'; stepBorder = '#ef4444'; stepColor = '#ef4444'; iconContent = <XCircle size={16} />; }
                                        else if (statusData.status === 'needs_info') { stepBg = '#f59e0b20'; stepBorder = '#f59e0b'; stepColor = '#f59e0b'; iconContent = <AlertCircle size={16} />; }
                                    }

                                    return (
                                        <div key={i} style={{ display: 'flex', gap: '1.25rem', position: 'relative' }}>
                                            {/* Left: icon + connector */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                                <div style={{
                                                    width: 38, height: 38, borderRadius: '50%',
                                                    background: stepBg, border: `2px solid ${stepBorder}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: stepColor, zIndex: 1, position: 'relative',
                                                    boxShadow: isActive ? `0 0 20px ${stepBorder}50` : 'none',
                                                    transition: 'all 0.3s ease'
                                                }}>
                                                    {iconContent}
                                                </div>
                                                {!isLast && (
                                                    <div style={{
                                                        width: 2, flex: 1, minHeight: 32,
                                                        background: stages[i + 1].statuses.includes(statusData.status)
                                                            ? 'linear-gradient(180deg, #10b981, #6366f1)'
                                                            : 'rgba(255,255,255,0.06)',
                                                        borderRadius: 2, margin: '4px 0', transition: 'all 0.3s'
                                                    }} />
                                                )}
                                            </div>

                                            {/* Right: content */}
                                            <div style={{ paddingBottom: isLast ? 0 : '1.75rem', paddingTop: '0.45rem', flex: 1 }}>
                                                <h4 style={{ margin: '0 0 0.2rem', color: isComplete || isActive ? 'white' : '#475569', fontSize: '0.95rem', fontWeight: 700, transition: 'color 0.3s' }}>
                                                    {stage.label}
                                                </h4>
                                                <p style={{ margin: '0 0 0.5rem', color: '#475569', fontSize: '0.82rem', lineHeight: 1.5 }}>
                                                    {/* Customize desc on final step */}
                                                    {i === 2 && statusData.status === 'reviewing'
                                                        ? 'Performing background checks on company entity and registration details.'
                                                        : i === 3
                                                        ? statusData.status === 'approved' ? 'Your company has been approved! Check your email for your Company PIN.'
                                                        : statusData.status === 'rejected' ? 'Your application was not approved at this time.'
                                                        : statusData.status === 'needs_info' ? 'The admin has requested additional information.'
                                                        : 'Awaiting final sign-off from platform administrators.'
                                                        : stage.desc}
                                                </p>
                                                {/* Date chip */}
                                                {(() => {
                                                    const dateInfo = getStageDate(i, statusData.status, statusData.created_at);
                                                    if (!dateInfo) return null;
                                                    const reached = stage.statuses.includes(statusData.status);
                                                    return (
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: reached ? `${dateInfo.color}14` : 'rgba(255,255,255,0.03)', border: `1px solid ${reached ? dateInfo.color + '30' : 'rgba(255,255,255,0.06)'}`, borderRadius: 20, padding: '0.2rem 0.6rem' }}>
                                                            <Clock size={11} color={reached ? dateInfo.color : '#374151'} />
                                                            <span style={{ fontSize: '0.72rem', color: reached ? dateInfo.color : '#374151', fontWeight: 600 }}>{dateInfo.label}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Action Cards based on status */}
                        {statusData.status === 'approved' && (
                            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                                    <CheckCircle size={18} color="#10b981" />
                                    <h4 style={{ margin: 0, color: '#10b981', fontWeight: 700, fontSize: '0.95rem' }}>
                                        {statusData.setup_completed ? "You're Approved — Ready to Recruit" : "You're Approved — Action Required"}
                                    </h4>
                                </div>
                                <p style={{ margin: '0 0 1.25rem', color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                                    {statusData.setup_completed
                                        ? "Your company is fully set up. Staff can now join using the custom Company PIN you created."
                                        : "Your company has been verified! Now you must claim your workspace and set your own chosen Company PIN."}
                                </p>
                                {statusData.setup_completed ? (
                                    <button onClick={() => navigate('/login?role=hr')}
                                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 10, padding: '0.7rem 1.4rem', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Sign In to Workspace <ArrowRight size={15} />
                                    </button>
                                ) : (
                                    <button onClick={() => navigate(`/claim-workspace?tid=${statusData.tracking_id}`)}
                                        style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none', borderRadius: 10, padding: '0.7rem 1.4rem', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Claim Workspace & Set PIN <ArrowRight size={15} />
                                    </button>
                                )}
                            </div>
                        )}

                        {statusData.status === 'rejected' && (
                            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                                    <XCircle size={18} color="#ef4444" />
                                    <h4 style={{ margin: 0, color: '#ef4444', fontWeight: 700, fontSize: '0.95rem' }}>Application Not Approved</h4>
                                </div>
                                <p style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                                    Unfortunately, your application did not meet the requirements at this time.
                                </p>
                                {statusData.rejection_reason && (
                                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1rem' }}>
                                        <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                            <strong>Admin feedback: </strong>{statusData.rejection_reason}
                                        </p>
                                    </div>
                                )}
                                <button onClick={() => navigate('/register-company')}
                                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.7rem 1.4rem', color: '#fca5a5', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <RotateCcw size={14} /> Re-apply with Updated Documents
                                </button>
                            </div>
                        )}

                        {(statusData.status === 'pending' || statusData.status === 'reviewing') && (
                            <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 16, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'rgba(99,102,241,0.12)', borderRadius: 10, padding: '0.6rem', flexShrink: 0 }}>
                                    <Activity size={18} color="#6366f1" />
                                </div>
                                <div>
                                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                                        Full review typically completes within <strong style={{ color: 'white' }}>5–7 business days</strong>. We'll notify you by email as soon as a decision is made.
                                    </p>
                                </div>
                            </div>
                        )}

                        {statusData.status === 'needs_info' && (
                            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                                    <AlertCircle size={18} color="#f59e0b" />
                                    <h4 style={{ margin: 0, color: '#f59e0b', fontWeight: 700, fontSize: '0.95rem' }}>Additional Information Required</h4>
                                </div>
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                                    Please check your registered email for instructions from our team on what additional information is needed.
                                </p>
                            </div>
                        )}

                        {/* Search again */}
                        <button onClick={() => { setStatusData(null); setTrackingId(''); }}
                            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.6rem', color: '#475569', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s' }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#94a3b8'; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#475569'; }}>
                            <ChevronLeft size={14} /> Search a different Tracking ID
                        </button>
                    </div>
                )}

                {/* Empty state hint (no search yet) */}
                {!statusData && !error && (
                    <div style={{ maxWidth: 560, width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {['Application Received', 'Under Review', 'Final Decision'].map((step, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '0.9rem 1.25rem', opacity: 0.5 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.75rem', fontWeight: 700 }}>{i + 1}</div>
                                <span style={{ color: '#475569', fontSize: '0.875rem', fontWeight: 500 }}>{step}</span>
                            </div>
                        ))}
                        <p style={{ textAlign: 'center', color: '#2d3748', fontSize: '0.78rem', margin: '0.5rem 0 0' }}>Enter your Tracking ID above to see real-time progress</p>
                    </div>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                * { box-sizing: border-box; }
                input::placeholder { color: #2d3748; }
            `}</style>
        </div>
    );
}
