import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, ShieldCheck, User, Briefcase, Star, Send } from 'lucide-react';
import './ReferenceForm.css';

interface ReferenceData {
    ref_name: string;
    first_name: string; // Applicant
    last_name: string; // Applicant
    job_title: string;
    relationship: string;
}

export default function ReferenceForm() {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ReferenceData | null>(null);

    // Form state
    const [form, setForm] = useState({
        years_known: '',
        competency_rating: 0,
        reliability_rating: 0,
        strengths: '',
        areas_for_improvement: '',
        would_rehire: '',
        additional_comments: ''
    });

    useEffect(() => {
        fetchDetails();
    }, [token]);

    const fetchDetails = async () => {
        try {
            const res = await fetch(`/api/references/form/${token}`);
            const result = await res.json();
            if (!res.ok) {
                setError(result.error || 'Invalid or expired link');
            } else {
                setData(result);
            }
        } catch (err) {
            setError('Failed to load the reference request.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await fetch(`/api/references/form/${token}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ responses: form })
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                const result = await res.json();
                setError(result.error || 'Submission failed');
            }
        } catch (err) {
            setError('An error occurred during submission.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="ref-loading">Validating secure link...</div>;
    
    if (error) return (
        <div className="ref-error-container">
            <div className="ref-card error">
                <ShieldCheck size={48} className="text-red-500" />
                <h2>Oops!</h2>
                <p>{error}</p>
                <button onClick={() => window.close()} className="btn-close">Close Tab</button>
            </div>
        </div>
    );

    if (submitted) return (
        <div className="ref-success-container">
            <div className="ref-card success">
                <CheckCircle size={48} className="text-green-500" />
                <h2>Thank You!</h2>
                <p>Your professional reference for <strong>{data?.first_name} {data?.last_name}</strong> has been securely submitted.</p>
                <p className="text-muted">You can now close this window.</p>
            </div>
        </div>
    );

    return (
        <div className="reference-form-page">
            <div className="ref-container">
                <div className="ref-header">
                    <h1>Professional Reference Request</h1>
                    <div className="applicant-badge">
                        <User size={18} />
                        <span>Candidate: <strong>{data?.first_name} {data?.last_name}</strong></span>
                    </div>
                </div>

                <div className="ref-info-section">
                    <p>Hello {data?.ref_name},</p>
                    <p>
                        You have been listed as a professional reference for <strong>{data?.first_name} {data?.last_name}</strong>, 
                        who is currently being considered for the <strong>{data?.job_title}</strong> position. 
                        Your honest feedback is incredibly valuable to our hiring process.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="ref-main-form">
                    <div className="form-group">
                        <label>How many years have you known the candidate and in what capacity?</label>
                        <textarea 
                            required
                            placeholder="e.g., worked together at Acme Corp for 3 years where I was their direct manager..."
                            value={form.years_known}
                            onChange={e => setForm({...form, years_known: e.target.value})}
                        />
                    </div>

                    <div className="rating-grid">
                        <div className="form-group">
                            <label>Technical Competency (1-5)</label>
                            <div className="stars">
                                {[1,2,3,4,5].map(s => (
                                    <Star 
                                        key={s} 
                                        size={24} 
                                        fill={form.competency_rating >= s ? '#f59e0b' : 'none'}
                                        color={form.competency_rating >= s ? '#f59e0b' : '#cbd5e1'}
                                        onClick={() => setForm({...form, competency_rating: s})}
                                        className="cursor-pointer"
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Professional Reliability (1-5)</label>
                            <div className="stars">
                                {[1,2,3,4,5].map(s => (
                                    <Star 
                                        key={s} 
                                        size={24} 
                                        fill={form.reliability_rating >= s ? '#f59e0b' : 'none'}
                                        color={form.reliability_rating >= s ? '#f59e0b' : '#cbd5e1'}
                                        onClick={() => setForm({...form, reliability_rating: s})}
                                        className="cursor-pointer"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>What are the candidate's top strengths?</label>
                        <textarea 
                            required
                            value={form.strengths}
                            onChange={e => setForm({...form, strengths: e.target.value})}
                        />
                    </div>

                    <div className="form-group">
                        <label>Are there any specific areas where the candidate could improve?</label>
                        <textarea 
                            required
                            value={form.areas_for_improvement}
                            onChange={e => setForm({...form, areas_for_improvement: e.target.value})}
                        />
                    </div>

                    <div className="form-group">
                        <label>Would you recommend this candidate for re-hire or for this specific role?</label>
                        <div className="radio-group">
                            <label className="radio-label">
                                <input 
                                    type="radio" 
                                    name="rehire" 
                                    value="yes" 
                                    checked={form.would_rehire === 'yes'}
                                    onChange={e => setForm({...form, would_rehire: e.target.value})}
                                /> Yes, definitely
                            </label>
                            <label className="radio-label">
                                <input 
                                    type="radio" 
                                    name="rehire" 
                                    value="yes_with_reservations" 
                                    checked={form.would_rehire === 'yes_with_reservations'}
                                    onChange={e => setForm({...form, would_rehire: e.target.value})}
                                /> Yes, but with reservations
                            </label>
                            <label className="radio-label">
                                <input 
                                    type="radio" 
                                    name="rehire" 
                                    value="no" 
                                    checked={form.would_rehire === 'no'}
                                    onChange={e => setForm({...form, would_rehire: e.target.value})}
                                /> No
                            </label>
                        </div>
                    </div>

                    <div className="form-footer">
                        <button type="submit" className="btn-submit" disabled={submitting}>
                            {submitting ? 'Submitting...' : <>Submit Reference <Send size={18} /></>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
