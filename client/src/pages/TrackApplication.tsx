import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Activity, Search, CheckCircle, Clock, XCircle, ArrowRight, FileText, AlertCircle, Copy, Check } from 'lucide-react';

type StatusString = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'needs_info';

export default function TrackApplication() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [statusData, setStatusData] = useState<{ name: string; status: StatusString; rejection_reason?: string; created_at?: string } | null>(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        trackingId: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
        setError('');
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.trackingId.trim()) return;

        setIsLoading(true);
        setError('');
        setStatusData(null);

        try {
            const { data, error: rpcError } = await supabase.rpc('get_application_status', {
                p_tracking_id: formData.trackingId.trim().toUpperCase()
            });

            if (rpcError) throw rpcError;
            if (!data) {
                setError('No application found with that Tracking ID.');
                return;
            }

            setStatusData(data);
        } catch (err: any) {
            setError(err?.message || 'Failed to retrieve application status. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getStageProps = (stageIndex: number, currentStatus: StatusString) => {
        const statuses = {
            1: ['pending', 'reviewing', 'approved', 'rejected', 'needs_info'], // Stage 1 is always done if found
            2: ['reviewing', 'approved', 'rejected', 'needs_info'],
            3: ['approved', 'rejected', 'needs_info']
        };

        const isComplete = statuses[stageIndex as 1 | 2 | 3].includes(currentStatus);
        const isActive = stageIndex === 1 && currentStatus === 'pending' ||
                         stageIndex === 2 && currentStatus === 'reviewing' ||
                         stageIndex === 3 && ['approved', 'rejected', 'needs_info'].includes(currentStatus);

        return {
            className: `timeline-step ${isComplete ? 'complete' : ''} ${isActive ? 'active' : ''}`,
            icon: isComplete && !isActive ? <CheckCircle size={20} /> : <div className="step-number">{stageIndex}</div>
        };
    };

    const formatSubmissionDate = (dateString?: string) => {
        if (!dateString) return 'Date unknown';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="company-setup-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Absolute Top-Left Back Button */}
            <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 100 }}>
                <button 
                    onClick={() => navigate('/login?role=hr')}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem', borderRadius: '6px', transition: 'all 0.2s', fontWeight: 500 }}
                    onMouseOver={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                >
                    <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to Sign In
                </button>
            </div>

            <div className="company-setup-bg">
                <div className="bg-orb-1" />
                <div className="bg-orb-2" />
            </div>

            <div className="company-setup-content" style={{ maxWidth: '600px', margin: 'auto' }}>
                <div className="company-setup-header" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <img src="/logo.png" alt="SmartCruiter" style={{ width: 48, height: 48, borderRadius: 10 }} />
                    <h1>Track Application</h1>
                    <p>Enter your tracking details to check the status of your company registration.</p>
                </div>

                {!statusData ? (
                    <div className="setup-card">
                        <div className="card-icon card-icon-green" style={{ marginBottom: '1.5rem' }}>
                            <Search size={28} />
                        </div>
                        
                        <form onSubmit={handleSearch}>
                            <div className="field-group">
                                <label>Tracking ID</label>
                                <input
                                    id="trackingId"
                                    type="text"
                                    placeholder="e.g. APP-A1B2C3"
                                    value={formData.trackingId}
                                    onChange={handleChange}
                                    style={{ textTransform: 'uppercase' }}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="error-msg" style={{ marginBottom: '1rem' }}>
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <button type="submit" className="btn-cta" disabled={isLoading} style={{ width: '100%', marginTop: '1rem' }}>
                                {isLoading ? 'Searching...' : 'Check Status'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="setup-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0 }}>Application Status</h2>
                            <button className="btn-secondary" onClick={() => setStatusData(null)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                Back to Search
                            </button>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem 1.5rem', borderRadius: '12px', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <h3 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>{statusData.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                                <Clock size={14} style={{ opacity: 0.7 }} />
                                <span>Submitted on {formatSubmissionDate(statusData.created_at)}</span>
                            </div>
                        </div>

                        {/* 3-Step Timeline Visual */}
                        <div className="status-timeline" style={{ marginBottom: '3rem' }}>
                            {/* Step 1 */}
                            <div className="timeline-item">
                                <div className={getStageProps(1, statusData.status).className}>
                                    {getStageProps(1, statusData.status).icon}
                                </div>
                                <div className="timeline-content">
                                    <h4>Application Received</h4>
                                    <p>The system securely received your registration form.</p>
                                </div>
                            </div>
                            
                            {/* Connector */}
                            <div className={`timeline-connector ${['reviewing', 'approved', 'rejected', 'needs_info'].includes(statusData.status) ? 'active' : ''}`} />

                            {/* Step 2 */}
                            <div className="timeline-item">
                                <div className={getStageProps(2, statusData.status).className}>
                                    {getStageProps(2, statusData.status).icon}
                                </div>
                                <div className="timeline-content">
                                    <h4>Under Review</h4>
                                    <p>An admin is currently verifying your business documents.</p>
                                </div>
                            </div>

                            {/* Connector */}
                            <div className={`timeline-connector ${['approved', 'rejected', 'needs_info'].includes(statusData.status) ? 'active' : ''}`} />

                            {/* Step 3 */}
                            <div className="timeline-item">
                                <div className={getStageProps(3, statusData.status).className}>
                                    {getStageProps(3, statusData.status).icon}
                                </div>
                                <div className="timeline-content">
                                    <h4>Final Decision</h4>
                                    {statusData.status === 'approved' ? (
                                        <p style={{ color: '#10b981', fontWeight: 500 }}>Approved! Your workspace is ready.</p>
                                    ) : statusData.status === 'rejected' ? (
                                        <p style={{ color: '#ef4444', fontWeight: 500 }}>Application Rejected.</p>
                                    ) : statusData.status === 'needs_info' ? (
                                        <p style={{ color: '#eab308', fontWeight: 500 }}>More Information Required.</p>
                                    ) : (
                                        <p>Awaiting final sign-off from platform administrators.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions based on Status */}
                        {statusData.status === 'approved' && (
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                                <h4 style={{ color: '#10b981', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircle size={18} /> Next Steps
                                </h4>
                                <p style={{ color: '#d1fae5', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                    Your company has been verified! To initialize your workspace, please create your HR account and use your Tracking ID to claim it.
                                </p>
                                <button className="btn-cta" style={{ width: '100%' }} onClick={() => navigate('/login?role=hr&mode=signup')}>
                                    Create HR Account <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                                </button>
                            </div>
                        )}

                        {statusData.status === 'rejected' && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                                <h4 style={{ color: '#ef4444', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <XCircle size={18} /> Update Required
                                </h4>
                                <p style={{ color: '#fee2e2', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    Unfortunately, your application was not approved.
                                </p>
                                {statusData.rejection_reason && (
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', color: '#fca5a5', fontSize: '0.9rem', marginTop: '1rem' }}>
                                        <strong>Reason:</strong> {statusData.rejection_reason}
                                    </div>
                                )}
                            </div>
                        )}

                        {(statusData.status === 'pending' || statusData.status === 'reviewing') && (
                            <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '1rem' }}>
                                <Activity size={24} style={{ margin: '0 auto 0.5rem auto', color: '#6366f1', opacity: 0.8 }} />
                                <p>We will email your registered representative as soon as a decision is made.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
            .tracking-pill:hover {
                border-color: rgba(255,255,255,0.25) !important;
                background: rgba(15, 23, 42, 1) !important;
            }
            .status-timeline {
                display: flex;
                flex-direction: column;
                gap: 0;
            }
            .timeline-item {
                display: flex;
                gap: 1.5rem;
                align-items: flex-start;
                position: relative;
            }
            .timeline-step {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: rgba(255,255,255,0.05);
                border: 2px solid rgba(255,255,255,0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #64748b;
                z-index: 2;
                transition: all 0.3s ease;
            }
            @keyframes pulse-ring {
                0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
                100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
            }
            .timeline-step.active {
                border-color: #6366f1;
                background: rgba(99, 102, 241, 0.1);
                color: #818cf8;
                animation: pulse-ring 2s infinite cubic-bezier(0.24, 0, 0.38, 1);
            }
            .timeline-step.complete {
                background: #10b981;
                border-color: #10b981;
                color: white;
            }
            .step-number {
                font-weight: 600;
                font-size: 0.9rem;
            }
            .timeline-content {
                padding-bottom: 2rem;
            }
            .timeline-content h4 {
                margin: 0 0 0.25rem 0;
                color: white;
                font-size: 1.05rem;
            }
            .timeline-content p {
                margin: 0;
                color: #94a3b8;
                font-size: 0.85rem;
                line-height: 1.5;
            }
            .timeline-connector {
                position: absolute;
                left: 17.5px;
                top: 40px; /* Added gap buffer */
                bottom: -4px; /* Added gap buffer */
                width: 2px;
                background: rgba(255,255,255,0.05);
                z-index: 1;
                transition: all 0.3s ease;
            }
            .timeline-connector.active {
                background: #10b981;
            }
            .timeline-item:last-child .timeline-content {
                padding-bottom: 0;
            }
            `}</style>
        </div>
    );
}
