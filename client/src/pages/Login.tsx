import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../lib/supabase';
import {
  User, ArrowRight, ShieldCheck, Sparkles, ChevronLeft,
  Lock, Mail, CheckCircle, Briefcase, Eye, EyeOff, AlertCircle, Building2
} from 'lucide-react';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register } = useAuth();

  const initMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const initRoleParam = searchParams.get('role');
  const initRole = (initRoleParam === 'hr' || initRoleParam === 'applicant') ? initRoleParam : null;
  
  const [selectedRole, setSelectedRole] = useState<'hr' | 'applicant' | null>(initRole);
  const [viewMode, setViewMode] = useState<'login' | 'signup' | 'forgot_password'>(initMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 2-step HR gateway
  const [hrStep, setHrStep] = useState<'pin' | 'form'>('pin');
  const [validatedCompany, setValidatedCompany] = useState<{ id: string; name: string } | null>(null);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({ isOpen: false, title: '', message: '', type: 'success' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleTitle: '',
    companyPin: ''
  });

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  const handleRoleSelect = (role: 'hr' | 'applicant') => {
    setSelectedRole(role);
    setViewMode(role === 'applicant' ? 'signup' : 'login');
    setHrStep('pin');
    setValidatedCompany(null);
    setFormData({ name: '', email: '', password: '', confirmPassword: '', roleTitle: '', companyPin: '' });
  };

  const handleBack = () => {
    if (selectedRole === 'hr' && hrStep === 'form') {
      // Go back to PIN step instead of role selection
      setHrStep('pin');
      setValidatedCompany(null);
      setFormData(prev => ({ ...prev, email: '', password: '', confirmPassword: '', name: '', roleTitle: '' }));
      return;
    }
    setSelectedRole(null);
    setHrStep('pin');
    setValidatedCompany(null);
    setViewMode('login');
    setFormData({ name: '', email: '', password: '', confirmPassword: '', roleTitle: '', companyPin: '' });
  };

  /** Step 1: Validate Company PIN and advance to Step 2 */
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyPin.trim()) return;
    setIsLoading(true);
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: company, error } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('company_pin', formData.companyPin.trim())
        .single();

      if (error || !company) {
        showError('Invalid Company PIN', 'No registered company found with this PIN. Please contact your administrator.');
        return;
      }
      if (company.status !== 'approved') {
        showError('Company Pending', `"${company.name}" has not yet been approved by the platform admin. Please check back later.`);
        return;
      }
      // PIN is valid — advance to Step 2
      setValidatedCompany({ id: company.id, name: company.name });
      setHrStep('form');
    } catch (err: any) {
      showError('Validation Error', err?.message || 'Failed to validate Company PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const showError = (title: string, message: string) => {
    setModalState({ isOpen: true, title, message, type: 'error' });
  };

  const showSuccess = (title: string, message: string) => {
    setModalState({ isOpen: true, title, message, type: 'success' });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !selectedRole) return;

    setIsLoading(true);
    try {
      const profile = await login(formData.email.trim(), formData.password.trim());

      // Validate role matches what user selected
      if (profile.role !== selectedRole) {
        showError('Role Mismatch', `This account is registered as a ${profile.role === 'hr' ? 'Recruiter/HR' : 'Job Seeker'}. Please select the correct role.`);
        setIsLoading(false);
        return;
      }

      if (profile.role === 'hr') {
        navigate('/admin');
      } else {
        navigate('/candidate/dashboard');
      }
    } catch (err: any) {
      const msg = err?.message || 'Invalid email or password. Please try again.';
      if (msg.includes('Email not confirmed')) {
        showError('Confirm Email', 'Please check your inbox and confirm your email before signing in.');
      } else if (msg.includes('Invalid login credentials')) {
        showError('Invalid Credentials', 'The email or password you entered is incorrect.');
      } else {
        showError('Sign In Failed', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name) return;

    if (formData.password !== formData.confirmPassword) {
      showError('Password Mismatch', 'Your passwords do not match. Please try again.');
      return;
    }
    if (formData.password.length < 6) {
      showError('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const profile = await register({
        email: formData.email.trim(),
        password: formData.password.trim(),
        name: formData.name.trim(),
        role: selectedRole!,
        roleTitle: formData.roleTitle.trim() || undefined,
      });

      // HR goes to CompanySetup to manage/join their workspace
      if (profile.role === 'hr') {
        navigate('/company-setup');
      } else {
        navigate('/candidate/dashboard');
      }
    } catch (err: any) {
      const msg = err?.message || 'Registration failed. Please try again.';
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('already been registered')) {
        showError('Already Registered', 'An account with this email already exists. Please sign in.');
      } else {
        showError('Registration Failed', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return;

    setIsLoading(true);
    try {
      await authService.resetPassword(formData.email.trim());
      showSuccess('Reset Link Sent', 'If an account exists for this email, you will receive a password reset link shortly.');
    } catch (err: any) {
      showError('Reset Failed', err?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isHR = selectedRole === 'hr';
  const accentColor = isHR ? '#6366f1' : '#22c55e';
  const accentGradient = isHR
    ? 'linear-gradient(135deg, #6366f1, #a855f7)'
    : 'linear-gradient(135deg, #22c55e, #16a34a)';

  return (
    <div className="login-container">
      {/* Background Ambience */}
      <div className="bg-ambience">
        <div className="bg-orb-purple" />
        <div className="bg-orb-green" />
      </div>

      <div className="login-content">
        {/* Left: Branding */}
        <div className="intro-section">
          <div>
            <span className="intro-badge">
              <Sparkles size={14} style={{ marginRight: '6px', color: '#eab308' }} />
              ApexRecruit Platform
            </span>
            <h1 className="intro-title">
              Hiring <br />
              <span className="gradient-text">Reimagined.</span>
            </h1>
            <p className="intro-desc">
              Connect with top talent or find your dream career. The all-in-one platform for modern recruitment teams.
            </p>
            {/* Trust signals */}
            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['AI-powered resume screening', 'Real-time applicant tracking', 'Automated interview scheduling'].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Form Panel */}
        <div className="right-panel">
          {!selectedRole ? (
            /* Role Selection Cards */
            <div className="selection-cards">
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>Welcome back</h2>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.5rem' }}>Choose your role to continue</p>
              </div>

              <div onClick={() => handleRoleSelect('hr')} className="role-card role-hr">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="icon-box"><ShieldCheck size={28} /></div>
                  <ArrowRight className="arrow-icon" />
                </div>
                <h3 className="card-title">Recruiter / HR</h3>
                <p className="card-desc">Manage jobs, review applicants, and track the hiring pipeline.</p>
              </div>

              <div onClick={() => handleRoleSelect('applicant')} className="role-card role-candidate">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="icon-box"><User size={28} /></div>
                  <ArrowRight className="arrow-icon" />
                </div>
                <h3 className="card-title">Candidate</h3>
                <p className="card-desc">Browse openings, track your applications, and get hired.</p>
              </div>
            </div>
          ) : selectedRole === 'hr' && hrStep === 'pin' ? (
            /* ── STEP 1: Company PIN Gateway ── */
            <div className="login-form">
              <button className="btn-back" onClick={handleBack}>
                <ChevronLeft size={16} style={{ marginRight: '4px' }} />
                Back
              </button>

              <div className="form-header">
                <div className="icon-box" style={{
                  margin: '0 auto 1rem auto',
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  color: '#6366f1',
                  width: 'fit-content'
                }}>
                  <Building2 size={32} />
                </div>
                <h2 className="form-title">Enter Company PIN</h2>
                <p className="form-subtitle">Enter your company's unique PIN to access the HR portal</p>
              </div>

              {/* Step indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.75rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>1</div>
                <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280' }}>2</div>
              </div>

              <form onSubmit={handlePinSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="companyPin">Company PIN</label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      id="companyPin"
                      type="password"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem', letterSpacing: '0.2em', fontSize: '1.1rem' }}
                      placeholder="Enter your company PIN"
                      value={formData.companyPin}
                      onChange={handleChange}
                      autoFocus
                      required
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                    Your Company PIN was provided by the platform admin upon approval.
                  </p>
                </div>

                <button type="submit" className="btn-primary" disabled={isLoading}
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                  {isLoading ? 'Verifying...' : 'Continue →'}
                </button>
              </form>

              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px' }}>
                <h4 style={{ color: '#818cf8', margin: '0 0 0.4rem 0', fontSize: '0.85rem' }}>Don't have a PIN?</h4>
                <p style={{ margin: '0 0 0.6rem 0', color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  Your company must be registered and approved first.{' '}
                  <Link to="/register-company" style={{ color: '#818cf8', textDecoration: 'underline' }}>Register Company →</Link>
                </p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  Already applied and waiting for approval?{' '}
                  <Link to="/track-application" style={{ color: '#a78bfa', textDecoration: 'underline', fontWeight: 500 }}>Track your application status →</Link>
                </p>
              </div>
            </div>

          ) : (
            /* ── STEP 2: Sign In / Sign Up Forms (after PIN validated) ── */
            <div className="login-form">
              <button className="btn-back" onClick={handleBack}>
                <ChevronLeft size={16} style={{ marginRight: '4px' }} />
                Back
              </button>

              {/* Validated company banner */}
              {validatedCompany && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem'
                }}>
                  <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Company Verified</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{validatedCompany.name}</p>
                  </div>
                </div>
              )}

              {/* Step indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>✓</div>
                <div style={{ flex: 1, height: 2, background: 'linear-gradient(90deg, #10b981, #6366f1)', borderRadius: 2 }} />
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>2</div>
              </div>

              {/* Icon + Title */}
              <div className="form-header">
                <div className="icon-box" style={{
                  margin: '0 auto 1rem auto',
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  color: '#6366f1',
                  width: 'fit-content'
                }}>
                  <ShieldCheck size={32} />
                </div>
                <h2 className="form-title">
                  {viewMode === 'login' ? 'Recruiter Sign In' : viewMode === 'signup' ? 'Create HR Account' : 'Reset Password'}
                </h2>
                <p className="form-subtitle">
                  {viewMode === 'login' ? 'Enter your credentials to access your workspace' : viewMode === 'signup' ? 'Fill in your details to get started' : 'Enter your email to request a reset link'}
                </p>
              </div>

              {/* Tab Toggle */}
              <div style={{
                display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
                padding: '4px', marginBottom: '1.75rem', border: '1px solid rgba(255,255,255,0.06)'
              }}>
                {(['login', 'signup'] as const).map((mode) => (
                  <button key={mode} type="button" onClick={() => setViewMode(mode)}
                    style={{
                      flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none',
                      cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.25s ease',
                      background: viewMode === mode ? accentGradient : 'transparent',
                      color: viewMode === mode ? 'white' : '#6b7280',
                      boxShadow: viewMode === mode ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                    }}>
                    {mode === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {/* ======= LOGIN FORM ======= */}
              {viewMode === 'login' && (
                <form onSubmit={handleLoginSubmit}>
                  {/* PIN already validated in Step 1 */}

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="email" type="email" className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="name@company.com"
                        value={formData.email} onChange={handleChange} required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label className="form-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
                      <button type="button" onClick={() => setViewMode('forgot_password')} style={{ background: 'none', border: 'none', color: accentColor, fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="password" type={showPassword ? 'text' : 'password'} className="form-input"
                        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                        placeholder="••••••••"
                        value={formData.password} onChange={handleChange} required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={isLoading}
                    style={{ background: accentGradient }}>
                    {isLoading ? 'Signing in...' : 'Sign In →'}
                  </button>
                </form>
              )}

              {/* ======= SIGNUP FORM ======= */}
              {viewMode === 'signup' && (
                <form onSubmit={handleSignupSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="name" type="text" className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="John Doe"
                        value={formData.name} onChange={handleChange} required
                      />
                    </div>
                  </div>

                  {isHR && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="roleTitle">Your Role Title</label>
                      <div style={{ position: 'relative' }}>
                        <Briefcase size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                          id="roleTitle" type="text" className="form-input"
                          style={{ paddingLeft: '2.5rem' }}
                          placeholder="e.g. Senior Recruiter"
                          value={formData.roleTitle} onChange={handleChange} required
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="email" type="email" className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="name@company.com"
                        value={formData.email} onChange={handleChange} required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="password">Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="password" type={showPassword ? 'text' : 'password'} className="form-input"
                        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                        placeholder="Min. 6 characters"
                        value={formData.password} onChange={handleChange} required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} className="form-input"
                        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword} onChange={handleChange} required
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={isLoading}
                    style={{ background: accentGradient }}>
                    {isLoading ? 'Creating account...' : 'Create Account →'}
                  </button>
                </form>
              )}

              {/* ======= FORGOT PASSWORD FORM ======= */}
              {viewMode === 'forgot_password' && (
                <form onSubmit={handleForgotPasswordSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        id="email" type="email" className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="name@company.com"
                        value={formData.email} onChange={handleChange} required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={isLoading}
                    style={{ background: accentGradient }}>
                    {isLoading ? 'Sending...' : 'Send Reset Link →'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalState.isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className={`modal-icon ${modalState.type}`}>
              {modalState.type === 'success' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
            </div>
            <h3 className="modal-title">{modalState.title}</h3>
            <p className="modal-message">{modalState.message}</p>
            <button
              className={`modal-btn ${modalState.type}`}
              onClick={() => {
                closeModal();
                if (modalState.type === 'success') setViewMode('login');
              }}
            >
              {modalState.type === 'success' ? 'Continue to Sign In' : 'Try Again'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
