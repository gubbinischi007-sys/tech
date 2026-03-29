import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, ChevronLeft } from 'lucide-react';
import './AdminLogin.css';

export default function AdminLogin() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const user = await login(email, password);
            if (user.role === 'super_admin') {
                navigate('/platform-admin');
            } else {
                setError('Access denied. This portal is for Platform Administrators only.');
            }
        } catch (err: any) {
            setError(err?.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-bg">
                <div className="bg-gradient" />
            </div>

            <div className="admin-login-card">
                <button className="back-link" onClick={() => navigate('/')}>
                    <ChevronLeft size={16} /> Back to Site
                </button>

                <div className="admin-login-header">
                    <div className="admin-icon-wrapper">
                        <Shield size={32} />
                    </div>
                    <h1>Platform Admin</h1>
                    <p>Enter your credentials to access the management portal.</p>
                </div>

                {error && (
                    <div className="admin-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="admin-form">
                    <div className="admin-field">
                        <label>Admin Email</label>
                        <div className="admin-input-wrapper">
                            <Mail size={18} />
                            <input
                                type="email"
                                placeholder="name@platform.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="admin-field">
                        <label>Password</label>
                        <div className="admin-input-wrapper">
                            <Lock size={18} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="admin-submit-btn" disabled={isLoading}>
                        {isLoading ? 'Verifying...' : (
                            <>
                                Access Portal <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="admin-footer">
                    <p>Protected by platform security. All actions are logged.</p>
                </div>
            </div>
        </div>
    );
}
