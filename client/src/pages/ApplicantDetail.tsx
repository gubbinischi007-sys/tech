import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { applicantsApi, interviewsApi, employeesApi } from '../services/api';
import { format } from 'date-fns';
import { ArrowLeft, Mail, Phone, Calendar, Briefcase, FileText, Video, CheckCircle, Info, AlertTriangle, X, UserPlus } from 'lucide-react';
import { logAction, logApplicationDecision } from '../utils/historyLogger';
import './ApplicantDetail.css';

const COMMON_COMPANY_RULES = `1. Code of Conduct: All employees are expected to maintain the highest standards of professional conduct and ethics.
2. Working Hours: Standard office hours are 9:00 AM to 6:00 PM, Monday to Friday, with a 1-hour lunch break.
3. Confidentiality: You agree to protect all proprietary and confidential information of the company.
4. Intellectual Property: All work created during your employment shall be the sole property of the company.
5. Probation Period: A standard 3-month probation period applies from the date of joining.
6. Termination: Employment can be terminated by either party with a written notice as per company policy.`;

interface Applicant {
  id: string;
  job_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  cover_letter?: string;
  stage: string;
  status: string;
  applied_at: string;
  job_title?: string;
  offer_salary?: string;
  offer_joining_date?: string;
  offer_status?: string;
  offer_notes?: string;
  offer_rules?: string;
  offer_sent_at?: string;
}

