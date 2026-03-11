import { X, User, Mail, Briefcase, Building2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import './ProfileModal.css';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user } = useAuth();
    const { company } = useCompany();

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', background: '#0f1115', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <button className="modal-close" onClick={onClose} style={{ top: '15px', right: '15px' }}>
                    <X size={20} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'white'
                    }}>
                        <span style={{ fontSize: '2rem', fontWeight: 700 }}>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.25rem' }}>{user.name || 'User'}</h2>
                    <span style={{
                        display: 'inline-flex', padding: '4px 12px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', fontSize: '0.8rem', fontWeight: 500, border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                        {user.role === 'hr' ? 'HR / Recruiter' : 'Candidate'}
                    </span>
                </div>

                <div className="profile-details" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                        <Mail size={18} style={{ color: '#94a3b8' }} />
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Email Address</div>
                            <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 500 }}>{user.email}</div>
                        </div>
                    </div>

                    {user.role === 'hr' && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                <Briefcase size={18} style={{ color: '#94a3b8' }} />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Job Title</div>
                                    <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 500 }}>{user.roleTitle || 'HR Professional'}</div>
                                </div>
                            </div>

                            {company && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '12px 16px', background: 'rgba(99,102,241,0.05)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.1)' }}>
                                    <Building2 size={18} style={{ color: '#818cf8' }} />
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#818cf8', marginBottom: '2px' }}>Company</div>
                                        <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 500 }}>{company.name}</div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '12px 16px', background: 'rgba(16,185,129,0.05)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.1)' }}>
                        <ShieldCheck size={18} style={{ color: '#34d399' }} />
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#34d399', marginBottom: '2px' }}>Account Status</div>
                            <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 500 }}>Verified & Active</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
