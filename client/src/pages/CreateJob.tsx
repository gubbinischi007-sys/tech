import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../services/api';
import { logAction } from '../utils/historyLogger';
import { useCompany } from '../contexts/CompanyContext';
import './CreateJob.css';
import StatusModal from '../components/StatusModal';

export default function CreateJob() {
  const navigate = useNavigate();
  const { company } = useCompany();
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: '',
    description: '',
    requirements: '',
    status: 'open',
  });
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check verification status
    if (company?.status !== 'approved') {
      setStatusModal({
        isOpen: true,
        title: 'Verification Required',
        message: 'Your company must be verified by a platform administrator before you can post jobs. Please wait for approval or contact support.',
        type: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      await jobsApi.create(formData);
      logAction(`Created new job: ${formData.title}`);

      // We could show a success modal here, but navigating back to the list 
      // is a common pattern. If we want a modal, we'd need to wait for close.
      // For now, let's just navigate which is cleaner for "Create" actions unless error.
      // Or better yet, let's show success modal then navigate on close.
      setStatusModal({
        isOpen: true,
        title: 'Success',
        message: 'Job created successfully.',
        type: 'success'
      });

    } catch (error) {
      console.error('Failed to create job:', error);
      setStatusModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to create job. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setStatusModal(prev => ({ ...prev, isOpen: false }));
    // Navigate on success close
    if (statusModal.type === 'success') {
      navigate('/admin/jobs');
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="create-job-page">
      <div className="page-header">
        <h1 className="page-title">Create New Job</h1>
        <p className="page-subtitle">Add a new job posting to find the best talent.</p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group-mb">
            <label htmlFor="title" className="form-label">Job Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Senior Software Engineer"
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group-mb" style={{ marginBottom: 0 }}>
              <label htmlFor="department" className="form-label">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                className="form-input"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Engineering"
              />
            </div>

            <div className="form-group-mb" style={{ marginBottom: 0 }}>
              <label htmlFor="location" className="form-label">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Remote / New York, NY"
              />
            </div>
          </div>

          <div className="form-group-mb">
            <label htmlFor="type" className="form-label">Job Type</label>
            <select id="type" name="type" className="form-select" value={formData.type} onChange={handleChange}>
              <option value="">Select type</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <div className="form-group-mb">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="Describe the role responsibilities and what you are looking for..."
            />
          </div>

          <div className="form-group-mb">
            <label htmlFor="requirements" className="form-label">Requirements</label>
            <textarea
              id="requirements"
              name="requirements"
              className="form-textarea"
              value={formData.requirements}
              onChange={handleChange}
              rows={6}
              placeholder="List the key qualifications and skills required..."
            />
          </div>

          <div className="form-group-mb">
            <label htmlFor="status" className="form-label">Status</label>
            <select id="status" name="status" className="form-select" value={formData.status} onChange={handleChange}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || company?.status !== 'approved'}>
              {loading ? 'Creating...' : company?.status !== 'approved' ? 'Verification Pending' : 'Create Job'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/admin/jobs')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={handleModalClose}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
      />
    </div>
  );
}