interface Interview {
  id: string;
  scheduled_at: string;
  type: string;
  meeting_link?: string;
  notes?: string;
  status: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function ApplicantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    scheduled_at: '',
    type: 'online',
    meeting_link: '',
    notes: '',
  });
  const [offerForm, setOfferForm] = useState({
    salary: '',
    joining_date: '',
    notes: '',
    rules: COMMON_COMPANY_RULES,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      const [applicantRes, interviewsRes] = await Promise.all([
        applicantsApi.getById(id),
        interviewsApi.getAll({ applicant_id: id }),
      ]);
      setApplicant(applicantRes.data);
      setInterviews(interviewsRes.data);
    } catch (error) {
      console.error('Failed to load applicant details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await applicantsApi.sendOffer(id, offerForm);
      setShowOfferForm(false);
      logAction(`Sent offer to ${applicant?.first_name} ${applicant?.last_name}`);
      addNotification('success', 'Offer letter sent successfully!');
      loadData();
    } catch (error) {
      console.error('Failed to send offer:', error);
      addNotification('error', 'Failed to send offer');
    }
  };


  const handleStageUpdate = async (newStage: string) => {
    if (!id) return;
    try {
      await applicantsApi.update(id, { stage: newStage });
      logAction(`Updated applicant ${applicant?.first_name} ${applicant?.last_name} to ${newStage}`);
      loadData();
    } catch (error) {
      console.error('Failed to update applicant stage:', error);
      addNotification('error', 'Failed to update applicant stage');
    }
  };

  const handleInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !applicant) return;

    try {
      await interviewsApi.create({
        applicant_id: id,
        job_id: applicant.job_id,
        ...interviewForm,
      });
      setShowInterviewForm(false);
      setInterviewForm({
        scheduled_at: '',
        type: 'online',
        meeting_link: '',
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Failed to create interview:', error);
      addNotification('error', 'Failed to create interview');
    }
  };

  const handleCancelInterview = async (interviewId: string) => {
    if (!window.confirm("Are you sure you want to cancel this interview? This will send a notification email to the applicant.")) return;
    try {
      await interviewsApi.update(interviewId, { status: 'cancelled' });
      addNotification('success', 'Interview cancelled. Applicant has been notified.');
      loadData();
    } catch (error) {
      console.error('Failed to cancel interview:', error);
      addNotification('error', 'Failed to cancel interview');
    }
  };

  const handleOnboard = async () => {
    if (!applicant) return;
    try {
      const cleanName = (n: string) => {
        if (!n) return '';
        let name = n.trim().toLowerCase();
        // Remove redundant leading character if it's a double-start (like pprabs)
        if (name.match(/^([a-z])\1/)) name = name.substring(1);
        return name.charAt(0).toUpperCase() + name.slice(1);
      };

      await employeesApi.create({
        applicant_id: applicant.id,
        name: `${cleanName(applicant.first_name)} ${cleanName(applicant.last_name)}`,
        email: applicant.email,
        job_title: applicant.job_title,
        department: 'Engineering', // Default or could be dynamic
        hired_date: applicant.offer_joining_date || new Date().toISOString(),
        status: 'active'
      });
      addNotification('success', 'Candidate successfully onboarded as employee!');
      logAction(`Onboarded ${applicant.first_name} ${applicant.last_name} as employee`);
      await logApplicationDecision({
        name: `${applicant.first_name} ${applicant.last_name}`,
        email: applicant.email,
        job_title: applicant.job_title || 'Candidate',
        status: 'Accepted',
        reason: 'Candidate onboarded as employee.'
      });

      // Remove from applicants table as they are now an employee
      await applicantsApi.delete(applicant.id);

      // Could navigate to employees page
      setTimeout(() => navigate('/admin/employees'), 2000);
    } catch (error: any) {
      console.error('Failed to onboard employee:', error);
      addNotification('error', error.response?.data?.error || 'Failed to onboard employee');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading...</div>;
  }

  if (!applicant) {
    return <div className="p-8 text-center text-muted">Applicant not found</div>;
  }

  return (
    <div className="applicant-detail-page">
      <div className="detail-header">
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/admin/applicants')}
          style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} /> Back to Applicants
        </button>
        <h1 className="applicant-name">
          {(() => {
            const cleanName = (n: string) => {
              if (!n) return '';
              let name = n.trim().toLowerCase();
              if (name.match(/^([a-z])\1/)) name = name.substring(1);
              return name.charAt(0).toUpperCase() + name.slice(1);
            };
            return `${cleanName(applicant.first_name)} ${cleanName(applicant.last_name)}`;
          })()}
        </h1>
        <p className="text-muted">Applicant Details & Interview Management</p>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h2 className="section-title">Contact Information</h2>

          <div className="info-row">
            <span className="info-label"><Mail size={16} style={{ display: 'inline', marginRight: '8px' }} /> Email:</span>
            <span className="info-value">{applicant.email}</span>
          </div>

          {applicant.phone && (
            <div className="info-row">
              <span className="info-label"><Phone size={16} style={{ display: 'inline', marginRight: '8px' }} /> Phone:</span>
              <span className="info-value">{applicant.phone}</span>
            </div>
          )}

          <div className="info-row">
            <span className="info-label"><Briefcase size={16} style={{ display: 'inline', marginRight: '8px' }} /> Applied for:</span>
            <Link to={`/admin/jobs/${applicant.job_id}`} style={{ color: '#6366f1' }}>
              {applicant.job_title || 'Job'}
            </Link>
          </div>

          <div className="info-row">
            <span className="info-label"><Calendar size={16} style={{ display: 'inline', marginRight: '8px' }} /> Applied on:</span>
            <span className="info-value">{new Date(applicant.applied_at).toLocaleDateString()}</span>
          </div>

          <div className="info-row" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
            <span className="info-label" style={{ minWidth: 'auto', marginRight: '1rem' }}>Current Stage:</span>
            <select
              value={applicant.stage}
              onChange={(e) => handleStageUpdate(e.target.value)}
              className="status-select"
            >
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="recommended">Recommended</option>
              <option value="hired">Hired</option>
              <option value="declined">Declined</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          {applicant.resume_url && (
            <div className="info-row" style={{ marginTop: '1rem' }}>
              <span className="info-label">Resume:</span>
              <button
                onClick={async () => {
                  if (applicant.resume_url?.includes('storage.smart-cruiter.com')) {
                    // GENERATE DYNAMIC RESUME
                    try {
                      // @ts-ignore
                      const { jsPDF } = await import('jspdf');
                      const doc = new jsPDF();

                      // Header / Name
                      doc.setFontSize(24);
                      doc.setTextColor(33, 33, 33);
                      doc.setFont('helvetica', 'bold');
                      const cleanName = (n: string) => {
                        if (!n) return '';
                        let name = n.trim().toLowerCase();
                        if (name.match(/^([a-z])\1/)) name = name.substring(1);
                        return name.charAt(0).toUpperCase() + name.slice(1);
                      };
                      doc.text(`${cleanName(applicant.first_name)} ${cleanName(applicant.last_name)}`, 20, 20);

                      // Contact Info
                      doc.setFontSize(10);
                      doc.setFont('helvetica', 'normal');
                      doc.setTextColor(100, 100, 100);
                      doc.text(`${applicant.email} | ${applicant.phone || '555-0123'} | ${applicant.job_title || 'Candidate'}`, 20, 27);

                      // Horizontal Line
                      doc.setDrawColor(200, 200, 200);
                      doc.line(20, 32, 190, 32);

                      // Summary Section
                      doc.setFontSize(12);
                      doc.setFont('helvetica', 'bold');
                      doc.setTextColor(63, 81, 181); // Primary color tone
                      doc.text('PROFESSIONAL SUMMARY', 20, 45);

                      doc.setFontSize(10);
                      doc.setTextColor(50, 50, 50);
                      doc.setFont('helvetica', 'normal');
                      const summaryText = `Motivated and experienced ${applicant.job_title || 'professional'} with a strong background in delivering high-quality results. Proven track record of success in fast-paced environments. Dedicated to continuous learning and contributing to team success.`;
                      const splitSummary = doc.splitTextToSize(summaryText, 170);
                      doc.text(splitSummary, 20, 52);

                      // Experience Section
                      doc.setFontSize(12);
                      doc.setFont('helvetica', 'bold');
                      doc.setTextColor(63, 81, 181);
                      doc.text('EXPERIENCE', 20, 70);

                      // Job 1
                      doc.setFontSize(11);
                      doc.setTextColor(33, 33, 33);
                      doc.text(`Senior ${applicant.job_title || 'Analyst'}`, 20, 78);
                      doc.setFontSize(10);
                      doc.setTextColor(100, 100, 100);
                      doc.setFont('helvetica', 'italic');
                      doc.text('Tech Solutions Inc. | Jan 2020 - Present', 190, 78, { align: 'right' });

                      doc.setFont('helvetica', 'normal');
                      doc.setTextColor(50, 50, 50);
                      const exp1 = [
                        "• Led cross-functional teams to deliver key project milestones 20% ahead of schedule.",
                        "• Implemented new processes that increased departmental efficiency by 15%.",
                        "• Mentored junior team members and conducted code reviews."
                      ];
                      let yPos = 85;
                      exp1.forEach(line => {
                        doc.text(line, 25, yPos);
                        yPos += 6;
                      });

                      // Job 2
                      doc.setFontSize(11);
                      doc.setTextColor(33, 33, 33);
                      doc.setFont('helvetica', 'bold');
                      doc.text(`Junior ${applicant.job_title || 'Developer'}`, 20, 110);
                      doc.setFontSize(10);
                      doc.setTextColor(100, 100, 100);
                      doc.setFont('helvetica', 'italic');
                      doc.text('StartUp Innovations | Jun 2018 - Dec 2019', 190, 110, { align: 'right' });

                      doc.setFont('helvetica', 'normal');
                      doc.setTextColor(50, 50, 50);
                      const exp2 = [
                        "• Collaborated with product managers to define requirements.",
                        "• Developed and maintained scalable backend services.",
                        "• Resolved critical bugs improving system stability."
                      ];
                      yPos = 117;
                      exp2.forEach(line => {
                        doc.text(line, 25, yPos);
                        yPos += 6;
                      });

                      // Education Section
                      doc.setFontSize(12);
                      doc.setFont('helvetica', 'bold');
                      doc.setTextColor(63, 81, 181);
                      doc.text('EDUCATION', 20, 145);

                      doc.setFontSize(11);
                      doc.setTextColor(33, 33, 33);
                      doc.text('Bachelor of Science in Computer Science', 20, 153);
                      doc.setFontSize(10);
                      doc.setTextColor(100, 100, 100);
                      doc.setFont('helvetica', 'italic');
                      doc.text('State University | 2014 - 2018', 190, 153, { align: 'right' });

                      // Footer
                      doc.setFontSize(8);
                      doc.setTextColor(150, 150, 150);
                      doc.text('Generated by Smart-Cruiter Applicant Tracking System', 105, 280, { align: 'center' });

                      // Open PDF
                      const pdfBlob = doc.output('bloburl');
                      window.open(pdfBlob, '_blank');

                    } catch (error) {
                      console.error("Failed to generate resume:", error);
                      addNotification('error', "Could not generate resume preview.");
                    }
                  } else if (applicant.resume_url) {
                    window.open(applicant.resume_url, '_blank');
                  }
                }}
                className="btn btn-sm btn-outline"
                style={{ cursor: 'pointer' }}
              >
                View Resume
              </button>
            </div>
          )}

          {applicant.offer_status && (
            <div className={`info-row offer-status-box ${applicant.offer_status}`} style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.5rem', background: applicant.offer_status === 'accepted' ? 'rgba(16, 185, 129, 0.1)' : applicant.offer_status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', border: `1px solid ${applicant.offer_status === 'accepted' ? '#10b981' : applicant.offer_status === 'rejected' ? '#ef4444' : '#f59e0b'}` }}>
              <span className="info-label" style={{ fontWeight: 'bold', color: applicant.offer_status === 'accepted' ? '#10b981' : applicant.offer_status === 'rejected' ? '#ef4444' : '#f59e0b' }}>
                Offer Status: {applicant.offer_status.toUpperCase()}
              </span>
              <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                <p><strong>Salary:</strong> {applicant.offer_salary}</p>
                <p><strong>Joining Date:</strong> {applicant.offer_joining_date}</p>
                {applicant.offer_notes && <p><strong>Notes/Benefits:</strong> {applicant.offer_notes}</p>}
                {applicant.offer_rules && (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <p><strong>Rules & Regulations:</strong></p>
                    <p style={{ fontSize: '0.75rem', opacity: 0.8, whiteSpace: 'pre-wrap' }}>{applicant.offer_rules}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowOfferForm(true)}
              disabled={applicant.stage === 'hired' || applicant.offer_status === 'accepted'}
              style={{ width: '100%' }}
            >
              {applicant.offer_sent_at ? 'Resend Offer' : 'Send Offer Letter'}
            </button>

            {(applicant.stage === 'hired' || applicant.offer_status === 'accepted') && (
              <button
                className="btn btn-success"
                onClick={handleOnboard}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  fontWeight: 'bold'
                }}
              >
                <UserPlus size={18} /> Onboard as Employee
              </button>
            )}
          </div>



          {applicant.cover_letter && (
            <div style={{ marginTop: '2rem' }}>
              <span className="info-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                <FileText size={16} style={{ display: 'inline', marginRight: '8px' }} /> Cover Letter
              </span>
              <div className="cover-letter-box">
                {applicant.cover_letter}
              </div>
            </div>
          )}
        </div>

        <div className="card interview-card">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Interviews</h2>
          </div>

          {showInterviewForm && (
            <form onSubmit={handleInterviewSubmit} className="interview-form">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label-sm">Date & Time</label>
                <input
                  type="datetime-local"
                  value={interviewForm.scheduled_at}
                  onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_at: e.target.value })}
                  required
                  className="form-input-sm"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label-sm">Type</label>
                <select
                  value={interviewForm.type}
                  onChange={(e) => setInterviewForm({ ...interviewForm, type: e.target.value })}
                  className="form-select-sm"
                >
                  <option value="online">Online</option>
                  <option value="in-person">In-Person</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label-sm">Meeting Link</label>
                <input
                  type="text"
                  value={interviewForm.meeting_link}
                  onChange={(e) => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })}
                  placeholder="https://..."
                  className="form-input-sm"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label-sm">Notes</label>
                <textarea
                  value={interviewForm.notes}
                  onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                  rows={3}
                  className="form-textarea-sm"
                />
              </div>
              <div style={{ display: 'flex', marginTop: '24px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowInterviewForm(false)}
                  style={{
                    width: 'fit-content',
                    height: '36px',
                    boxSizing: 'border-box',
                    fontSize: '13px',
                    padding: '0 16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'translateY(1px)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{
                    width: 'fit-content',
                    height: '36px',
                    boxSizing: 'border-box',
                    border: '1px solid transparent',
                    fontSize: '13px',
                    padding: '0 16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'translateY(-1px)'
                  }}
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          )}

          {interviews.length === 0 && !showInterviewForm ? (
            <div className="empty-interviews">
              <p className="text-muted text-center py-4">No interviews scheduled yet.</p>
            </div>
          ) : !showInterviewForm ? (
            <div className="interviews-list-container">
              {interviews.map((interview) => (
                <div key={interview.id} className="interview-item">
                  <div className="interview-time">
                    {format(new Date(interview.scheduled_at), 'MMM d, yyyy @ h:mm a')}
                  </div>
                  <div className="interview-meta">
                    <Video size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {interview.type} • <span style={{ textTransform: 'capitalize' }}>{interview.status}</span>
                  </div>
                  {interview.meeting_link && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
                        Join Meeting →
                      </a>
                    </div>
                  )}
                  {interview.status === 'scheduled' && (
                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                      <button
                        onClick={() => handleCancelInterview(interview.id)}
                        className="btn btn-sm"
                        style={{ background: '#ef4444', padding: '6px 12px', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
                        title="Cancel Interview"
                      >
                        <X size={14} /> Cancel Interview
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowInterviewForm(!showInterviewForm)}>
              {showInterviewForm ? 'Cancel' : 'Schedule Interview'}
            </button>
          </div>
        </div>
      </div>

      {showOfferForm && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-container" style={{ maxWidth: '500px' }}>
            <div className="premium-modal-content">
              <div className="modal-header">
                <div className="modal-header-icon icon-bg-accept" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1' }}>
                  <Briefcase size={24} />
                </div>
                <h3 className="modal-title">Create Offer Letter</h3>
              </div>

              <form onSubmit={handleOfferSubmit} style={{ marginTop: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="modal-form-label">Annual Salary (CTC)</label>
                  <input
                    type="text"
                    className="modal-textarea"
                    placeholder="e.g. $120,000 or ₹15,00,000"
                    value={offerForm.salary}
                    onChange={(e) => setOfferForm({ ...offerForm, salary: e.target.value })}
                    required
                    style={{ height: '45px', padding: '0 12px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="modal-form-label">Joining Date</label>
                  <input
                    type="date"
                    className="modal-textarea"
                    value={offerForm.joining_date}
                    onChange={(e) => setOfferForm({ ...offerForm, joining_date: e.target.value })}
                    required
                    style={{ height: '45px', padding: '0 12px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="modal-form-label">Additional Benefits/Notes</label>
                  <textarea
                    className="modal-textarea"
                    rows={2}
                    placeholder="e.g. Health insurance, Stock options, Performance bonus..."
                    value={offerForm.notes}
                    onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="modal-form-label">Company Rules & Regulations</label>
                  <textarea
                    className="modal-textarea"
                    rows={4}
                    placeholder="Company rules..."
                    value={offerForm.rules}
                    onChange={(e) => setOfferForm({ ...offerForm, rules: e.target.value })}
                  />
                </div>

                <div className="modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
                  <button
                    type="button"
                    onClick={() => setShowOfferForm(false)}
                    className="modal-btn btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-btn btn-confirm-accept"
                    style={{ background: '#6366f1' }}
                  >
                    Send Offer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {notifications.map((notification) => (
          <div key={notification.id} className={`toast toast-${notification.type}`}>
            <div className="toast-icon">
              {notification.type === 'success' ? <CheckCircle size={20} /> :
                notification.type === 'error' ? <AlertTriangle size={20} /> :
                  <Info size={20} />}
            </div>
            <span>{notification.message}</span>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, marginLeft: 'auto', display: 'flex' }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

