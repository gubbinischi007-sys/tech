
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../services/api';
import { Plus, Briefcase, Edit2, Trash2, Eye, Search, X } from 'lucide-react';
import { logAction } from '../utils/historyLogger';
import './Jobs.css';

interface Job {
  id: string;
  title: string;
  department?: string;
  location?: string;
  type?: string;
  status: string;
  created_at: string;
}


export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    loadJobs();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filter]);

  const loadJobs = async () => {
    try {
      const status = filter !== 'all' ? filter : undefined;
      const response = await jobsApi.getAll(status);
      setJobs(response.data || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      // Fallback demo jobs for preview
      const demoJobs = [
        { id: '1', title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time', status: 'open', created_at: new Date(Date.now() - 604800000).toISOString() },
        { id: '2', title: 'Product Manager', department: 'Product', location: 'New York, NY', type: 'Full-time', status: 'open', created_at: new Date(Date.now() - 1209600000).toISOString() },
        { id: '3', title: 'UX Designer', department: 'Design', location: 'San Francisco, CA', type: 'Contract', status: 'open', created_at: new Date(Date.now() - 259200000).toISOString() },
        { id: '4', title: 'Backend Developer', department: 'Engineering', location: 'Remote', type: 'Full-time', status: 'closed', created_at: new Date(Date.now() - 2592000000).toISOString() },
        { id: '5', title: 'HR Coordinator', department: 'Human Resources', location: 'London, UK', type: 'Full-time', status: 'open', created_at: new Date(Date.now() - 432000000).toISOString() },
      ];
      setJobs(filter === 'all' ? demoJobs : demoJobs.filter(j => j.status === filter));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title?: string) => {
    // Confirmation removed as per user request
    try {
      await jobsApi.delete(id);
      logAction(`Deleted job: ${title || 'Unknown Job'}`);
      setJobs(prev => prev.filter(job => job.id !== id));
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      (job.department && job.department.toLowerCase().includes(query)) ||
      (job.location && job.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-8" style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gradient">Jobs</h1>
          <p className="text-muted">Manage your job positions and requirements.</p>
        </div>
        <Link to="/admin/jobs/new" className="btn btn-primary btn-sm" style={{ width: 'fit-content' }}>
          <Plus size={16} /> Create New Job
        </Link>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="jobs-toolbar">
        <div className="filter-group">
          {['all', 'open', 'closed'].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="search-wrapper-jobs">
          <Search className="search-icon-left" size={18} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search jobs..."
            className="search-input-premium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="search-clear-btn"
            >
              <X size={14} />
            </button>
          )}
          <div className="search-shortcut">
            <kbd>⌘</kbd>K
          </div>
        </div>
      </div>

      {/* Jobs Table List */}
      <div className="jobs-table-container">
        {/* Table Header */}
        <div className="jobs-data-grid jobs-header">
          <div>Title</div>
          <div>Department</div>
          <div>Location</div>
          <div>Type</div>
          <div>Status</div>
          <div>Created</div>
          <div className="text-right" style={{ paddingRight: '0.5rem' }}>Actions</div>
        </div>

        {/* Table Body */}
        {filteredJobs.length === 0 ? (
          <div className="jobs-empty-state">
            <Briefcase size={48} className="mx-auto mb-4 text-muted opacity-50" />
            <h3 className="text-xl font-medium text-white mb-2">No jobs found</h3>
            <p className="text-muted">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div>
            {filteredJobs.map((job) => (
              <div key={job.id} className="jobs-data-grid jobs-row">
                <div title={job.title}>
                  <Link to={`/admin/jobs/${job.id}`} className="job-title-link">
                    {job.title}
                  </Link>
                </div>
                <div className="job-cell-sub">{job.department || '—'}</div>
                <div className="job-cell-sub">{job.location || '—'}</div>
                <div className="job-cell-sub">{job.type || '—'}</div>
                <div>
                  <span className={`badge badge-${job.status}`}>
                    <span className="badge-dot"></span>
                    {job.status}
                  </span>
                </div>
                <div className="job-cell-sub">
                  {new Date(job.created_at).toLocaleDateString()}
                </div>
                <div className="actions-cell">
                  {/* View button */}
                  <Link to={`/admin/jobs/${job.id}`} className="action-btn" title="View">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </Link>
                  {/* Edit button */}
                  <Link to={`/admin/jobs/${job.id}/edit`} className="action-btn" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </Link>
                  {/* Delete button */}
                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(job.id, job.title)}
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
