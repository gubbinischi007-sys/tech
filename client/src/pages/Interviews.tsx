import { useState, useEffect } from 'react';
import { Calendar, ArrowLeft, Video, Phone, Users, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { interviewsApi } from '../services/api';
import { format } from 'date-fns';
import { logAction } from '../utils/historyLogger';

interface Interview {
    id: string;
    applicant_id: string;
    job_id: string;
    scheduled_at: string;
    type: string;
    meeting_link?: string;
    notes?: string;
    status: string;
    applicant_name: string;
    applicant_email: string;
    job_title: string;
}

export default function Interviews() {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterJob, setFilterJob] = useState('all');

    useEffect(() => {
        loadInterviews();
    }, []);

    const loadInterviews = async () => {
        try {
            const res = await interviewsApi.getAll();
            setInterviews(res.data || []);
        } catch (error) {
            console.error('Failed to load interviews', error);
            // Fallback demo interviews
            setInterviews([
                { id: '1', applicant_id: '1', job_id: '1', applicant_name: 'Sarah Chen', applicant_email: 'sarah.c@example.com', job_title: 'Senior Frontend Engineer', scheduled_at: new Date(Date.now() + 86400000).toISOString(), type: 'video', status: 'scheduled', meeting_link: 'https://meet.google.com/abc-defg-hij' },
                { id: '2', applicant_id: '3', job_id: '3', applicant_name: 'Priya Lin', applicant_email: 'priya.l@example.com', job_title: 'UX Designer', scheduled_at: new Date(Date.now() + 172800000).toISOString(), type: 'video', status: 'scheduled', meeting_link: 'https://meet.google.com/xyz-pdqr-stu' },
                { id: '3', applicant_id: '2', job_id: '2', applicant_name: 'Rajan Mehta', applicant_email: 'rajan.m@example.com', job_title: 'Product Manager', scheduled_at: new Date(Date.now() - 86400000).toISOString(), type: 'phone', status: 'completed' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string, applicantName: string) => {
        try {
            await interviewsApi.update(id, { status: newStatus });
            logAction(`Marked interview as ${newStatus} for ${applicantName}`);
            loadInterviews(); // dynamically update
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted">Loading interviews...</div>;
    }

    const uniqueJobs = Array.from(new Set(interviews.map(i => i.job_title))).filter(Boolean);
    const displayedInterviews = filterJob === 'all' ? interviews : interviews.filter(i => i.job_title === filterJob);

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '3rem' }}>
                <Link to="/admin/dashboard" className="inline-flex items-center text-muted hover:text-white transition-colors">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Dashboard
                </Link>
            </div>
            <div className="mb-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="text-3xl font-bold mb-2">Interviews</h1>
                    <p className="text-muted">Manage your upcoming and past interviews.</p>
                </div>
                {interviews.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Filter Role:</label>
                        <select
                            className="input"
                            style={{ minWidth: '220px', cursor: 'pointer', padding: '0.5rem 1rem' }}
                            value={filterJob}
                            onChange={e => setFilterJob(e.target.value)}
                        >
                            <option value="all">All Roles</option>
                            {uniqueJobs.map(job => (
                                <option key={job} value={job}>{job}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {interviews.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <Calendar size={40} color="#6366f1" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">No Interviews Scheduled</h2>
                    <p className="text-muted mb-8" style={{ maxWidth: '400px', margin: '0 auto 2rem auto' }}>
                    </p>
                    <Link to="/admin/applicants" className="btn btn-primary btn-sm" style={{ width: 'fit-content', margin: '0 auto' }}>
                        View Applicants
                    </Link>
                </div>
            ) : displayedInterviews.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <Calendar size={40} color="#6366f1" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">No Matches Found</h2>
                    <p className="text-muted mb-8" style={{ maxWidth: '400px', margin: '0 auto 2rem auto' }}>
                        No interviews could be found matching the selected job filter.
                    </p>
                    <button onClick={() => setFilterJob('all')} className="btn btn-secondary btn-sm" style={{ width: 'fit-content', margin: '0 auto' }}>
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="card">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Job Role</th>
                                    <th>Date & Time</th>
                                    <th>Details</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedInterviews.map(i => {
                                    let TypeIcon = Video;
                                    if (i.type === 'phone') TypeIcon = Phone;
                                    if (i.type === 'in-person') TypeIcon = Users;

                                    return (
                                        <tr key={i.id}>
                                            <td>
                                                <Link to={`/admin/applicants/${i.applicant_id}`} style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
                                                    {i.applicant_name}
                                                </Link>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{i.applicant_email}</div>
                                            </td>
                                            <td>{i.job_title}</td>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{format(new Date(i.scheduled_at), 'MMM d, yyyy')}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{format(new Date(i.scheduled_at), 'h:mm a')}</div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize' }}>
                                                    <TypeIcon size={14} className="text-muted" /> {i.type}
                                                </div>
                                                {i.meeting_link && (
                                                    <a href={i.meeting_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#6366f1' }}>Join Link</a>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${i.status === 'scheduled' ? 'pending' : i.status === 'completed' ? 'success' : 'danger'}`}>
                                                    {i.status}
                                                </span>
                                            </td>
                                            <td>
                                                {i.status === 'scheduled' && (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => { if (window.confirm('Mark this interview as completed?')) handleStatusUpdate(i.id, 'completed', i.applicant_name) }} className="btn btn-sm" style={{ background: '#10b981', padding: '6px 10px', color: '#fff', border: 'none' }} title="Mark Completed"><CheckCircle size={14} /></button>
                                                        <button onClick={() => { if (window.confirm('Are you sure you want to cancel this interview?')) handleStatusUpdate(i.id, 'cancelled', i.applicant_name) }} className="btn btn-sm" style={{ background: '#ef4444', padding: '6px 10px', color: '#fff', border: 'none' }} title="Cancel Interview"><XCircle size={14} /></button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
