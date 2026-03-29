import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { analyticsApi, applicantsApi, interviewsApi, historyApi, employeesApi, platformApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Briefcase, Users, UserCheck, Calendar, TrendingUp, Plus, ArrowRight, Brain, CheckCircle, Copy, History, AlertTriangle, ShieldCheck, Download, FileText, FileSpreadsheet, UserMinus, GitMerge, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import './Dashboard.css';
import StatusModal from '../components/StatusModal';

interface DashboardStats {
  totalJobs: number;
  openJobs: number;
  totalApplicants: number;
  recentApplicants: number;
  scheduledInterviews: number;
  applicantsByStage: Array<{ stage: string; count: number }>;
  applicantsByJob: Array<{ job_id: string; job_title: string; count: number }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [companyStatus, setCompanyStatus] = useState<{ status: string; document_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'applicants' | 'employees' | 'decisions' | 'login_activity'>('applicants');

  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, appsRes, interviewsRes] = await Promise.all([
        analyticsApi.getDashboard(),
        applicantsApi.getAll(),
        interviewsApi.getAll()
      ]);

      setStats(statsRes.data);

      // Process recent applications (last 5)
      setRecentApplications(appsRes.data.slice(0, 5));

      const now = new Date();
      const upcoming = interviewsRes.data
        .filter((i: any) => new Date(i.scheduled_at) > now)
        .slice(0, 5);
      setUpcomingInterviews(upcoming);

      // Fetch company verification status if HR
      if (user.role === 'hr' && user.email) {
        try {
          const statusRes = await platformApi.getCompanyStatus(user.email);
          setCompanyStatus(statusRes.data);
        } catch (err) {
          console.warn('Could not fetch company status:', err);
        }
      }

    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  /* Hook Initialization */
  const navigate = useNavigate();

  /* ... data loading ... */

  const handleExportReport = async (format: 'csv' | 'pdf') => {
    try {
      let data: any[] = [];
      let headers: string[] = [];
      let filename = "";
      let title = "";

      if (reportType === 'applicants') {
        const response = await applicantsApi.getAll();
        data = response.data;
        headers = ['ID', 'First Name', 'Last Name', 'Email', 'Role', 'Status', 'Applied At'];
        filename = "applicants_report";
        title = "Applicants Report";
      } else if (reportType === 'employees') {
        const response = await employeesApi.getAll();
        data = response.data;
        headers = ['ID', 'Name', 'Email', 'Role', 'Department', 'Hired Date'];
        filename = "employees_report";
        title = "Employees Report";
      } else if (reportType === 'decisions') {
        const response = await historyApi.getAll();
        data = response.data;
        headers = ['ID', 'Name', 'Email', 'Role', 'Decision', 'Reason', 'Date'];
        filename = "application_decisions_report";
        title = "Application Decisions Report";
      } else if (reportType === 'login_activity') {
        const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
        // Flatten activities for the report
        data = history.flatMap((session: any) =>
          (session.actions || []).map((action: any) => ({
            user: session.userEmail || 'Admin',
            action: action.description,
            timestamp: action.timestamp,
            loginTime: session.loginTime
          }))
        ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        headers = ['User Email', 'Action', 'Timestamp', 'Session Login Time'];
        filename = "login_activity_report";
        title = "Login Activity Report";
      }

      if (data.length === 0) {
        setStatusModal({
          isOpen: true,
          type: 'error',
          title: 'No Data for Export',
          message: 'The selected report type has no data to export. Please try another selection.'
        });
        return;
      }

      const rows = data.map((item: any, index: number) => {
        const rowId = index + 1;
        if (reportType === 'applicants') {
          return [rowId, item.first_name, item.last_name, item.email, item.job_title || 'N/A', item.status, new Date(item.applied_at).toLocaleDateString()];
        } else if (reportType === 'employees') {
          return [rowId, item.name, item.email, item.job_title, item.department, new Date(item.hired_date).toLocaleDateString()];
        } else if (reportType === 'decisions') {
          return [rowId, item.name, item.email, item.job_title, item.status, item.reason, new Date(item.date).toLocaleDateString()];
        } else if (reportType === 'login_activity') {
          return [item.user, item.action, new Date(item.timestamp).toLocaleString(), new Date(item.loginTime).toLocaleString()];
        }
        return [];
      });

      if (format === 'csv') {
        const csvContent = "data:text/csv;charset=utf-8,"
          + headers.join(",") + "\n"
          + rows.map((e: any[]) => e.map(cell => `"${cell}"`).join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

        doc.setFontSize(18);
        doc.text(title, 14, 22);

        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        autoTable(doc, {
          startY: 36,
          head: [headers],
          body: rows,
          theme: 'grid',
          headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255] }
        });

        doc.save(`${filename}.pdf`);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Export Failed',
        message: 'Could not generate the report due to an error. Please try again later.'
      });
    }
  };


  /* ... existing loadDashboard and render logic ... */
  // NOTE: I will return the FULL component body from standard "if (loading)" downwards to ensure correct placement, 
  // but replacing the entire cards block is cleaner.

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-muted" style={{ marginTop: '4rem' }}>Failed to load dashboard data.</div>;
  }

  const statCards = [
    { label: 'Total Jobs', value: stats.totalJobs, icon: Briefcase, color: '#6366f1' },
    { label: 'Open Postings', value: stats.openJobs, icon: TrendingUp, color: '#10b981' },
    { label: 'Total Candidates', value: stats.totalApplicants, icon: Users, color: '#ec4899' },
    { label: 'New (30d)', value: stats.recentApplicants, icon: UserCheck, color: '#f59e0b' },
    { label: 'Interviews Scheduled', value: stats.scheduledInterviews, icon: Calendar, color: '#a855f7' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Dashboard</h1>
          <p>Overview of your recruitment pipeline.</p>
        </div>
      </div>

      {/* Verification Status Banner */}
      {user.role === 'hr' && companyStatus && companyStatus.status !== 'approved' && (
        <div className={`verification-banner ${companyStatus.status}`} style={{
          marginBottom: '2rem',
          padding: '1.25rem',
          borderRadius: '12px',
          background: companyStatus.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${companyStatus.status === 'pending' ? '#f59e0b' : '#ef4444'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ color: companyStatus.status === 'pending' ? '#f59e0b' : '#ef4444' }}>
            {companyStatus.status === 'pending' ? <AlertTriangle size={24} /> : <X size={24} />}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontWeight: 700, margin: 0, color: 'white' }}>
              Company Verification: {companyStatus.status.toUpperCase()}
            </h4>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>
              {companyStatus.status === 'pending'
                ? 'Your company document is being reviewed by our platform administrators. Some features may be restricted until verified.'
                : 'Your verification was rejected. Please contact support or re-upload your registration documents.'}
            </p>
          </div>
          {companyStatus.status === 'approved' && (
            <div style={{ color: '#10b981' }}>
              <ShieldCheck size={24} />
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="card stat-card" style={{ animationDelay: `${index * 100}ms` }}>
            <div>
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
            <div className="stat-icon-wrapper" style={{ background: `${stat.color}20`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Smart Features Grid */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Platform Intelligence & Tools</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* Feature 1: Resume Intelligence */}
        <div className="card feature-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flex: 1 }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', padding: '1rem', borderRadius: '12px', color: 'white' }}>
              <Brain size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                Resume Match Score <span style={{ fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '2px 8px', borderRadius: '12px' }}>AI Screening</span>
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
                Compares job description skills with resume keywords to generate a <strong>Match Score (e.g., 78% fit)</strong>.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={14} className="text-primary" />
                  <span className="text-sm">Shortlist candidates faster</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={14} className="text-primary" />
                  <span className="text-sm">Objective, data-driven decisions</span>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                Rule-based keyword relevance algorithm for transparent screening.
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/applicants')}
            className="btn btn-primary"
            style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
          >
            View Candidates
          </button>
        </div>

        {/* Feature 2: Duplicate Detection */}
        <div className="card feature-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flex: 1 }}>
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', padding: '1rem', borderRadius: '12px', color: 'white' }}>
              <Copy size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                Duplicate Detection <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '12px' }}>Profile Integrity</span>
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
                Prevents repeated submissions by checking email/resume against existing records.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
                  <span className="text-sm">Warns candidate: "Record already exists"</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={14} style={{ color: '#3b82f6' }} />
                  <span className="text-sm">HR View: Previous jobs & application status</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={14} style={{ color: '#10b981' }} />
                  <span className="text-sm">Maintains clean applicant records</span>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                Improves efficiency by avoiding re-screening of same candidates.
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/applicants')}
            className="btn btn-secondary"
            style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.5)', color: '#34d399' }}
          >
            Review Duplicates
          </button>
        </div>

        {/* Feature 3: Exportable Reports */}
        <div className="card feature-card" style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(244, 63, 94, 0.05) 100%)', border: '1px solid rgba(236, 72, 153, 0.2)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flex: 1 }}>
            <div style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', padding: '1rem', borderRadius: '12px', color: 'white' }}>
              <Download size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                Exportable Reports <span style={{ fontSize: '0.7rem', background: 'rgba(236, 72, 153, 0.2)', color: '#fda4af', padding: '2px 8px', borderRadius: '12px' }}>Business Data</span>
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
                Download comprehensive recruitment data for analysis, reporting, and compliance.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={14} style={{ color: '#f43f5e' }} />
                  <span className="text-sm">Select Report Type:</span>
                </div>
                <select
                  value={reportType}
                  onChange={(e: any) => setReportType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                    color: 'white',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="applicants">Applicant Database</option>
                  <option value="employees">Active Employees (Hired)</option>
                  <option value="decisions">Application Decisions (History)</option>
                  <option value="login_activity">Login Activity (Audit Trail)</option>
                </select>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                Perfect for monthly hiring reviews and management reporting.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              onClick={() => handleExportReport('csv')}
              className="btn btn-primary"
              style={{
                flex: 1,
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                border: 'none',
                fontSize: '0.9rem',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                color: 'white'
              }}
            >
              <FileSpreadsheet size={16} style={{ marginRight: '6px' }} /> Download CSV
            </button>
            <button
              onClick={() => handleExportReport('pdf')}
              className="btn btn-primary"
              style={{
                flex: 1,
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', /* Purple/Indigo Gradient */
                border: 'none',
                fontSize: '0.9rem',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                color: 'white'
              }}
            >
              <FileText size={16} style={{ marginRight: '6px' }} /> Download PDF
            </button>
          </div>
        </div>

      </div>

      {/* Charts Section Replaced with Actionable Widgets */}
      <div className="charts-grid">
        {/* Upcoming Interviews */}
        <div className="card">
          <div className="widget-header">
            <h2 className="chart-header" style={{ marginBottom: 0 }}>
              <Calendar size={20} className="text-primary" /> Upcoming Interviews
            </h2>
            <Link to="/admin/interviews" className="view-all-link">View All</Link>
          </div>
          <div className="widget-list">
            {upcomingInterviews.length === 0 ? (
              <div className="text-muted text-sm py-4">No upcoming interviews scheduled.</div>
            ) : (
              upcomingInterviews.map((interview) => (
                <div key={interview.id} className="widget-item">
                  <div className="widget-item-left">
                    <div className="widget-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}>
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <h4 className="widget-item-title">{interview.applicant_name || 'Unknown Candidate'}</h4>
                      <p className="widget-item-subtitle">{interview.job_title || 'Unknown Role'}</p>
                    </div>
                  </div>
                  <div className="widget-item-right">
                    <div className="widget-time">{format(new Date(interview.scheduled_at), 'h:mm a')}</div>
                    <div className="widget-date">{format(new Date(interview.scheduled_at), 'MMM d')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card">
          <div className="widget-header">
            <h2 className="chart-header" style={{ marginBottom: 0 }}>
              <Users size={20} className="text-primary" /> Recent Applications
            </h2>
            <Link to="/admin/applicants" className="view-all-link">View All</Link>
          </div>
          <div className="widget-list">
            {recentApplications.length === 0 ? (
              <div className="text-muted text-sm py-4">No recent applications.</div>
            ) : (
              recentApplications.map((app) => (
                <div key={app.id} className="widget-item">
                  <div className="widget-item-left">
                    <div className="widget-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <h4 className="widget-item-title">{app.first_name} {app.last_name}</h4>
                      <p className="widget-item-subtitle">{app.job_title || 'Unknown Role'}</p>
                    </div>
                  </div>
                  <div className="widget-item-right">
                    <div className="text-xs text-muted mb-1" style={{ textAlign: 'right' }}>
                      {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                    </div>
                    <span className={`status-badge status-${app.status?.toLowerCase() || 'active'}`}>
                      {app.status || 'Active'}
                    </span>
                    <Link to={`/admin/applicants/${app.id}`} className="action-icon-btn">
                      <ArrowRight size={14} className="text-muted" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <h2 className="chart-header">
            <Briefcase size={20} className="text-primary" /> Applicants per Job
          </h2>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.applicantsByJob}
                layout="vertical"
                margin={{ left: 10, right: 40, top: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} vertical={true} />
                <XAxis
                  type="number"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                />
                <YAxis
                  dataKey="job_title"
                  type="category"
                  width={130}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                  }}
                  labelStyle={{ color: '#c7d2fe', fontWeight: 600, marginBottom: '4px' }}
                  itemStyle={{ color: '#a5b4fc' }}
                  formatter={(value: any) => [`${value} applicants`, 'Count']}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                  {stats.applicantsByJob.map((_entry, index) => {
                    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                  <LabelList
                    dataKey="count"
                    position="right"
                    style={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="actions-header">Recent Activity</h2>
          <div className="activity-feed-container" style={{ marginTop: 0, marginBottom: 0 }}>
            {(() => {
              const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
              const allActions = history.flatMap((session: any) =>
                (session.actions || []).map((action: any) => ({
                  description: action.description,
                  timestamp: action.timestamp,
                  user: session.email
                }))
              ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 5);

              if (allActions.length === 0) {
                return <div className="text-muted text-sm py-4">No recent activity recorded.</div>;
              }

              return allActions.map((action: any, i: number) => {
                let Icon = Plus;
                let color = '#6366f1';

                if (action.description.toLowerCase().includes('reject')) { Icon = UserMinus; color = '#ef4444'; }
                else if (action.description.toLowerCase().includes('accept')) { Icon = UserCheck; color = '#10b981'; }
                else if (action.description.toLowerCase().includes('interview')) { Icon = Calendar; color = '#a855f7'; }
                else if (action.description.toLowerCase().includes('merge')) { Icon = GitMerge; color = '#f59e0b'; }
                else if (action.description.toLowerCase().includes('deactivate')) { Icon = UserMinus; color = '#ef4444'; }

                return (
                  <div key={i} className="activity-item">
                    <div className="activity-icon" style={{ background: `${color}20`, color: color }}>
                      <Icon size={16} />
                    </div>
                    <div className="activity-content">
                      <h4>{action.description}</h4>
                      <div className="activity-time">
                        {formatDistanceToNow(new Date(action.timestamp), { addSuffix: true })} • {action.user}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="actions-header">Quick Actions</h2>
        <div className="actions-row">
          <Link to="/admin/jobs" className="btn btn-secondary">
            View All Jobs <ArrowRight size={16} style={{ marginLeft: '8px' }} />
          </Link>
          <Link to="/admin/applicants" className="btn btn-secondary">
            Manage Applicants <Users size={16} style={{ marginLeft: '8px' }} />
          </Link>
          <Link to="/admin/interviews" className="btn btn-secondary">
            Schedule Interview <Calendar size={16} style={{ marginLeft: '8px' }} />
          </Link>
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
