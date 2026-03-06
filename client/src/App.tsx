import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Applicants from './pages/Applicants';
import ApplicantDetail from './pages/ApplicantDetail';
import CreateJob from './pages/CreateJob';
import EditJob from './pages/EditJob';
import PublicJobDetail from './pages/PublicJobDetail';
import ApplyJob from './pages/ApplyJob';
import Login from './pages/Login';
import CandidateLayout from './components/CandidateLayout';
import CandidateDashboard from './pages/CandidateDashboard';
import CandidateJobs from './pages/CandidateJobs';
import ApplicationStatus from './pages/ApplicationStatus';
import ProtectedRoute from './components/ProtectedRoute';
import Interviews from './pages/Interviews';
import CandidateInterviews from './pages/CandidateInterviews';
import History from './pages/History';
import CandidateEmails from './pages/CandidateEmails';
import Employees from './pages/Employees';
import CompanySetup from './pages/CompanySetup';
import { useCompany } from './contexts/CompanyContext';
import { useAuth } from './contexts/AuthContext';

/** Redirects HR users without a company to the company setup page */
function CompanyGuard({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  const { company, loading } = useCompany();

  // Still loading company info — let ProtectedRoute's spinner handle this
  if (loading) return null;

  // HR user with no company → send to setup
  if (user.role === 'hr' && !company) {
    return <Navigate to="/company-setup" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/public/jobs/:id" element={<PublicJobDetail />} />
      <Route path="/public/jobs/:id/apply" element={<ApplyJob />} />

      {/* Company Setup route (HR only, authenticated) */}
      <Route path="/company-setup" element={
        <ProtectedRoute allowedRole="hr">
          <CompanySetup />
        </ProtectedRoute>
      } />

      {/* Candidate routes */}
      <Route path="/candidate" element={
        <ProtectedRoute allowedRole="applicant">
          <CandidateLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<CandidateDashboard />} />
        <Route path="jobs" element={<CandidateJobs />} />
        <Route path="emails" element={<CandidateEmails />} />
        <Route path="interviews" element={<CandidateInterviews />} />
        <Route path="applications/:id/status" element={<ApplicationStatus />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Admin/HR routes — guarded by company check */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRole="hr">
          <CompanyGuard>
            <Layout />
          </CompanyGuard>
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/new" element={<CreateJob />} />
        <Route path="jobs/:id/edit" element={<EditJob />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="applicants" element={<Applicants />} />
        <Route path="history" element={<History />} />
        <Route path="applicants/:id" element={<ApplicantDetail />} />
        <Route path="employees" element={<Employees />} />
        <Route path="interviews" element={<Interviews />} />
      </Route>

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

