import { Link } from 'react-router-dom';
import { Sparkles, Users, Briefcase, BarChart3, CheckCircle, ArrowRight, Zap, Shield, Building2, Star, ChevronRight } from 'lucide-react';
import './Landing.css';

const features = [
    {
        icon: <Briefcase size={24} />,
        title: 'Smart Job Management',
        desc: 'Create, manage, and publish job postings with AI-powered descriptions. Track every position from creation to hire.',
        color: '#6366f1',
    },
    {
        icon: <Users size={24} />,
        title: 'Applicant Pipeline',
        desc: 'Visualize your entire hiring pipeline. Move candidates through stages with one click and never lose track of great talent.',
        color: '#8b5cf6',
    },
    {
        icon: <BarChart3 size={24} />,
        title: 'Real-time Analytics',
        desc: 'Get deep insights into your hiring funnel — time-to-hire, source analytics, and applicant conversion rates.',
        color: '#06b6d4',
    },
    {
        icon: <Zap size={24} />,
        title: 'Cal.com Scheduling',
        desc: 'Instantly schedule interviews with candidates using deep Cal.com integration. No back-and-forth emails needed.',
        color: '#f59e0b',
    },
    {
        icon: <Shield size={24} />,
        title: 'Multi-Company Portal',
        desc: 'Run multiple companies from one platform. Each workspace is fully isolated with invite-code based team management.',
        color: '#10b981',
    },
    {
        icon: <Building2 size={24} />,
        title: 'Candidate Portal',
        desc: 'A beautiful self-service portal for applicants to track their application status, view interviews, and manage emails.',
        color: '#ec4899',
    },
];

const stats = [
    { number: '10x', label: 'Faster Hiring' },
    { number: '95%', label: 'Less Admin Work' },
    { number: '∞', label: 'Companies Supported' },
    { number: '24/7', label: 'Always Available' },
];

const testimonials = [
    {
        name: 'Sarah K.',
        role: 'Head of Talent, TechCorp',
        text: 'ApexRecruit cut our time-to-hire by 60%. The multi-company portal is a game changer for our agency.',
        avatar: 'SK',
    },
    {
        name: 'Rajan M.',
        role: 'Founder, HireFirst',
        text: 'The Cal.com integration alone saves us 2 hours per day. Scheduling interviews has never been this smooth.',
        avatar: 'RM',
    },
    {
        name: 'Priya L.',
        role: 'HR Manager, BuildCo',
        text: 'Best ATS I have ever used. The analytics dashboard finally gives us visibility into our entire pipeline.',
        avatar: 'PL',
    },
];

