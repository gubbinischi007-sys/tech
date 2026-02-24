import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicantsApi, historyApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, Clock, PartyPopper, AlertCircle } from 'lucide-react';
import './ApplicationStatus.css';

interface Application {
    id: string;
    email: string;
    job_title: string;
    stage: string;
    status: string;
    applied_at: string;
    offer_salary?: string;
    offer_joining_date?: string;
    offer_status?: string;
    offer_notes?: string;
    offer_rules?: string;
}

export default function ApplicationStatus() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [application, setApplication] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadApplication();
        }
    }, [id]);

    const loadApplication = async () => {
        try {
            const response = await applicantsApi.getById(id!);
            setApplication(response.data);
        } catch (error) {
            console.warn('Applicant record not found, identifying via history fallback...');
            try {
                // Check history for this user and applicant ID (we might need to match by job title instead if ID isn't in history)
                const historyRes = await historyApi.getAll(user.email!);
                const history = historyRes.data || [];

                // Since we don't have job title yet in this fetch context, we'll try to find any history record 
                // that matches this specific "missing" application flow
                const historyRecord = history[0]; // Simplification: get most recent

                if (historyRecord) {
                    setApplication({
                        id: id!,
                        email: user.email!,
                        job_title: historyRecord.job_title,
                        stage: historyRecord.status === 'Accepted' ? 'hired' : 'declined',
                        status: 'archived',
                        applied_at: historyRecord.date,
                        offer_status: historyRecord.status.toLowerCase()
                    });
                }
            } catch (historyErr) {
                console.error('Failed to load history fallback:', historyErr);
            }
        } finally {
            setLoading(false);
        }
    };



    if (loading) return <div className="loading-container">Loading status...</div>;

    if (!application || application.email !== user.email) return (
        <div className="error-container">
            <AlertCircle size={48} />
            <h2>Application Not Found</h2>
            <p className="text-muted">You do not have permission to view this application.</p>
            <Link to="/candidate/dashboard">Back to Dashboard</Link>
        </div>
    );

    const isHired = application.stage === 'hired';
    const isRejected = application.stage === 'declined' || application.stage === 'withdrawn';

    return (
        <div className="status-page animate-fade-in">
            <Link to="/candidate/dashboard" className="back-link">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className="status-card card">
                <div className="status-header">
                    <h1>{application.job_title}</h1>
                    <p className="applied-date">Applied on {new Date(application.applied_at).toLocaleDateString()}</p>
                </div>

                <div className="status-body">
                    {isHired ? (
                        <div className="result-box success">
                            <div className="icon-wrapper">
                                <CheckCircle size={48} />
                            </div>
                            <h2>Congratulations!</h2>
                            <p>You have been hired for this position. Our team will contact you soon with the next steps.</p>
                            <div className="celebration-icon">
                                <PartyPopper size={32} />
                            </div>
                        </div>
                    ) : isRejected ? (
                        <div className="result-box danger">
                            <div className="icon-wrapper">
                                <XCircle size={48} />
                            </div>
                            <h2>Application Update</h2>
                            <p>Thank you for your interest. At this time, we have decided to move forward with other candidates.</p>
                        </div>
                    ) : (
                        <div className="result-box processing">
                            <div className="icon-wrapper">
                                <Clock size={48} />
                            </div>
                            <h2>Under Review</h2>
                            <p>Your application is currently being reviewed by our hiring team. Current stage: <strong>{application.stage}</strong></p>
                        </div>
                    )}

                    {application.offer_status === 'pending' && (
                        <div className="offer-letter-container animate-fade-in" style={{ marginTop: '2rem', padding: '2rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '1rem', textAlign: 'center' }}>
                            <div style={{ display: 'inline-block', background: '#6366f1', color: 'white', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                                <PartyPopper size={32} />
                            </div>
                            <h2 style={{ marginBottom: '0.5rem' }}>Job Offer Received!</h2>
                            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
                                Congratulations! You have received a job offer for this position.
                            </p>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', display: 'inline-block' }}>
                                <p style={{ margin: 0 }}>Please check your <strong>Inbox</strong> to view the full offer details and take action.</p>
                                <Link
                                    to="/candidate/emails"
                                    className="btn btn-primary"
                                    style={{ marginTop: '1rem', display: 'inline-block' }}
                                >
                                    Go to Inbox
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <div className="status-timeline">
                    <div className="timeline-item completed">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                            <h3>Application Received</h3>
                            <p>Your application was successfully submitted.</p>
                        </div>
                    </div>

                    {application.stage !== 'applied' && (
                        <div className="timeline-item completed">
                            <div className="timeline-marker"></div>
                            <div className="timeline-content">
                                <h3>Initial Screening</h3>
                                <p>Hiring team review.</p>
                            </div>
                        </div>
                    )}

                    {(isHired || isRejected) && (
                        <div className={`timeline-item completed ${isHired ? 'success' : 'danger'}`}>
                            <div className="timeline-marker"></div>
                            <div className="timeline-content">
                                <h3>Final Decision</h3>
                                <p>{isHired ? 'Hiring completed.' : 'Selection finalized.'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
