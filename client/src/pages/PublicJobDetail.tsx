import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobsApi } from '../services/api';
import { ArrowLeft, MapPin, Briefcase, Clock, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import './PublicJobDetail.css';
import StatusModal from '../components/StatusModal';

interface Job {
  id: string;
  title: string;
  department?: string;
  location?: string;
  type?: string;
  description?: string;
  requirements?: string;
  status: string;
}

export default function PublicJobDetail() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]);

  const loadJob = async () => {
    try {
      const response = await jobsApi.getById(id!);
      setJob(response.data);
    } catch (error) {
      console.error('Failed to load job:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="state-container">
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
      </div>
    );
  }

  if (!job || job.status !== 'open') {
    return (
      <div className="state-container">
        <div className="error-box">
          <h1 className="error-title">Job Not Found</h1>
          <p className="error-desc">This job posting is no longer available.</p>
          <Link to="/" className="back-link" style={{ justifyContent: 'center', marginTop: '1rem' }}>
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="public-job-detail animate-fade-in">
      <div className="job-detail-container">
        <Link to="/candidate/jobs" className="back-link">
          <ArrowLeft size={20} style={{ marginRight: '8px' }} /> Back to Jobs
        </Link>

        <div className="job-card-large">
          <div className="job-header">
            <h1 className="job-title-large">{job.title}</h1>
            <div className="job-meta-row">
              {job.department && (
                <div className="meta-item">
                  <Briefcase size={18} className="meta-icon" /> {job.department}
                </div>
              )}
              {job.location && (
                <div className="meta-item">
                  <MapPin size={18} className="meta-icon" /> {job.location}
                </div>
              )}
              {job.type && (
                <div className="meta-item">
                  <Clock size={18} className="meta-icon" /> {job.type}
                </div>
              )}
            </div>
          </div>

          {job.description && (
            <div className="job-section">
              <h2 className="section-title">
                <FileText size={24} className="text-primary" /> Job Description
              </h2>
              <div className="section-content">{job.description}</div>
            </div>
          )}

          {job.requirements && (
            <div className="job-section">
              <h2 className="section-title">
                <CheckCircle size={24} className="text-primary" /> Requirements
              </h2>
              <div className="section-content">{job.requirements}</div>
            </div>
          )}

          <div className="share-section" style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            background: 'rgba(255,255,255,0.03)',
            padding: '1.25rem',
            borderRadius: '1rem',
            border: '1px solid rgba(255,255,255,0.05)',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '0.5rem' }}>Spread the word:</span>

            {/* WhatsApp */}
            <button
              onClick={() => {
                const text = `Check out this ${job.title} role at ApexRecruit! Apply here: ${window.location.href}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="share-btn whatsapp"
              style={{
                background: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.6rem 1.2rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 211, 102, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.2)';
              }}
            >
              WhatsApp
            </button>

            {/* LinkedIn */}
            <button
              onClick={() => {
                const url = window.location.href;
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
              }}
              className="share-btn linkedin"
              style={{
                background: '#0077b5',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.6rem 1.2rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 12px rgba(0, 119, 181, 0.2)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 119, 181, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 119, 181, 0.2)';
              }}
            >
              LinkedIn
            </button>

            {/* Copy Link */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setStatusModal({
                  isOpen: true,
                  title: 'Copied!',
                  message: 'Job link copied to clipboard.',
                  type: 'success'
                });
              }}
              className="share-btn copy"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.75rem',
                padding: '0.6rem 1.2rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              <Briefcase size={16} /> Copy Link
            </button>
          </div>

          <div className="apply-section">
            <Link to={`/public/jobs/${job.id}/apply`} className="apply-btn-large">
              Apply for this Position <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
      />
    </div>
  );
}