export default function Landing() {
    return (
        <div className="landing">
            {/* ── NAVBAR ─────────────────────────────── */}
            <nav className="landing-nav">
                <div className="nav-inner">
                    <Link to="/" className="nav-logo">
                        <img src="/logo.png" alt="ApexRecruit" />
                        <span>ApexRecruit</span>
                    </Link>
                    <div className="nav-links-landing">
                        <a href="#features">Features</a>
                        <a href="#stats">Why Us</a>
                        <a href="#testimonials">Reviews</a>
                        <Link to="/track-application" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.95rem' }}>Track Application</Link>
                    </div>
                    <div className="nav-cta-group">
                        <Link to="/admin" className="nav-signin">View Demo</Link>
                        <Link to="/admin" className="nav-signup-btn">Go to Dashboard <ChevronRight size={14} /></Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO ───────────────────────────────── */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-orb hero-orb-1" />
                    <div className="hero-orb hero-orb-2" />
                    <div className="hero-orb hero-orb-3" />
                    <div className="hero-grid" />
                </div>

                <div className="hero-content">
                    <div className="hero-badge">
                        <Sparkles size={14} />
                        AI-Powered Applicant Tracking System
                    </div>

                    <h1 className="hero-title">
                        Hire Smarter,<br />
                        <span className="hero-gradient">Not Harder.</span>
                    </h1>

                    <p className="hero-subtitle">
                        ApexRecruit is the all-in-one recruitment platform for modern HR teams.
                        Manage jobs, track applicants, schedule interviews, and make data-driven hiring decisions — all in one beautiful workspace.
                    </p>

                    <div className="hero-actions">
                        <Link to="/admin" className="btn-hero-primary">
                            Explore Dashboard <ArrowRight size={18} />
                        </Link>
                        <Link to="/admin" className="btn-hero-secondary">
                            View HR Portal
                        </Link>
                    </div>

                    <div className="hero-proof">
                        <div className="avatars">
                            {['A', 'B', 'C', 'D'].map(l => (
                                <div key={l} className="avatar-small">{l}</div>
                            ))}
                        </div>
                        <span>Trusted by <strong>500+ HR teams</strong> worldwide</span>
                    </div>
                </div>

                {/* Dashboard mockup */}
                <div className="hero-mockup">
                    <div className="mockup-window">
                        <div className="mockup-titlebar">
                            <span className="dot red" /><span className="dot yellow" /><span className="dot green" />
                            <span className="mockup-url">apexrecruit.app/admin/dashboard</span>
                        </div>
                        <div className="mockup-body">
                            <div className="mock-sidebar">
                                {['Dashboard', 'Jobs', 'Applicants', 'Interviews', 'Analytics'].map(item => (
                                    <div key={item} className={`mock-nav-item ${item === 'Dashboard' ? 'active' : ''}`}>{item}</div>
                                ))}
                            </div>
                            <div className="mock-main">
                                <div className="mock-stat-row">
                                    {[{ l: 'Open Roles', v: '12' }, { l: 'Applicants', v: '248' }, { l: 'Interviews', v: '34' }].map(s => (
                                        <div key={s.l} className="mock-stat">
                                            <div className="mock-stat-value">{s.v}</div>
                                            <div className="mock-stat-label">{s.l}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mock-chart">
                                    {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
                                        <div key={i} className="mock-bar" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                                <div className="mock-list">
                                    {['Sarah Chen — Senior Dev', 'Rajan Mehta — Designer', 'Priya Lin — PM'].map(n => (
                                        <div key={n} className="mock-list-item">
                                            <div className="mock-avatar">{n[0]}</div>
                                            <div className="mock-name">{n}</div>
                                            <div className="mock-badge">New</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── STATS ──────────────────────────────── */}
            <section className="stats-section" id="stats">
                <div className="stats-inner">
                    {stats.map(s => (
                        <div key={s.label} className="stat-card">
                            <div className="stat-number">{s.number}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES ───────────────────────────── */}
            <section className="features-section" id="features">
                <div className="section-inner">
                    <div className="section-header">
                        <div className="section-badge">Everything You Need</div>
                        <h2>Recruitment, <span className="gradient-text">Reimagined</span></h2>
                        <p>From posting your first job to making the hire — ApexRecruit handles everything with AI-powered precision.</p>
                    </div>

                    <div className="features-grid">
                        {features.map(f => (
                            <div key={f.title} className="feature-card">
                                <div className="feature-icon" style={{ background: `${f.color}20`, color: f.color }}>
                                    {f.icon}
                                </div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ───────────────────────── */}
            <section className="how-section">
                <div className="section-inner">
                    <div className="section-header">
                        <div className="section-badge">Simple Setup</div>
                        <h2>Up and Running <span className="gradient-text">in Minutes</span></h2>
                    </div>

                    <div className="steps">
                        {[
                            { n: '01', title: 'Create Your Workspace', desc: 'Sign up as HR, create your company workspace, and get a unique invite code for your team.' },
                            { n: '02', title: 'Post Jobs', desc: 'Add job listings with rich descriptions. Share the public link on LinkedIn, job boards, or your website.' },
                            { n: '03', title: 'Review & Schedule', desc: 'Applicants apply online. Review their profiles, change their status, and schedule interviews with Cal.com.' },
                            { n: '04', title: 'Hire the Best', desc: 'Use the analytics dashboard to make data-driven decisions and close great candidates faster.' },
                        ].map(step => (
                            <div key={step.n} className="step-card">
                                <div className="step-number">{step.n}</div>
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ───────────────────────── */}
            <section className="testimonials-section" id="testimonials">
                <div className="section-inner">
                    <div className="section-header">
                        <div className="section-badge">Loved by HR Teams</div>
                        <h2>Real Teams, <span className="gradient-text">Real Results</span></h2>
                    </div>

                    <div className="testimonials-grid">
                        {testimonials.map(t => (
                            <div key={t.name} className="testimonial-card">
                                <div className="testimonial-stars">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                                </div>
                                <p className="testimonial-text">"{t.text}"</p>
                                <div className="testimonial-author">
                                    <div className="testimonial-avatar">{t.avatar}</div>
                                    <div>
                                        <div className="testimonial-name">{t.name}</div>
                                        <div className="testimonial-role">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ────────────────────────────────── */}
            <section className="cta-section">
                <div className="cta-inner">
                    <div className="cta-orb" />
                    <img src="/logo.png" alt="ApexRecruit" className="cta-logo" />
                    <h2>Ready to Transform Your Hiring?</h2>
                    <p>Join hundreds of companies using ApexRecruit to hire faster, smarter, and better.</p>
                    <div className="cta-actions">
                        <Link to="/admin" className="btn-hero-primary">
                            Go to Dashboard — It's Free <ArrowRight size={18} />
                        </Link>
                    </div>
                    <div className="cta-features">
                        {['No credit card required', 'Free forever plan', 'Unlimited applicants'].map(f => (
                            <div key={f} className="cta-feature">
                                <CheckCircle size={14} color="#10b981" /> {f}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FOOTER ─────────────────────────────── */}
            <footer className="landing-footer">
                <div className="footer-inner">
                    <div className="footer-logo">
                        <img src="/logo.png" alt="ApexRecruit" />
                        <span>ApexRecruit</span>
                    </div>
                    <p className="footer-tagline">AI-Powered Recruitment Platform</p>
                    <div className="footer-links">
                        <Link to="/admin">Dashboard</Link>
                        <Link to="/admin">HR Portal</Link>
                        <Link to="/track-application">Track Application</Link>
                        <Link to="/register-company">Register Company</Link>
                    </div>
                    <p className="footer-copy">© 2026 ApexRecruit. Built with ❤️ for modern HR teams.</p>
                </div>
            </footer>
        </div>
    );
}
