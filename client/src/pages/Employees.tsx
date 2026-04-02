import { useEffect, useState, useRef } from 'react';
import { employeesApi } from '../services/api';
import { Users, Search, Calendar, Briefcase, Mail, UserMinus, X } from 'lucide-react';
import { logApplicationDecision, logAction } from '../utils/historyLogger';
import ConfirmationModal from '../components/ConfirmationModal';
import StatusModal from '../components/StatusModal';
import './Employees.css';

interface Employee {
    id: string;
    name: string;
    email: string;
    job_title: string;
    department: string;
    hired_date: string;
    status: 'active' | 'inactive';
}

export default function Employees() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'success' | 'danger' | 'delete' | 'info' | 'warning';
        title: string;
        message: string;
        confirmLabel: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        type: 'danger',
        title: '',
        message: '',
        confirmLabel: 'Confirm',
        onConfirm: () => { },
    });

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
        loadEmployees();

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const loadEmployees = async () => {
        try {
            const response = await employeesApi.getAll();
            setEmployees(response.data || []);
        } catch (error) {
            console.error('Failed to load employees:', error);
            // Fallback demo employees for preview
            setEmployees([
                { id: '1', name: 'James Wilson', email: 'james.w@example.com', job_title: 'Senior Backend Engineer', department: 'Engineering', hired_date: new Date(Date.now() - 31536000000).toISOString(), status: 'active' },
                { id: '2', name: 'Maria Garcia', email: 'm.garcia@example.com', job_title: 'UX Lead', department: 'Design', hired_date: new Date(Date.now() - 15768000000).toISOString(), status: 'active' },
                { id: '3', name: 'Alex Thompson', email: 'alex.t@example.com', job_title: 'Frontend Developer', department: 'Engineering', hired_date: new Date(Date.now() - 7884000000).toISOString(), status: 'active' },
                { id: '4', name: 'Sarah Miller', email: 's.miller@example.com', job_title: 'Talent Acquisition', department: 'HR', hired_date: new Date(Date.now() - 3942000000).toISOString(), status: 'active' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = (employee: Employee) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Deactivate Employee?',
            message: `Are you sure you want to deactivate ${employee.name}? They will be removed from the employee directory and moved to history.`,
            confirmLabel: 'Deactivate',
            onConfirm: async () => {
                try {
                    // 1. Log to History as a termination/status change
                    await logApplicationDecision({
                        name: employee.name,
                        email: employee.email,
                        job_title: employee.job_title || 'Employee',
                        status: 'Deactivated', // Representing termination in history
                        reason: 'Employee deactivated/terminated from the company.'
                    });

                    // 2. Log to Activity (Login history)
                    logAction(`Removed employee: ${employee.name} (${employee.email})`);

                    // 3. Remove from Employees table
                    await employeesApi.delete(employee.id);

                    // 4. Refresh list
                    loadEmployees();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));

                    setStatusModal({
                        isOpen: true,
                        type: 'success',
                        title: 'Employee Deactivated',
                        message: `${employee.name} has been successfully deactivated.`
                    });

                } catch (error) {
                    console.error('Failed to deactivate employee:', error);
                    setStatusModal({
                        isOpen: true,
                        type: 'error',
                        title: 'Action Failed',
                        message: 'Failed to deactivate employee. Please try again.'
                    });
                }
            }
        });
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
            </div>
        );
    }

    return (
        <div className="employees-page animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-gradient">Employee Directory</h1>
                    <p className="text-muted">Manage your organization's workforce.</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Potential Add Employee Button Here */}
                </div>
            </div>

            <div className="search-container-premium mb-8">
                <div className="search-wrapper">
                    <Search className="search-icon-left" size={20} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search employees by name, email, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input-premium"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="search-clear-btn"
                        >
                            <X size={16} />
                        </button>
                    )}
                    <div className="search-shortcut">
                        <kbd>⌘</kbd>K
                    </div>
                </div>
            </div>

            <div className="card p-0 overflow-hidden">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Contact</th>
                            <th>Role</th>
                            <th>Department</th>
                            <th>Joined Date</th>
                            <th>Status</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="empty-state">
                                    <div className="flex flex-col items-center">
                                        <Users size={48} className="mb-4 opacity-20" />
                                        <p>No employees found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredEmployees.map((employee) => (
                                <tr key={employee.id} className="employee-row">
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-white tracking-wide" style={{ fontSize: '15px' }}>
                                                {employee.name
                                                    .trim()
                                                    .split(/\s+/)
                                                    .map(word => {
                                                        let w = word.toLowerCase();
                                                        // Remove redundant leading character if it's a double-start (like pprabs)
                                                        if (w.match(/^([a-z])\1/)) w = w.substring(1);
                                                        return w.charAt(0).toUpperCase() + w.slice(1);
                                                    })
                                                    .join(' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 text-sm text-muted">
                                            <Mail size={14} />
                                            {employee.email}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 text-sm text-muted">
                                            <Briefcase size={14} />
                                            {employee.job_title || '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-sm text-muted">{employee.department || '-'}</span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 text-sm text-muted">
                                            <Calendar size={14} />
                                            {new Date(employee.hired_date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${employee.status}`}>
                                            {employee.status}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <button
                                            onClick={() => handleDeactivate(employee)}
                                            className="btn btn-sm"
                                            title="Deactivate Employee"
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                transition: 'all 0.2s',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                cursor: 'pointer'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                            }}
                                        >
                                            <UserMinus size={14} /> Deactivate
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmLabel={confirmModal.confirmLabel}
            />

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
