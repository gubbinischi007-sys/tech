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
import ResetPassword from './pages/ResetPassword';
import Landing from './pages/Landing';
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
import RegisterCompany from './pages/RegisterCompany';
import TrackApplication from './pages/TrackApplication';
import CompanySetup from './pages/CompanySetup';
import { useCompany } from './contexts/CompanyContext';
import { useAuth } from './contexts/AuthContext';
import PlatformAdmin from './pages/PlatformAdmin';
import ReferenceForm from './pages/ReferenceForm';
import AdminLogin from './pages/AdminLogin';

/** Redirects HR users without a company to the company setup page */
function CompanyGuard({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  const { company, loading } = useCompany();

  if (loading) return null;

  if (user.isAuthenticated && user.role !== 'super_admin' && !company && !loading) {
    return <Navigate to="/company-setup" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/platform/login" element={<AdminLogin />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/public/jobs/:id" element={<PublicJobDetail />} />
      <Route path="/public/jobs/:id/apply" element={<ApplyJob />} />
      <Route path="/reference-check/:token" element={<ReferenceForm />} />
      <Route path="/register-company" element={<RegisterCompany />} />
      <Route path="/track-application" element={<TrackApplication />} />

      {/* Platform Admin route (Handles its own security checks and lock screens natively) */}
      <Route path="/platform-admin" element={<PlatformAdmin />} />

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

      {/* Admin/HR routes */}
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

