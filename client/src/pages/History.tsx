import { useState, useEffect } from 'react';
import { History as HistoryIcon, Clock, LogIn, LogOut, User, Trash2 } from 'lucide-react';
import { historyApi } from '../services/api';
import './History.css';

interface Action {
    description: string;
    timestamp: string;
}

// ... (interfaces)

interface LoginRecord {
    id: string;
    email: string;
    loginTime: string;
    logoutTime: string | null;
    role: string;
    actions?: Action[];
}

interface ApplicationRecord {
    id: string; // From database
    name: string;
    email: string;
    job_title: string;
    status: 'Accepted' | 'Rejected' | 'Deactivated';
    reason: string;
    date: string;
}

export default function History() {
    const [history, setHistory] = useState<LoginRecord[]>([]);
    const [appHistory, setAppHistory] = useState<ApplicationRecord[]>([]);

    useEffect(() => {
        const loadHistory = async () => {
            // 1. Load Login History (keeping in LS as it's private/local for now)
            const savedHistory = localStorage.getItem('loginHistory');
            if (savedHistory) {
                try {
                    const parsedHistory = JSON.parse(savedHistory);
                    parsedHistory.sort((a: LoginRecord, b: LoginRecord) =>
                        new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
                    );
                    setHistory(parsedHistory);
                } catch (e) {
                    console.error('Failed to parse status history', e);
                }
            }

            try {
                // 2. Fetch Application History from Database
                const response = await historyApi.getAll();
                const dbHistory = response.data || [];

                // 3. Check for legacy LocalStorage items to migrate
                const savedAppHistory = localStorage.getItem('applicationHistory');
                if (savedAppHistory) {
                    try {
                        const localRecords: ApplicationRecord[] = JSON.parse(savedAppHistory);

                        // Find records that aren't in the DB yet (using email + status + job as unique-ish check)
                        const newToMigrate = localRecords.filter(local =>
                            !dbHistory.some((db: any) =>
                                db.email === local.email &&
                                db.status === local.status &&
                                db.job_title === local.job_title
                            )
                        );

                        if (newToMigrate.length > 0) {
                            console.log(`Migrating ${newToMigrate.length} local records to database...`);
                            await Promise.all(newToMigrate.map(record =>
                                historyApi.create({
                                    name: record.name,
                                    email: record.email,
                                    job_title: record.job_title,
                                    status: record.status,
                                    reason: record.reason
                                })
                            ));

                            // Re-fetch now that we've migrated
                            const refreshedResponse = await historyApi.getAll();
                            setAppHistory(refreshedResponse.data);
                        } else {
                            setAppHistory(dbHistory);
                        }

                        // Clear LS after successful migration/check to prevent background loops
                        localStorage.removeItem('applicationHistory');
                    } catch (e) {
                        console.error('Migration failed', e);
                        setAppHistory(dbHistory);
                    }
                } else {
                    setAppHistory(dbHistory);
                }
            } catch (error) {
                console.error('Failed to fetch app history from database', error);
                // Fallback demo history for preview
                setAppHistory([
                    { id: '1', name: 'James Wilson', email: 'james.w@example.com', job_title: 'Backend Developer', status: 'Accepted', reason: 'Strong technical assessment performance.', date: new Date(Date.now() - 86400000).toISOString() },
                    { id: '2', name: 'Maria Garcia', email: 'm.garcia@example.com', job_title: 'UX Designer', status: 'Rejected', reason: 'Insufficient experience with mobile design systems.', date: new Date(Date.now() - 172800000).toISOString() },
                    { id: '3', name: 'Alex Thompson', email: 'alex.t@example.com', job_title: 'Senior Frontend Engineer', status: 'Accepted', reason: 'Excellent system design skills.', date: new Date(Date.now() - 259200000).toISOString() },
                    { id: '4', name: 'Sarah Miller', email: 's.miller@example.com', job_title: 'Product Manager', status: 'Deactivated', reason: 'Applicant withdrew after initial screening.', date: new Date(Date.now() - 432000000).toISOString() }
                ]);
            }
        };

        loadHistory();
        window.addEventListener('storage', loadHistory);
        const interval = setInterval(loadHistory, 3000);

        return () => {
            window.removeEventListener('storage', loadHistory);
            clearInterval(interval);
        };
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleDeleteRecord = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await historyApi.delete(id);
            setAppHistory(prev => prev.filter(record => record.id !== id));
        } catch (error) {
            console.error('Failed to delete history record:', error);
            alert('Failed to delete record');
        }
    };

    return (
        <div className="history-container">
            <div className="history-header">
                <h1 className="history-title">History & Logs</h1>
                <p className="history-subtitle">
                    Track system access and applicant decision history.
                </p>
            </div>

            {/* Stats Row */}
            <div className="history-stats">
                <div className="stat-card">
                    <div className="stat-icon bg-blue">
                        <User size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{new Set(history.map(h => h.email)).size}</span>
                        <span className="stat-label">System Users</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-purple">
                        <HistoryIcon size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{appHistory.length}</span>
                        <span className="stat-label">Processed Applications</span>
                    </div>
                </div>
            </div>

            {/* Application History Section */}
            <div className="history-section mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 m-0">
                        <User size={20} className="text-primary" /> Application Decisions
                    </h2>
                </div>

                <div className="history-list">
                    {appHistory.length === 0 ? (
                        <div className="empty-state">
                            <HistoryIcon size={48} />
                            <h3>No application history</h3>
                            <p>Accepted or rejected applications will appear here.</p>
                        </div>
                    ) : (
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Applicant</th>
                                    <th>Job Position</th>
                                    <th>Status</th>
                                    <th>Reason / Note</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appHistory.map((record) => (
                                    <tr key={record.id}>
                                        <td className="user-cell">
                                            <div className="user-avatar" style={{
                                                background: record.status === 'Accepted' ? '#10b981' :
                                                    record.status === 'Deactivated' ? '#f59e0b' : '#ef4444'
                                            }}>
                                                {record.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{record.name}</div>
                                                <div className="text-xs text-muted">{record.email}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-sm text-gray-300">{record.job_title}</span>
                                        </td>
                                        <td>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${record.status === 'Accepted'
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : record.status === 'Deactivated'
                                                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: '300px' }}>
                                            <p className="text-sm text-gray-400 truncate" title={record.reason}>
                                                {record.reason || '-'}
                                            </p>
                                        </td>
                                        <td>
                                            <div className="text-sm text-gray-400">
                                                {formatDate(record.date)}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                {formatTime(record.date)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Login History Section */}
            <div className="history-section">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-primary" /> Login Activity
                </h2>
                <div className="history-list">
                    {/* ... existing login history table ... */}
                    {history.length === 0 ? (
                        <div className="empty-state">
                            <Clock size={48} />
                            <h3>No login history available</h3>
                            <p>Login activity will appear here.</p>
                        </div>
                    ) : (
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Session Info</th>
                                    <th>Actions Performed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((record) => (
                                    <tr key={record.id}>
                                        <td className="user-cell" style={{ verticalAlign: 'top', paddingTop: '1.5rem' }}>
                                            <div className="user-avatar">
                                                {record.email.charAt(0).toUpperCase()}
                                            </div>
                                            <span>{record.email}</span>
                                        </td>
                                        <td style={{ verticalAlign: 'top', paddingTop: '1.5rem' }}>
                                            <span className="role-badge">{record.role}</span>
                                        </td>
                                        <td style={{ verticalAlign: 'top', paddingTop: '1.5rem' }}>
                                            <div className="time-cell" style={{ marginBottom: '0.5rem' }}>
                                                <LogIn size={14} className="text-green" />
                                                <div>
                                                    <div className="date">{formatDate(record.loginTime)}</div>
                                                    <div className="time">{formatTime(record.loginTime)}</div>
                                                </div>
                                            </div>
                                            <div className="time-cell">
                                                {record.logoutTime ? (
                                                    <>
                                                        <LogOut size={14} className="text-red" />
                                                        <div>
                                                            <div className="date">{formatDate(record.logoutTime)}</div>
                                                            <div className="time">{formatTime(record.logoutTime)}</div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="status-active">Active Now</span>
                                                )}
                                            </div>
                                            {record.logoutTime && (
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', paddingLeft: '22px' }}>
                                                    Duration: {(() => {
                                                        const diff = new Date(record.logoutTime).getTime() - new Date(record.loginTime).getTime();
                                                        const minutes = Math.floor(diff / 60000);
                                                        if (minutes < 60) return `${minutes}m`;
                                                        const hours = Math.floor(minutes / 60);
                                                        return `${hours}h ${minutes % 60}m`;
                                                    })()}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {record.actions && record.actions.length > 0 ? (
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                    {record.actions.map((action, idx) => (
                                                        <li key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                            <span style={{ color: '#6366f1', marginTop: '4px' }}>•</span>
                                                            <span>{action.description} <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>({formatTime(action.timestamp)})</span></span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span style={{ color: '#6b7280', fontSize: '0.875rem', fontStyle: 'italic' }}>No actions recorded</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
