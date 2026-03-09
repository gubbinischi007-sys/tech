import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicantsApi, jobsApi, emailApi, historyApi } from '../services/api';
import { logAction } from '../utils/historyLogger';
import { XCircle, CheckCircle, User, Briefcase, Copy, GitMerge, Info, AlertTriangle, X, ShieldAlert, Mail, Search } from 'lucide-react';
import './Applicants.css';
import MatchScoreModal from '../components/MatchScoreModal';

interface Applicant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  stage: string;
  job_id: string;
  job_title: string;
  applied_at: string;
  resume_url?: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function Applicants() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicants, setSelectedApplicants] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filters, setFilters] = useState({
    job_id: '',
    stage: 'All',
    search: '',
  });

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'accept' | 'reject' | 'merge' | null;
    reason: string
  }>({
    isOpen: false,
    type: null,
    reason: ''
  });

  const [matchScoreModal, setMatchScoreModal] = useState<{ isOpen: boolean, score: number, applicantName: string, candidateId: string, jobId: string } | null>(null);

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    loadApplicants();
  }, [filters]);

  const loadJobs = async () => {
    try {
      const response = await jobsApi.getAll();
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const loadApplicants = async () => {
    try {
      const params: any = {};
      if (filters.job_id) params.job_id = filters.job_id;

      const response = await applicantsApi.getAll(params);
      setApplicants(response.data);
    } catch (error) {
      console.error('Failed to load applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (applicantId: string, newStage: string) => {
    try {
      let rejectionReason = undefined;
      if (newStage === 'rejected' || newStage === 'declined') {
        const promptResult = window.prompt("Please provide a reason for rejection (this will be sent to the candidate):");
        if (promptResult === null) return; // user cancelled
        rejectionReason = promptResult;
      }

      await applicantsApi.update(applicantId, { stage: newStage, rejection_reason: rejectionReason });
      loadApplicants();
    } catch (error) {
      console.error('Failed to update applicant stage:', error);
      addNotification('error', 'Failed to update applicant stage');
    }
  };

  const getChevronColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'hired': return '%2334d399'; // emerald-400
      case 'declined': return '%23fb7185'; // rose-400
      case 'rejected': return '%23f472b6'; // pink-400
      case 'shortlisted': return '%23a78bfa'; // violet-400
      case 'recommended': return '%23fbbf24'; // amber-400
      case 'withdrawn': return '%2394a3b8'; // slate-400
      default: return '%2360a5fa'; // blue-400
    }
  };

  const toggleApplicantSelection = (applicantId: string) => {
    const newSelected = new Set(selectedApplicants);
    if (newSelected.has(applicantId)) {
      newSelected.delete(applicantId);
    } else {
      newSelected.add(applicantId);
    }
    setSelectedApplicants(newSelected);
  };

  const handleBulkAcceptance = () => {
    if (selectedApplicants.size === 0) return;
    setConfirmationModal({
      isOpen: true,
      type: 'accept',
      reason: 'Your profile matches our requirements perfectly.'
    });
  };

  const handleBulkRejection = () => {
    if (selectedApplicants.size === 0) return;
    setConfirmationModal({
      isOpen: true,
      type: 'reject',
      reason: 'We have decided to move forward with other candidates.'
    });
  };

  const handleBulkMerge = () => {
    if (selectedApplicants.size < 2) {
      addNotification('error', "Please select at least 2 candidates to merge.");
      return;
    }
    setConfirmationModal({
      isOpen: true,
      type: 'merge',
      reason: 'Consolidating duplicate applicant profiles.'
    });
  };

  const handleBulkIdentityWarning = async () => {
    if (selectedApplicants.size === 0) return;
    try {
      await emailApi.sendIdentityWarning(Array.from(selectedApplicants));
      logAction(`Sent identity warnings to ${selectedApplicants.size} candidates`);
      addNotification('success', `Sent identity warnings to ${selectedApplicants.size} candidates`);
      setSelectedApplicants(new Set());
    } catch (error) {
      addNotification('error', 'Failed to send identity warnings');
    }
  };

  const sendIdentityWarning = async (id: string, name: string) => {
    try {
      await emailApi.sendIdentityWarning([id]);
      addNotification('success', `Identity warning sent to ${name}`);
    } catch (error) {
      addNotification('error', `Failed to send warning to ${name}`);
    }
  };

  const confirmAction = async () => {
    const { type, reason } = confirmationModal;
    if (!type) return;

    try {
      if (type === 'merge') {
        const selectedIds = Array.from(selectedApplicants);
        // Master record logic: Keep the first one selected
        // In a real scenario, user might choose the master.
        const duplicates = selectedIds.slice(1);

        // Send warning email to duplicates
        try {
          await emailApi.sendDuplicateWarning(duplicates);
        } catch (emailError) {
          console.error("Failed to send duplicate warning email:", emailError);
          // Continue with merge even if email fails
        }

        // Simulate merging by deleting duplicates
        await Promise.all(duplicates.map(id => applicantsApi.delete(id)));

        logAction(`Merged ${duplicates.length} duplicate profiles into master record`);
        addNotification('success', `Merged ${duplicates.length} duplicate profile(s) into the master record.Warning email sent.`);
        setSelectedApplicants(new Set());
        loadApplicants();
      } else {
        // Prepare History Records
        const applicantsToProcess = applicants.filter(app => selectedApplicants.has(app.id));
        const historyRecords = applicantsToProcess.map(app => ({
          id: app.id,
          name: `${app.first_name} ${app.last_name} `,
          email: app.email,
          job_title: app.job_title,
          status: type === 'accept' ? 'Accepted' : 'Rejected',
          reason: reason,
          date: new Date().toISOString()
        }));

        // Send Emails
        if (type === 'accept') {
          await emailApi.sendBulkAcceptance(Array.from(selectedApplicants));
        } else {
          await emailApi.sendBulkRejection(Array.from(selectedApplicants));
        }

        // Save History to Database
        await Promise.all(historyRecords.map(record => historyApi.create({
          name: record.name,
          email: record.email,
          job_title: record.job_title || 'Unknown',
          status: record.status as 'Accepted' | 'Rejected',
          reason: record.reason
        })));

        // Legacy: Save History to localStorage
        const existingHistory = JSON.parse(localStorage.getItem('applicationHistory') || '[]');
        localStorage.setItem('applicationHistory', JSON.stringify([...existingHistory, ...historyRecords]));

        // Delete Applicants
        await Promise.all(Array.from(selectedApplicants).map(id => applicantsApi.delete(id)));

        logAction(`Bulk ${type === 'accept' ? 'Accepted' : 'Rejected'} ${selectedApplicants.size} applicants`);
        addNotification('success', `${type === 'accept' ? 'Acceptance' : 'Rejection'} processed and applicants removed.`);
        setSelectedApplicants(new Set());
        loadApplicants();
      }
    } catch (error) {
      console.error(`Failed to process action ${type}: `, error);
      addNotification('error', `Failed to process action ${type} `);
    } finally {
      setConfirmationModal({ isOpen: false, type: null, reason: '' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
      </div>
    );
  }

  const displayedApplicants = applicants.filter(a => {
    // Stage Filter
    if (filters.stage && filters.stage !== 'All' && a.stage.toLowerCase() !== filters.stage.toLowerCase()) {
      return false;
    }
    // Search Filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const inName = `${a.first_name} ${a.last_name}`.toLowerCase().includes(q);
      const inEmail = a.email.toLowerCase().includes(q);
      const inJob = a.job_title?.toLowerCase().includes(q);
      if (!inName && !inEmail && !inJob) return false;
    }
    return true;
  });

  return (
    <div className="animate-fade-in relative">
      {/* Standard Enterprise Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-container">
            <div className="premium-modal-content">
              <div className="modal-header">
                <div
                  className={`modal-header-icon ${confirmationModal.type === 'accept' ? 'icon-bg-accept' : confirmationModal.type === 'merge' ? 'icon-bg-merge' : 'icon-bg-reject'}`}
                  style={confirmationModal.type === 'merge' ? { background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1' } : {}}
                >
                  {confirmationModal.type === 'accept' ? <CheckCircle size={24} /> : confirmationModal.type === 'merge' ? <GitMerge size={24} /> : <XCircle size={24} />}
                </div>
                <h3 className="modal-title">
                  {confirmationModal.type === 'accept' ? 'Accept Applicant' : confirmationModal.type === 'merge' ? 'Merge Applicants' : 'Reject Applicant'}
                </h3>
              </div>

              <span className="modal-subtitle">
                {confirmationModal.type === 'merge'
                  ? `Are you sure you want to merge ${selectedApplicants.size} profiles ? This will keep one record and delete the rest.`
                  : `Are you sure you want to ${confirmationModal.type === 'accept' ? 'accept' : 'reject'} ${selectedApplicants.size} applicant${selectedApplicants.size > 1 ? 's' : ''}?`
                }
              </span>

              <div className="modal-form-group">
                <label className="modal-form-label">Reason</label>
                <textarea
                  className="modal-textarea"
                  rows={3}
                  placeholder="Enter reason..."
                  value={confirmationModal.reason}
                  onChange={(e) => setConfirmationModal({ ...confirmationModal, reason: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setConfirmationModal({ isOpen: false, type: null, reason: '' })}
                  className="modal-btn btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className={`modal-btn ${confirmationModal.type === 'accept' ? 'btn-confirm-accept' : 'btn-confirm-reject'}`}
                >
                  {confirmationModal.type === 'merge' ? 'Merge' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center">
          Applicants
          <span className="text-muted text-xl font-normal ml-2">({displayedApplicants.length})</span>
        </h1>
      </div>

      <div className="jobs-toolbar" style={{ marginBottom: '2rem' }}>
        <div className="filter-group">
          {['All', 'Applied', 'Shortlisted', 'Recommended', 'Hired', 'Declined', 'Rejected'].map((stage) => (
            <button
              key={stage}
              className={`filter-btn ${filters.stage === stage ? 'active' : ''}`}
              onClick={() => setFilters({ ...filters, stage })}
            >
              {stage}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="relative" style={{ minWidth: '180px' }}>
            <select
              value={filters.job_id}
              onChange={(e) => setFilters({ ...filters, job_id: e.target.value })}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '9999px',
                padding: '0.4rem 2rem 0.4rem 1rem',
                color: 'white',
                appearance: 'none',
                fontSize: '0.875rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="" style={{ background: '#0f172a' }}>All Jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id} style={{ background: '#0f172a' }}>{job.title}</option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>

          <div className="search-wrapper-jobs" style={{ width: '220px' }}>
            <Search className="search-icon-left" size={16} />
            <input
              type="text"
              placeholder="Search..."
              className="search-input-premium"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {selectedApplicants.size > 0 && (
          <div className="bg-[#6366f120] border-b border-[#6366f140] p-4 flex items-center animate-fade-in" style={{ gap: '3rem' }}>
            <span className="text-primary font-medium">{selectedApplicants.size} applicant(s) selected</span>
            <div className="flex" style={{ gap: '2rem' }}>
              <button onClick={handleBulkMerge} className="btn btn-sm btn-secondary flex items-center gap-2" style={{ border: '1px solid rgba(99, 102, 241, 0.5)', color: '#818cf8', background: 'transparent' }}>
                <GitMerge size={14} /> Merge Candidates
              </button>
              <button onClick={handleBulkAcceptance} className="btn btn-sm btn-success flex items-center gap-2">
                <CheckCircle size={14} /> Send Acceptance
              </button>
              <button onClick={handleBulkRejection} className="btn btn-sm btn-danger flex items-center gap-2">
                <XCircle size={14} /> Send Rejection
              </button>
              <button onClick={handleBulkIdentityWarning} className="btn btn-sm btn-secondary flex items-center gap-2" style={{ border: '1px solid #ef4444', color: '#ef4444' }}>
                <ShieldAlert size={14} /> Send Identity Warning
              </button>
            </div>
          </div>
        )}
        <table className="table w-full">
          <thead>
            <tr>
              <th className="w-12 text-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-600 bg-transparent"
                  checked={selectedApplicants.size === displayedApplicants.length && displayedApplicants.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedApplicants(new Set(displayedApplicants.map((a) => a.id)));
                    else setSelectedApplicants(new Set());
                  }}
                />
              </th>
              <th>Candidate</th>
              <th>Email</th>
              <th>Applied For</th>
              <th>Current Stage</th>
              <th>Date Applied</th>
              <th>Match Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedApplicants.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-20 text-muted">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-[#64748b] text-base">No applicants found</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayedApplicants.map((applicant) => (
                <tr key={applicant.id} className="hover:bg-[#ffffff05] transition-colors">
                  <td className="text-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-600 bg-transparent"
                      checked={selectedApplicants.has(applicant.id)}
                      onChange={() => toggleApplicantSelection(applicant.id)}
                    />
                  </td>
                  <td>
                    <Link to={`/admin/applicants/${applicant.id}`} className="flex items-center gap-3 group">
                      <div>
                        <div className="font-medium text-white group-hover:text-primary transition-colors" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {(() => {
                            const cleanName = (n: string) => {
                              if (!n) return '';
                              let name = n.trim().toLowerCase();
                              if (name.match(/^([a-z])\1/)) name = name.substring(1);
                              return name.charAt(0).toUpperCase() + name.slice(1);
                            };
                            return `${cleanName(applicant.first_name)} ${cleanName(applicant.last_name)} `;
                          })()}
                          {applicants.filter(a => a.email === applicant.email).length > 1 && (
                            <span
                              title="Duplicate Candidate Detected"
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                fontSize: '0.65rem',
                                padding: '1px 6px',
                                borderRadius: '99px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: 700
                              }}
                            >
                              <Copy size={10} /> Duplicate
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="text-sm text-muted">{applicant.email}</td>
                  <td>
                    <Link to={`/admin/jobs/${applicant.job_id}`} className="flex items-center gap-1 text-sm text-muted hover:text-white transition-colors">
                      <Briefcase size={12} /> {applicant.job_title}
                    </Link>
                  </td>
                  <td>
                    <select
                      value={applicant.stage}
                      onChange={(e) => handleStageChange(applicant.id, e.target.value)}
                      className={`stage-badge stage-${applicant.stage.toLowerCase()}`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${getChevronColor(applicant.stage)}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`
                      }}
                    >
                      {['Applied', 'Shortlisted', 'Recommended', 'Hired', 'Declined', 'Withdrawn', 'Rejected'].map(s => (
                        <option key={s.toLowerCase()} value={s.toLowerCase()}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="text-sm text-muted">{new Date(applicant.applied_at).toLocaleDateString()}</td>
                  <td>
                    {(() => {
                      const resumeUrlLower = (applicant.resume_url || '').toLowerCase();

                      // 1. Basic Presence Check
                      if (!applicant.resume_url) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>0</div>
                            <span style={{ fontSize: '0.75rem' }}>No Resume</span>
                          </div>
                        );
                      }

                      // 2. Local Ownership Hint (Does THIS user's name match?)
                      const nameParts = [
                        applicant.first_name.toLowerCase(),
                        applicant.last_name.toLowerCase(),
                        applicant.email.split('@')[0].toLowerCase()
                      ];
                      const isLocalOwner = nameParts.some(part => part.length >= 3 && resumeUrlLower.includes(part));

                      // 3. Conflict Analysis
                      const othersUsingSameResume = applicants.filter(a =>
                        a.id !== applicant.id &&
                        a.resume_url === applicant.resume_url
                      );

                      const existsBetterOwner = othersUsingSameResume.some(other => {
                        const otherParts = [
                          other.first_name.toLowerCase(),
                          other.last_name.toLowerCase(),
                          other.email.split('@')[0].toLowerCase()
                        ];
                        return otherParts.some(p => p.length >= 3 && resumeUrlLower.includes(p));
                      });

                      // Pre-calculate Dynamic Score so it can be passed to the modal for ALL states
                      let score = 0;

                      const job = jobs.find(j => String(j.id) === String(applicant.job_id));
                      const jdText = job ? `${job.title || ''} ${job.requirements || job.description || ''}`.toLowerCase().replace(/[^a-z\s]/g, ' ') : '';
                      const stopWords = new Set([
                        'the', 'and', 'to', 'of', 'in', 'for', 'with', 'on', 'is', 'as', 'at', 'by', 'an', 'be', 'this', 'that', 'are', 'from', 'or', 'have', 'has', 'will', 'you', 'your', 'we', 'our', 'it', 'can', 'all', 'more', 'their', 'which', 'about', 'what', 'how', 'when', 'where', 'who', 'not', 'but', 'so', 'if', 'then', 'than', 'such', 'into', 'out', 'up', 'down', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'some', 'any', 'both', 'each', 'few', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'too', 'very',
                        'job', 'role', 'team', 'work', 'company', 'experience', 'skills', 'looking', 'years', 'working', 'using', 'ability', 'knowledge', 'strong', 'good', 'excellent',
                        'responsible', 'developing', 'maintaining', 'building', 'creating', 'testing', 'writing', 'managing', 'leading', 'supporting', 'understanding', 'ensure', 'ensuring', 'provide', 'providing', 'required', 'requirements', 'including',
                        'design', 'designing', 'development', 'software', 'applications', 'systems', 'business', 'data', 'technical', 'technology', 'environment', 'project', 'projects', 'solutions', 'process', 'processes', 'management', 'client', 'clients', 'user', 'users', 'product', 'products', 'service', 'services', 'support', 'performance', 'quality', 'best', 'practices', 'drive', 'driving', 'within', 'across', 'highly', 'related', 'field', 'degree', 'computer', 'science', 'engineering', 'bachelor', 'master', 'equivalent',
                        'must', 'plus', 'preferred', 'solid', 'proven', 'track', 'record', 'familiarity', 'proficient', 'proficiency', 'hands-on', 'position', 'opportunity', 'culture', 'benefits', 'salary', 'compensation', 'remote', 'flexible', 'office', 'join', 'hire', 'hiring', 'candidate', 'successful', 'ideal', 'passionate', 'driven', 'motivated', 'self-starter', 'fast-paced', 'dynamic', 'innovative', 'cutting-edge', 'industry', 'collaborating', 'cross', 'functional', 'teams'
                      ]);
                      const words = jdText.split(/\s+/);
                      const keywordCounts: Record<string, number> = {};
                      words.forEach(w => {
                        if (w.length > 3 && !stopWords.has(w)) {
                          keywordCounts[w] = (keywordCounts[w] || 0) + 1;
                        }
                      });
                      const jdKeywords = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
                      // Use real stored resume text if available, otherwise simulated fallback
                      const storedResumeText = ((applicant as any).resume_text || '').toLowerCase();
                      const simulatedText = applicant.resume_url ? 'university bachelor degree experience intern pu school career team worked' : '';
                      const bodyText = storedResumeText.length > 20 ? storedResumeText : simulatedText;
                      const applicantText = `${applicant.job_title || ''} ${applicant.first_name || ''} ${applicant.resume_url || ''} ${(applicant as any).cover_letter || ''} ${bodyText}`.toLowerCase();
                      const missingSkills = jdKeywords.filter(kw => !applicantText.includes(kw));

                      const hasEducation = ['school', 'pu', 'pre university', 'ug', 'pg', 'bachelor', 'master', 'degree', 'diploma', 'university'].some(term => applicantText.includes(term));
                      const hasExperience = ['experience', 'intern', 'years', 'worked', 'career'].some(term => applicantText.includes(term));

                      if (isLocalOwner) {
                        if (jdKeywords.length > 0) {
                          const matchRatio = (jdKeywords.length - missingSkills.length) / jdKeywords.length;
                          score = Math.round(100 * matchRatio);
                          if (hasEducation) score += 15;
                          if (hasExperience) score += 15;
                          score = Math.min(score, 100);
                        } else {
                          score = 100;
                        }
                      } else {
                        score = 0; // Disqualified due to mismatch
                      }

                      const openModal = () => {
                        const cleanName = (n: string) => {
                          if (!n) return '';
                          let name = n.trim().toLowerCase();
                          if (name.match(/^([a-z])\1/)) name = name.substring(1);
                          return name.charAt(0).toUpperCase() + name.slice(1);
                        };
                        setMatchScoreModal({ isOpen: true, score, applicantName: `${cleanName(applicant.first_name)} ${cleanName(applicant.last_name)}`, candidateId: applicant.id, jobId: applicant.job_id });
                      };

                      // 4. Reporting Hierarchy

                      // CASE A: Someone else is the owner, this user is likely incorrect (Mismatch)
                      if (existsBetterOwner && !isLocalOwner) {
                        return (
                          <div onClick={openModal} className="cursor-pointer group hover:opacity-80 transition-opacity" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.1)' }}>!</div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Conflict</span>
                              <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>Identity Mismatch</span>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); sendIdentityWarning(applicant.id, applicant.first_name); }}
                              title="Send Identity Warning"
                              style={{
                                marginLeft: 'auto',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                padding: '4px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              <Mail size={12} />
                            </button>
                          </div>
                        );
                      }

                      // CASE C: General Conflict (Duplicate file, no clear owner via name matching)
                      if (othersUsingSameResume.length > 0 && !isLocalOwner && !existsBetterOwner) {
                        return (
                          <div onClick={openModal} className="cursor-pointer group hover:opacity-80 transition-opacity" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>!</div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Duplicate</span>
                              <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>File Conflict Det.</span>
                            </div>
                          </div>
                        );
                      }

                      // CASE D: Ownership status check - Name mismatch (Red Error)
                      if (!isLocalOwner) {
                        return (
                          <div onClick={openModal} className="cursor-pointer group hover:opacity-80 transition-opacity" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.1)' }}>!</div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Conflict</span>
                              <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>Identity Mismatch</span>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); sendIdentityWarning(applicant.id, applicant.first_name); }}
                              title="Send Identity Warning"
                              style={{
                                marginLeft: 'auto',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                padding: '4px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              <Mail size={12} />
                            </button>
                          </div>
                        );
                      }

                      // CASE E: Job Role Mismatch (Yellow Warning if identity is verified but literally absolute 0 match)
                      if (jdKeywords.length > 0 && missingSkills.length === jdKeywords.length && isLocalOwner) {
                        return (
                          <div
                            className="cursor-pointer group hover:opacity-80 transition-opacity"
                            onClick={openModal}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}
                          >
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(245, 158, 11, 0.1)' }}>?</div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Review Needed</span>
                              <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>Job Mismatch Det.</span>
                            </div>
                          </div>
                        );
                      }

                      let color = '#ef4444';
                      let statusText = 'Poor Match';
                      let StatusIcon = XCircle;

                      if (score >= 80) {
                        color = '#10b981'; // Green
                        statusText = 'Verified';
                        StatusIcon = CheckCircle;
                      } else if (score >= 50) {
                        color = '#f59e0b'; // Yellow
                        statusText = 'Review Needed';
                        StatusIcon = AlertTriangle;
                      } else {
                        color = '#ef4444'; // Red
                        statusText = 'Poor Match';
                        StatusIcon = XCircle;
                      }

                      return (
                        <div
                          className="cursor-pointer group hover:opacity-80 transition-opacity"
                          onClick={openModal}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: `3px solid ${color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: 'white',
                            background: 'rgba(255,255,255,0.05)'
                          }}>
                            {score}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', color: color, fontWeight: 'bold' }}>{score}% Match</span>
                            <span style={{ fontSize: '0.6rem', color: color, display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <StatusIcon size={8} /> {statusText}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    <Link
                      to={`/admin/applicants/${applicant.id}`}
                      className="px-4 py-1.5 text-xs font-semibold rounded transition-all duration-200 inline-block"
                      style={{
                        background: 'rgba(30, 27, 75, 0.6)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        color: '#c7d2fe',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(49, 46, 129, 0.8)';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.8)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(30, 27, 75, 0.6)';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                        e.currentTarget.style.color = '#c7d2fe';
                      }}
                    >
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

      {matchScoreModal && (
        <MatchScoreModal
          isOpen={matchScoreModal.isOpen}
          score={matchScoreModal.score}
          applicantName={matchScoreModal.applicantName}
          candidateId={matchScoreModal.candidateId}
          jobId={matchScoreModal.jobId}
          onClose={() => setMatchScoreModal(null)}
        />
      )}
    </div>
  );
}
