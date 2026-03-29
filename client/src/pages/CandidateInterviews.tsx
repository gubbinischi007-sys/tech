import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { interviewsApi } from '../services/api';
import { Calendar, Video, MapPin, Download, CheckCircle, Clock, Users, ArrowLeft, XCircle } from 'lucide-react';
import './CandidateInterviews.css';
import { Link } from 'react-router-dom';

export default function CandidateInterviews() {
    const { user } = useAuth();
    const [interviews, setInterviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.email) {
            loadInterviews();
        }
    }, [user]);

    const loadInterviews = async () => {
        try {
            // We can fetch all interviews for this candidate's email
            const res = await interviewsApi.getAll({ applicant_email: user?.email });
            setInterviews(res.data || []);
        } catch (err) {
            console.error('Failed to load candidate interviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateIcs = (interview: any) => {
        const date = new Date(interview.scheduled_at);
        const endDate = new Date(date.getTime() + 60 * 60 * 1000); // 1 hour duration

        const pad = (n: number) => String(n).padStart(2, '0');
        const formatDate = (d: Date) => {
            return d.getUTCFullYear() +
                pad(d.getUTCMonth() + 1) +
                pad(d.getUTCDate()) + 'T' +
                pad(d.getUTCHours()) +
                pad(d.getUTCMinutes()) +
                pad(d.getUTCSeconds()) + 'Z';
        };

        const event = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `DTSTART:${formatDate(date)}`,
            `DTEND:${formatDate(endDate)}`,
            `SUMMARY:Interview for ${interview.job_title || 'Application'}`,
            `DESCRIPTION:${interview.notes ? interview.notes + '\\n' : ''}${interview.meeting_link ? 'Meeting Link: ' + interview.meeting_link : 'In-person interview'}`,
            `LOCATION:${interview.type === 'online' ? (interview.meeting_link || 'Online') : 'In-person Office'}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\\r\\n');

        const blob = new Blob([event], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', 'interview.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="loading-container">Loading interviews...</div>;

    const upcomingInterviews = interviews.filter(i => i.status === 'scheduled');
    const pastInterviews = interviews.filter(i => i.status !== 'scheduled');

    return (
        <div className="candidate-interviews animate-fade-in">
            <div className="header-actions">
                <h1>My Interviews</h1>
                <p className="text-muted">Manage your upcoming and past job interviews</p>
            </div>

            <div className="interviews-section">
                <h2>Upcoming Interviews</h2>
                {upcomingInterviews.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={48} className="empty-icon" />
                        <p>No upcoming interviews at this time</p>
                    </div>
                ) : (
                    <div className="interviews-grid">
                        {upcomingInterviews.map((interview, idx) => (
                            <div key={interview.id || idx} className="interview-card">
                                <div className="interview-header">
                                    <div className="interview-title">
                                        <div className="icon-badge primary">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h3>{interview.job_title || 'Unknown Position'}</h3>
                                            <p className="text-muted">{interview.type === 'online' ? 'Virtual Meeting' : 'On-Site Meeting'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => generateIcs(interview)} className="btn btn-secondary action-btn">
                                        <Download size={16} /> Add to Calendar
                                    </button>
                                </div>

                                <div className="interview-details">
                                    <div className="detail-item">
                                        <h4><Clock size={16} /> Date & Time</h4>
                                        <p>{new Date(interview.scheduled_at).toLocaleString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>

                                    {interview.type === 'online' ? (
                                        <div className="detail-item">
                                            <h4><Video size={16} /> Meeting Link</h4>
                                            {interview.meeting_link ? (
                                                <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="link-button">
                                                    Join virtual meeting <ArrowLeft size={14} className="rotate-icon" />
                                                </a>
                                            ) : (
                                                <p className="text-muted">Link will be provided prior to interview</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="detail-item">
                                            <h4><MapPin size={16} /> Location</h4>
                                            <p>Main Office / Refer to email</p>
                                        </div>
                                    )}
                                </div>

                                {interview.notes && (
                                    <div className="interview-notes">
                                        <h4><Users size={16} /> Preparation & Notes</h4>
                                        <p>{interview.notes}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="interviews-section mt-4">
                <h2>Past Interviews</h2>
                {pastInterviews.length === 0 ? (
                    <div className="empty-state small">
                        <p>No past interview records available.</p>
                    </div>
                ) : (
                    <div className="past-interviews-list">
                        {pastInterviews.map((interview, idx) => (
                            <div key={interview.id || idx} className="past-interview-item">
                                <div>
                                    <h4>{interview.job_title || 'Job Interview'}</h4>
                                    <p className="text-muted">{new Date(interview.scheduled_at).toLocaleDateString()}</p>
                                </div>
                                <div className={`status-badge ${interview.status}`}>
                                    {interview.status === 'completed' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                    {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
