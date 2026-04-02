import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobsApi, applicantsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Upload, FileText, Link as LinkIcon, X } from 'lucide-react';
import './ApplyJob.css';
import StatusModal from '../components/StatusModal';

interface Job {
  id: string;
  title: string;
}

export default function ApplyJob() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    resume_url: '',
    cover_letter: '',
  });

  const [resumeMode, setResumeMode] = useState<'url' | 'file'>('file');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

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

  const closeModal = () => {
    setStatusModal(prev => ({ ...prev, isOpen: false }));
    if (statusModal.type === 'success') {
      navigate(`/candidate/dashboard`);
    }
  };

  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]);

  useEffect(() => {
    if (user.isAuthenticated && user.name) {
      const names = (user.name || '').split(' ');
      const firstName = names[0] || '';
      const lastName = names.slice(1).join(' ') || '';

      setFormData(prev => ({
        ...prev,
        first_name: firstName,
        last_name: lastName,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  const loadJob = async () => {
    try {
      const response = await jobsApi.getById(id!);
      setJob(response.data);
      if (response.data.status !== 'open') {
        navigate(`/public/jobs/${id}`);
      }
    } catch (error) {
      console.error('Failed to load job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (resumeMode === 'file' && !resumeFile && !formData.resume_url) {
      setStatusModal({
        isOpen: true,
        title: 'Resume Required',
        message: 'Please upload your resume to continue.',
        type: 'error'
      });
      return;
    }

    setSubmitting(true);
    try {
      if (resumeMode === 'file' && resumeFile) {
        const payload = new FormData();
        payload.append('job_id', id);
        payload.append('first_name', formData.first_name);
        payload.append('last_name', formData.last_name);
        payload.append('email', formData.email);
        if (formData.phone) payload.append('phone', formData.phone);
        if (formData.cover_letter) payload.append('cover_letter', formData.cover_letter);
        payload.append('resume_url', formData.resume_url); // keep placeholder string
        payload.append('resume', resumeFile); // attach file body
        await applicantsApi.create(payload);
      } else {
        await applicantsApi.create({
          job_id: id,
          ...formData,
        });
      }

      setStatusModal({
        isOpen: true,
        title: 'Application Submitted',
        message: 'Your application has been submitted successfully! Good luck.',
        type: 'success'
      });
      // Navigation will happen when modal is closed
    } catch (error: any) {
      console.error('Failed to submit application:', error);
      setStatusModal({
        isOpen: true,
        title: 'Submission Failed',
        message: error.response?.data?.error || 'Failed to submit application. Please try again.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setStatusModal({
          isOpen: true,
          title: 'Invalid File',
          message: 'Please upload a PDF file.',
          type: 'error'
        });
        return;
      }
      setResumeFile(file);
      setResumeFile(file);
      // Even though we upload, set the URL placeholder for DB so it knows a file is attached
      setFormData(prev => ({ ...prev, resume_url: `https://storage.apexrecruit.com/resumes/${file.name}` }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (loading) {
    return (
      <div className="state-container">
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="state-container">
        <div className="error-box">
          <h1 className="error-title">Job Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-job-page animate-fade-in">
      <div className="apply-container">
        <Link to={`/public/jobs/${id}`} className="back-link">
          <ArrowLeft size={20} style={{ marginRight: '8px' }} /> Back to Job Details
        </Link>

        <div className="apply-card">
          <h1 className="apply-title">Apply for {job.title}</h1>
          <p className="apply-subtitle">
            Please fill out the form below to submit your application.
          </p>

          {/* Social Share Section */}
          <div className="share-section" style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            background: 'rgba(255,255,255,0.03)',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255,255,255,0.05)',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Share this job:</span>

            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => {
                const text = `Check out this ${job.title} role at ApexRecruit! Apply here: ${window.location.href}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              style={{
                background: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              WhatsApp
            </button>

            {/* LinkedIn */}
            <button
              type="button"
              onClick={() => {
                const url = window.location.href;
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
              }}
              style={{
                background: '#0e76a8',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              LinkedIn
            </button>

            {/* Copy Link */}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setStatusModal({
                  isOpen: true,
                  title: 'Copied!',
                  message: 'Job link copied to clipboard.',
                  type: 'success'
                });
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <LinkIcon size={14} /> Copy Link
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="first_name">First Name *</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name">Last Name *</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Resume *</label>

              <div className="resume-toggle" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setResumeMode('file')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid',
                    borderColor: resumeMode === 'file' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    background: resumeMode === 'file' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    color: resumeMode === 'file' ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <FileText size={16} /> Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => setResumeMode('url')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid',
                    borderColor: resumeMode === 'url' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    background: resumeMode === 'url' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    color: resumeMode === 'url' ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <LinkIcon size={16} /> URL Link
                </button>
              </div>

              {resumeMode === 'url' ? (
                <>
                  <input
                    type="url"
                    id="resume_url"
                    name="resume_url"
                    value={formData.resume_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/johndoe"
                    required={resumeMode === 'url'}
                  />
                  <small className="form-help">
                    Provide a link to your resume (e.g., Google Drive, Dropbox, LinkedIn)
                  </small>
                </>
              ) : (
                <div className="file-upload-area">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  {!resumeFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="upload-placeholder"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        border: '2px dashed rgba(255,255,255,0.1)',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: 'rgba(255,255,255,0.02)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      }}
                    >
                      <div className="upload-icon-circle" style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        padding: '1rem',
                        borderRadius: '50%',
                        marginBottom: '1rem',
                        color: 'var(--primary)'
                      }}>
                        <Upload size={24} />
                      </div>
                      <span className="upload-text" style={{ fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.25rem' }}>Click to upload resume</span>
                      <span className="upload-subtext" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PDF files only (max 5MB)</span>
                    </div>
                  ) : (
                    <div className="file-selected" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      borderRadius: '0.75rem'
                    }}>
                      <div className="file-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={20} className="text-primary" />
                        <div>
                          <p className="file-name" style={{ fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>{resumeFile.name}</p>
                          <p className="file-size" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setResumeFile(null);
                          setFormData({ ...formData, resume_url: '' });
                        }}
                        className="remove-file-btn"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          borderRadius: '0.375rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 0, 0, 0.1)';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="cover_letter">Cover Letter</label>
              <textarea
                id="cover_letter"
                name="cover_letter"
                value={formData.cover_letter}
                onChange={handleChange}
                rows={8}
                placeholder="Tell us why you're interested in this position..."
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate(`/public/jobs/${id}`)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={closeModal}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
      />
    </div>
  );
}
