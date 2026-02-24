import { Briefcase, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import './CandidateDashboard.css';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicantsApi, interviewsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Application {
    id: string;
    jobId: string;
    position: string;
    company: string;
    stage: string;
    date: string;
    status: string;
    offerStatus?: string;
}

export default function CandidateDashboard() {
    const { user } = useAuth();
    // State for real data
    const [myApplications, setMyApplications] = useState<Application[]>([]);
    const [interviewsCount, setInterviewsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'confirm';
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'success'
    });

    const closeModal = () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [user.email]);

    const loadData = async () => {
        if (!user.email) return;

        try {
            // Fetch applications and interviews in parallel
            const [appResponse, intResponse] = await Promise.all([
                applicantsApi.getAll({ email: user.email }),
                interviewsApi.getAll({ applicant_email: user.email })
            ]);

            const mappedApps = appResponse.data
                .map((app: any) => ({
                    id: app.id,
                    jobId: app.job_id,
                    position: app.job_title || 'Unknown Position',
                    company: 'Smart-Cruiter Inc',
                    stage: app.stage,
                    date: new Date(app.applied_at || app.created_at || Date.now()).toLocaleDateString(),
                    status: app.status || 'active',
                    offerStatus: app.offer_status
                }));

            setMyApplications(mappedApps);
            setInterviewsCount((intResponse.data || []).length);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setLoading(false);
        }
    };


    const stats = [
        { label: 'Applications', value: myApplications.length, icon: Briefcase, color: '#3b82f6' },
        { label: 'Interviews', value: interviewsCount, icon: Clock, color: '#f59e0b' },
        { label: 'Offers', value: myApplications.filter(a => a.offerStatus === 'pending').length, icon: CheckCircle, color: '#10b981' },
    ];

    if (loading) {
        return <div className="p-8 text-center text-muted">Loading your dashboard...</div>;
    }

    const handleWithdrawClick = (id: string) => {
        setModalState({
            isOpen: true,
            title: 'Withdraw Application',
            message: 'Are you sure you want to withdraw this application? This action cannot be undone.',
            type: 'confirm',
            onConfirm: () => withdrawApplication(id)
        });
    };

    const withdrawApplication = async (id: string) => {
        try {
            await applicantsApi.delete(id);
            setMyApplications(prev => prev.filter(app => app.id !== id));
            closeModal();
            // Optional: Show success modal after
        } catch (error) {
            console.error('Failed to withdraw application:', error);
            closeModal();
            setModalState({
                isOpen: true,
                title: 'Error',
                message: 'Failed to withdraw application. Please try again.',
                type: 'error'
            });
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">My Application Center</h1>
                <p className="text-muted">Track your job applications and upcoming interviews.</p>
            </div>

            {/* Stats Row */}
            <div className="candidate-stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className="card stat-card">
                        <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-label">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <h2 className="text-xl font-bold mb-6">Recent Applications</h2>
                <div className="applications-list">
                    {myApplications.length === 0 ? (
                        <div className="text-center py-8 text-muted">
                            <p>You haven't applied to any jobs yet.</p>
                            <Link to="/candidate/jobs" className="btn btn-primary btn-sm mt-4">Browse Jobs</Link>
                        </div>
                    ) : (
                        myApplications.map((app) => (
                            <div key={app.id} className="application-item">
                                <div className="app-info">
                                    <div className="company-logo">
                                        {app.company[0]}
                                    </div>
                                    <div className="app-details">
                                        <h3>{app.position}</h3>
                                        <p>{app.company} • Applied on {app.date}</p>
                                    </div>
                                </div>

                                <div className="app-status">
                                    <div className="status-column">
                                        <span className="status-label">Current Stage</span>
                                        <span className={`badge ${app.status === 'active' ? 'badge-shortlisted' : 'badge-withdrawn'}`}>
                                            {app.stage}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link to={`/candidate/applications/${app.id}/status`} className="btn btn-sm btn-secondary">View Status</Link>
                                        <button
                                            onClick={() => handleWithdrawClick(app.id)}
                                            className="btn btn-sm btn-danger-outline"
                                            style={{ borderColor: '#ef4444', color: '#ef4444' }}
                                        >
                                            Withdraw
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Custom Modal */}
            {modalState.isOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className={`modal-icon ${modalState.type === 'confirm' ? 'error' : modalState.type}`}>
                            {modalState.type === 'success' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                        </div>
                        <h3 className="modal-title">{modalState.title}</h3>
                        <p className="modal-message">{modalState.message}</p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {modalState.type === 'confirm' && (
                                <button
                                    className="modal-btn"
                                    style={{ background: '#374151', color: 'white' }}
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                className={`modal-btn ${modalState.type === 'confirm' ? 'error' : modalState.type}`}
                                onClick={() => {
                                    if (modalState.type === 'confirm' && modalState.onConfirm) {
                                        modalState.onConfirm();
                                    } else {
                                        closeModal();
                                    }
                                }}
                            >
                                {modalState.type === 'confirm' ? 'Withdraw' : (modalState.type === 'success' ? 'Continue' : 'Close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
