import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, Briefcase, Users2, LogOut, History, UserCheck, Calendar, HelpCircle, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { resetOnboarding } from './OnboardingTour';
import OnboardingTour from './OnboardingTour';
import ProfileModal from './ProfileModal';
import { useState } from 'react';
import './Layout.css';

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const [tourKey, setTourKey] = useState(0);
  const [forceTour, setForceTour] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleRestartTour = () => {
    resetOnboarding();
    setForceTour(true);
    setTourKey(prev => prev + 1); // re-mount to retrigger
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/jobs', label: 'Jobs', icon: Briefcase },
    { path: '/admin/applicants', label: 'Applicants', icon: Users2 },
    { path: '/admin/interviews', label: 'Interviews', icon: Calendar },
    { path: '/admin/employees', label: 'Employees', icon: UserCheck },
    { path: '/admin/history', label: 'History', icon: History },
  ];

  return (
    <div className="layout">
      {/* Onboarding Tour — auto-fires for new users */}
      <OnboardingTour key={tourKey} force={forceTour} onComplete={() => setForceTour(false)} />

      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <Link to="/admin/dashboard" className="logo">
              <img src="/logo.png" alt="ApexRecruit" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px' }} />
              <span className="logo-text">ApexRecruit</span>
              {company && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  color: '#818cf8',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '20px',
                  letterSpacing: '0.01em',
                  marginLeft: '6px',
                  whiteSpace: 'nowrap'
                }}>
                  <Building2 size={10} /> {company.name}
                </span>
              )}
            </Link>
            <div className="nav-links">
              {navLinks.map((link) => {
                const isActive = (link.path === '/admin/dashboard' || link.path === '/')
                  ? location.pathname === link.path
                  : location.pathname.startsWith(link.path);

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <link.icon size={16} />
                    {link.label}
                  </Link>
                );
              })}

              <div className="user-profile">
                <div className="user-info" onClick={() => setIsProfileOpen(true)} style={{ cursor: 'pointer' }} title="View Profile">
                  <span className="user-name" style={{ borderBottom: '1px dashed rgba(255,255,255,0.3)' }}>{user.name || 'HR Manager'}</span>
                  <span className="user-role">{user.roleTitle || 'Recruiter / HR'}</span>
                </div>

                {/* Restart Tour button */}
                <button
                  onClick={handleRestartTour}
                  className="logout-btn"
                  title="Restart Onboarding Tour"
                  style={{ marginRight: '4px' }}
                >
                  <HelpCircle size={16} />
                </button>

                <button
                  onClick={logout}
                  className="logout-btn"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}
