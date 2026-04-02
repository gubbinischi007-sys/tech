import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { applicantsApi, interviewsApi, employeesApi, referencesApi } from '../services/api';
import { format } from 'date-fns';
import { ArrowLeft, Mail, Phone, Calendar, Briefcase, FileText, Video, CheckCircle, Info, AlertTriangle, X, UserPlus, Star } from 'lucide-react';
import { logAction, logApplicationDecision } from '../utils/historyLogger';
import ConfirmationModal from '../components/ConfirmationModal';
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
  rating?: number;
  feedback?: string;
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
  const [activeScorecardId, setActiveScorecardId] = useState<string | null>(null);
  const [references, setReferences] = useState<any[]>([]);
  const [showReferenceForm, setShowReferenceForm] = useState(false);
  const [referenceForm, setReferenceForm] = useState({
    ref_name: '',
    ref_email: '',
    relationship: ''
  });
  const [scorecardForm, setScorecardForm] = useState({ rating: 0, feedback: '' });
  const generateMeetLink = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `https://meet.google.com/${rand(3)}-${rand(4)}-${rand(3)}`;
  };

  const [interviewForm, setInterviewForm] = useState({
    scheduled_at: '',
    type: 'online',
    meeting_link: generateMeetLink(),
    notes: '',
  });
  const [offerForm, setOfferForm] = useState({
    salary: '',
    joining_date: '',
    notes: '',
    rules: COMMON_COMPANY_RULES,
  });
  const [cancelInterviewId, setCancelInterviewId] = useState<string | null>(null);
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
      const [applicantRes, interviewsRes, referencesRes] = await Promise.all([
        applicantsApi.getById(id),
        interviewsApi.getAll({ applicant_id: id }),
        referencesApi.getByApplicant(id)
      ]);
      setApplicant(applicantRes.data);
      setInterviews(interviewsRes.data);
      setReferences(referencesRes.data);
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
      // Auto-update stage to Recommended when offer is sent
      await applicantsApi.update(id, { stage: 'recommended' });
      setShowOfferForm(false);
      logAction(`Sent offer to ${applicant?.first_name} ${applicant?.last_name} and moved to Recommended stage`);
      addNotification('success', 'Offer letter sent! Stage updated to Recommended.');
      loadData();
    } catch (error) {
      console.error('Failed to send offer:', error);
      addNotification('error', 'Failed to send offer');
    }
  };


  const handleStageUpdate = async (newStage: string) => {
    if (!id) return;
    try {
      let rejectionReason = undefined;
      if (newStage === 'rejected' || newStage === 'declined') {
        const promptResult = window.prompt("Please provide a reason for rejection (this will be sent to the candidate):");
        if (promptResult === null) return; // user cancelled
        rejectionReason = promptResult;
      }

      await applicantsApi.update(id, { stage: newStage, rejection_reason: rejectionReason });
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

    // Validate working hours before submitting
    if (interviewForm.scheduled_at) {
      const dt = new Date(interviewForm.scheduled_at);
      const day = dt.getDay();
      const totalMins = dt.getHours() * 60 + dt.getMinutes();
      let blocked = false;
      if (day === 0) blocked = true;
      else if (day >= 1 && day <= 5 && (totalMins < 9 * 60 || totalMins >= 17 * 60)) blocked = true;
      else if (day === 6 && (totalMins < 10 * 60 || totalMins > 12 * 60 + 30)) blocked = true;
      if (blocked) {
        addNotification('error', 'Please select a time within working hours (Mon–Fri 9 AM–5 PM, Sat 10 AM–12:30 PM).');
        return;
      }
    }

    try {
      await interviewsApi.create({
        applicant_id: id,
        job_id: applicant.job_id,
        ...interviewForm,
      });

      // Auto-update stage to Shortlisted ONLY if they are still in Applied
      if (applicant.stage.toLowerCase() === 'applied') {
        await applicantsApi.update(id, { stage: 'shortlisted' });
        logAction(`Scheduled ${interviewForm.type} interview for ${applicant.first_name} ${applicant.last_name} and moved to Shortlisted stage`);
      } else {
        logAction(`Scheduled ${interviewForm.type} interview for ${applicant.first_name} ${applicant.last_name}`);
      }

      setShowInterviewForm(false);
      setInterviewForm({
        scheduled_at: '',
        type: 'online',
        meeting_link: '',
        notes: '',
      });
      addNotification('success', 'Interview scheduled! Stage updated to Shortlisted.');
      loadData();
    } catch (error) {
      console.error('Failed to create interview:', error);
      addNotification('error', 'Failed to create interview');
    }
  };

  const handleSubmitScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScorecardId || scorecardForm.rating === 0) {
      addNotification('error', 'Please select a rating (1-5 stars)');
      return;
    }
    try {
      await interviewsApi.update(activeScorecardId, {
        status: 'completed',
        rating: scorecardForm.rating,
        feedback: scorecardForm.feedback,
      });
      logAction(`Submitted interview scorecard for ${applicant?.first_name} ${applicant?.last_name} with rating ${scorecardForm.rating}/5`);
      if (scorecardForm.rating >= 4) {
        addNotification('success', 'Scorecard submitted! High rating auto-promoted candidate to Recommended.');
      } else {
        addNotification('success', 'Scorecard correctly submitted.');
      }
      setActiveScorecardId(null);
      setScorecardForm({ rating: 0, feedback: '' });
      loadData();
    } catch (error) {
      console.error('Failed to submit scorecard:', error);
      addNotification('error', 'Failed to submit scorecard');
    }
  };

  const requestCancelInterview = (interviewId: string) => {
    setCancelInterviewId(interviewId);
  };

  const handleConfirmCancelInterview = async () => {
    if (!cancelInterviewId) return;
    try {
      await interviewsApi.update(cancelInterviewId, { status: 'cancelled' });
      logAction(`Cancelled interview for ${applicant?.first_name} ${applicant?.last_name}`);
      addNotification('success', 'Interview cancelled. Applicant has been notified.');
      loadData();
    } catch (error) {
      console.error('Failed to cancel interview:', error);
      addNotification('error', 'Failed to cancel interview');
    } finally {
      setCancelInterviewId(null);
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

  const handleReferenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await referencesApi.request({
        applicant_id: id,
        ...referenceForm
      });
      addNotification('success', 'Reference request sent successfully!');
      setShowReferenceForm(false);
      setReferenceForm({ ref_name: '', ref_email: '', relationship: '' });
      loadData();
    } catch (error) {
      console.error('Failed to request reference:', error);
      addNotification('error', 'Failed to send reference request');
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
                  if (applicant.resume_url?.includes('storage.apexrecruit.com')) {
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
                      doc.text('Generated by ApexRecruit Applicant Tracking System', 105, 280, { align: 'center' });

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
              disabled={
                applicant.stage === 'hired' ||
                applicant.offer_status === 'accepted' ||
                ['rejected', 'declined', 'withdrawn'].includes(applicant.stage.toLowerCase())
              }
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

        <div className="card reference-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Reference Checks</h2>
            <button 
              className="btn btn-sm btn-primary"
              onClick={() => setShowReferenceForm(true)}
            >
              Request Reference
            </button>
          </div>

          {references.length === 0 ? (
            <p className="text-muted text-center py-4">No references requested yet.</p>
          ) : (
            <div className="references-list">
              {references.map((ref) => (
                <div key={ref.id} className="reference-item">
                  <div className="ref-item-header">
                    <div>
                      <h3 className="text-sm font-semibold">{ref.ref_name}</h3>
                      <p className="text-xs text-muted">{ref.ref_email}</p>
                    </div>
                    <span className={`status-badge-small ${ref.status}`}>
                      {ref.status}
                    </span>
                  </div>
                  
                  {ref.status === 'submitted' && ref.responses && (
                    <div className="ref-response-preview">
                      <div className="rating-small">
                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                        <span>Competency: {ref.responses.competency_rating}/5</span>
                      </div>
                      <p className="text-xs italic text-gray-400 line-clamp-2">
                        "{ref.responses.strengths}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
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
                <label className="form-label-sm">Date &amp; Time</label>
                <input
                  type="datetime-local"
                  id="interview-date-applicant"
                  value={interviewForm.scheduled_at}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    if (interviewForm.type === 'online' && newDate) {
                      const calUser = import.meta.env.VITE_CALCOM_USERNAME || 'nischitha-l-35mch5';
                      const calEvent = import.meta.env.VITE_CALCOM_EVENT || '30minz';
                      const params = new URLSearchParams();
                      if (applicant?.first_name || applicant?.last_name) params.set('name', `${applicant.first_name} ${applicant.last_name}`.trim());
                      if (applicant?.email) params.set('email', applicant.email);
                      const dt = new Date(newDate);
                      params.set('date', dt.toISOString().split('T')[0]);
                      params.set('time', dt.toTimeString().slice(0, 5));
                      setInterviewForm({ ...interviewForm, scheduled_at: newDate, meeting_link: `https://cal.com/${calUser}/${calEvent}?${params.toString()}` });
                    } else {
                      setInterviewForm({ ...interviewForm, scheduled_at: newDate });
                    }
                  }}
                  required
                  className="form-input-sm"
                  style={{ width: '100%' }}
                />
                {!interviewForm.scheduled_at ? (
                  <p style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: '#64748b', lineHeight: 1.6 }}>
                    🕐 <strong style={{ color: '#94a3b8' }}>Mon–Fri 9:00 AM – 5:00 PM</strong> &nbsp;|&nbsp; <strong style={{ color: '#94a3b8' }}>Sat 10:00 AM – 12:30 PM</strong> &nbsp;|&nbsp; Sun closed
                  </p>
                ) : (() => {
                  const dt = new Date(interviewForm.scheduled_at);
                  const day = dt.getDay();
                  const mins = dt.getHours() * 60 + dt.getMinutes();
                  if (day === 0 || (day >= 1 && day <= 5 && (mins < 540 || mins >= 1020)) || (day === 6 && (mins < 600 || mins > 750))) {
                    const msg = day === 0 ? 'Interviews cannot be scheduled on Sundays.' : day === 6 ? 'Sat slots: 10:00 AM – 12:30 PM only.' : 'Mon–Fri slots: 9:00 AM – 5:00 PM only.';
                    return <p style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: '#f97316' }}>⚠️ {msg}</p>;
                  }
                  return <p style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: '#10b981' }}>✓ Within working hours</p>;
                })()}
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label-sm">Type</label>
                <select
                  value={interviewForm.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    if (newType === 'online') {
                      // Build Cal.com booking link pre-filled with candidate info + date
                      const calUser = import.meta.env.VITE_CALCOM_USERNAME || 'nischitha-l-35mch5';
                      const calEvent = import.meta.env.VITE_CALCOM_EVENT || '30minz';
                      const params = new URLSearchParams();
                      if (applicant?.first_name || applicant?.last_name) params.set('name', `${applicant.first_name} ${applicant.last_name}`.trim());
                      if (applicant?.email) params.set('email', applicant.email);
                      if (interviewForm.scheduled_at) {
                        const dt = new Date(interviewForm.scheduled_at);
                        params.set('date', dt.toISOString().split('T')[0]);
                        params.set('time', dt.toTimeString().slice(0, 5));
                      }
                      const calLink = `https://cal.com/${calUser}/${calEvent}?${params.toString()}`;
                      setInterviewForm({ ...interviewForm, type: newType, meeting_link: calLink });
                    } else {
                      setInterviewForm({ ...interviewForm, type: newType, meeting_link: '' });
                    }
                  }}
                  className="form-select-sm"
                >
                  <option value="online">Online (Cal.com)</option>
                  <option value="in-person">In-Person</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Meeting Link
                  {interviewForm.type === 'online' && interviewForm.meeting_link && (
                    <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '99px', padding: '1px 8px', fontWeight: 600 }}>
                      ✓ Cal.com
                    </span>
                  )}
                </label>
                {interviewForm.type === 'online' ? (
                  interviewForm.meeting_link ? (
                    <a
                      href={interviewForm.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="form-input-sm"
                      style={{
                        display: 'block', width: '100%', color: '#34d399',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.06)',
                        border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px',
                        textDecoration: 'none', fontSize: '0.8rem'
                      }}
                    >
                      🔗 {interviewForm.meeting_link}
                    </a>
                  ) : (
                    <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.3rem' }}>
                      Select a date &amp; time first to generate the Cal.com link.
                    </p>
                  )
                ) : (
                  <input
                    type="text"
                    value={interviewForm.meeting_link}
                    onChange={(e) => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })}
                    placeholder="Location / address"
                    className="form-input-sm"
                    style={{ width: '100%' }}
                  />
                )}
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
                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setActiveScorecardId(interview.id)}
                        className="btn btn-sm btn-success flex items-center gap-1"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        <CheckCircle size={14} /> Submit Review
                      </button>
                      <button
                        onClick={() => requestCancelInterview(interview.id)}
                        className="btn btn-sm"
                        style={{ background: '#ef4444', padding: '6px 12px', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
                        title="Cancel Interview"
                      >
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  )}
                  {interview.status === 'completed' && interview.rating !== undefined && (
                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={14} fill={star <= interview.rating! ? '#fbbf24' : 'none'} color={star <= interview.rating! ? '#fbbf24' : '#6b7280'} />
                        ))}
                      </div>
                      {interview.feedback && <p className="text-sm text-gray-400 mt-1">{interview.feedback}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowInterviewForm(!showInterviewForm)}
              disabled={['rejected', 'declined', 'withdrawn'].includes(applicant.stage.toLowerCase())}
            >
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

      {/* Reference Request Modal */}
      {showReferenceForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Request Reference</h3>
              <button onClick={() => setShowReferenceForm(false)} className="btn-icon">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleReferenceSubmit}>
              <div className="form-group">
                <label>Reference Name</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  value={referenceForm.ref_name}
                  onChange={e => setReferenceForm({...referenceForm, ref_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Reference Email</label>
                <input 
                  type="email" 
                  required 
                  className="form-input" 
                  value={referenceForm.ref_email}
                  onChange={e => setReferenceForm({...referenceForm, ref_email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Relationship (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Former Manager" 
                  className="form-input" 
                  value={referenceForm.relationship}
                  onChange={e => setReferenceForm({...referenceForm, relationship: e.target.value})}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReferenceForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Existing Confirmation Modals */}
      {cancelInterviewId && (
        <ConfirmationModal
          isOpen={cancelInterviewId !== null}
          title="Cancel Interview?"
          message="Are you sure you want to cancel this interview? An automated email will be sent to the candidate."
          confirmLabel="Yes, Cancel"
          type="danger"
          onConfirm={handleConfirmCancelInterview}
          onClose={() => setCancelInterviewId(null)}
        />
      )}

      {activeScorecardId && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-container" style={{ maxWidth: '400px' }}>
            <div className="premium-modal-content">
              <div className="modal-header">
                <div className="modal-header-icon icon-bg-accept" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h3 className="modal-title">Submit Review</h3>
                  <p className="modal-subtitle">Rate candidates performance and provide feedback.</p>
                </div>
              </div>

              <form onSubmit={handleSubmitScorecard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ textAlign: 'center' }}>Rating (1-5)</label>
                  <div className="flex justify-center gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setScorecardForm({ ...scorecardForm, rating: star })}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem',
                          color: scorecardForm.rating >= star ? '#fbbf24' : '#6b7280'
                        }}
                      >
                        <Star size={32} fill={scorecardForm.rating >= star ? '#fbbf24' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group mt-4">
                  <label className="form-label">Feedback Notes</label>
                  <textarea
                    required
                    value={scorecardForm.feedback}
                    onChange={(e) => setScorecardForm({ ...scorecardForm, feedback: e.target.value })}
                    placeholder="Share your thoughts on the candidate..."
                    className="form-textarea"
                    rows={4}
                  />
                </div>
                <div className="modal-actions mt-4">
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveScorecardId(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981' }}>Submit Scorecard</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
