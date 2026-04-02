import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, User, LogOut, Hexagon, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import ProfileModal from './ProfileModal';
import { useState } from 'react';
import './Layout.css';

export default function CandidateLayout() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { unreadCount } = useNotification();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const navLinks = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/candidate/jobs', label: 'Browse Jobs', icon: Briefcase },
        { path: '/candidate/dashboard', label: 'My Applications', icon: User },
        { path: '/candidate/interviews', label: 'My Interviews', icon: Briefcase }, // using an icon, maybe Calendar
        { path: '/candidate/emails', label: 'Inbox', icon: Mail, badge: unreadCount },
    ];

    return (
        <div className="layout">
            <nav className="navbar">
                <div className="container">
                    <div className="nav-content">
                        <Link to="/candidate/dashboard" className="logo">
                            <Hexagon fill="#22c55e" stroke="none" className="rotate-90" />
                            <span className="logo-text" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                                Smart<span style={{ color: 'white' }}>Career</span>
                            </span>
                        </Link>
                        <div className="nav-links">
                            {navLinks.map((link: any) => {
                                const isActive = link.path === '/' 
                                    ? location.pathname === '/' 
                                    : location.pathname.startsWith(link.path);

                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                        style={isActive ? { background: '#22c55e', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)', position: 'relative' } : { position: 'relative' }}
                                    >
                                        <link.icon size={16} />
                                        {link.label}
                                        {link.badge > 0 && (
                                            <span style={{
                                                position: 'absolute',
                                                top: '-6px',
                                                right: '-6px',
                                                background: '#ef4444',
                                                color: 'white',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                minWidth: '18px',
                                                height: '18px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0 4px',
                                                border: '2px solid #0f1115',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}>
                                                {link.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}

                            <div className="user-profile">
                                <div className="user-info" onClick={() => setIsProfileOpen(true)} style={{ cursor: 'pointer' }} title="View Profile">
                                    <span className="user-name" style={{ borderBottom: '1px dashed rgba(255,255,255,0.3)' }}>{user.name || 'Candidate'}</span>
                                    <span className="user-role">Applicant</span>
                                </div>
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
