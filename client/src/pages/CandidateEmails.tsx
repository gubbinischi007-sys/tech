import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { notificationsApi, applicantsApi, employeesApi, historyApi } from '../services/api';
import { Link } from 'react-router-dom';
import { Mail, Clock, CheckCircle, AlertCircle, ArrowLeft, XCircle, Trash2, CheckSquare, Square } from 'lucide-react';
import { logApplicationDecision } from '../utils/historyLogger';
import ConfirmationModal from '../components/ConfirmationModal';
import StatusModal from '../components/StatusModal';

interface EmailNotification {
    id: string;
    subject: string;
    message: string; // HTML content
    type: string;
    is_read: number;
    created_at: string;
}

export default function CandidateEmails() {
    const { user } = useAuth();
    const { refreshUnreadCount } = useNotification();
    const [emails, setEmails] = useState<EmailNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null);
    const [offerRules, setOfferRules] = useState<string | null>(null);
    const [applicantOfferStatus, setApplicantOfferStatus] = useState<string | null>(null);
    const [applicant, setApplicant] = useState<any>(null);
    const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());

    // Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'success' | 'danger' | 'delete';
        title: string;
        message: string;
        confirmLabel: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        type: 'success',
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
        loadEmails();
        const interval = setInterval(loadEmails, 3000); // Poll every 3 seconds for near real-time updates
        return () => clearInterval(interval);
    }, [user.email]);

    const loadEmails = async () => {
        if (!user.email) return;
        try {
            const response = await notificationsApi.getAll(user.email);
            // Ensure emails are sorted by newest first
            const sortedEmails = response.data.sort((a: EmailNotification, b: EmailNotification) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setEmails(sortedEmails);
        } catch (error) {
            console.error("Failed to load emails", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSingle = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Delete Message',
            message: "Are you sure you want to delete this message? This action cannot be undone.",
            confirmLabel: 'Delete',
            onConfirm: async () => {
                try {
                    await notificationsApi.delete(id);
                    setEmails(prev => prev.filter(e => e.id !== id));
                    if (selectedEmail?.id === id) setSelectedEmail(null);
                    setSelectedEmailIds(prev => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                    });
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    refreshUnreadCount();
                } catch (error) {
                    console.error("Failed to delete email", error);
                    setStatusModal({
                        isOpen: true,
                        type: 'error',
                        title: 'Delete Failed',
                        message: 'Failed to delete message. Please try again.'
                    });
                }
            }
        });
    };

    const handleDeleteBulk = async () => {
        if (selectedEmailIds.size === 0) return;

        // Snapshot the IDs to ensure stability in the callback
        const idsToDelete = Array.from(selectedEmailIds);

        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Delete Messages',
            message: `Are you sure you want to delete ${idsToDelete.length} selected messages? This action cannot be undone.`,
            confirmLabel: `Delete ${idsToDelete.length} Selected`,
            onConfirm: async () => {
                try {
                    await notificationsApi.deleteBulk(idsToDelete);
                    setEmails(prev => prev.filter(e => !idsToDelete.includes(e.id)));
                    setSelectedEmailIds(new Set());
                    // If the currently viewed email was deleted, close the view
                    if (selectedEmail && idsToDelete.includes(selectedEmail.id)) {
                        setSelectedEmail(null);
                    }
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    refreshUnreadCount();
                } catch (error) {
                    console.error("Failed to bulk delete emails", error);
                    setStatusModal({
                        isOpen: true,
                        type: 'error',
                        title: 'Delete Failed',
                        message: 'Failed to delete selected messages. Please try again.'
                    });
                }
            }
        });
    };

    const toggleSelectAll = () => {
        if (selectedEmailIds.size === emails.length) {
            setSelectedEmailIds(new Set());
        } else {
            setSelectedEmailIds(new Set(emails.map(e => e.id)));
        }
    };

    const toggleSelectEmail = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedEmailIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    useEffect(() => {
        const checkOfferStatus = async () => {
            if (selectedEmail && selectedEmail.subject.toLowerCase().includes('offer')) {
                const match = selectedEmail.message.match(/candidate\/applications\/([a-zA-Z0-9-]+)\/status/);
                const applicantId = match ? match[1] : null;

                try {
                    // 1. Try to get current applicant record
                    if (applicantId) {
                        const res = await applicantsApi.getById(applicantId);
                        if (res.data) {
                            setOfferRules(res.data.offer_rules || null);
                            setApplicantOfferStatus(res.data.offer_status || 'pending');
                            setApplicant(res.data);
                            return; // Found current record
                        }
                    }
                } catch (err) {
                    console.error("Applicant record not found, checking history...", err);
                }

                // 2. Fallback: Check history if record is gone or missing
                try {
                    const historyRes = await historyApi.getAll(user.email!);
                    const history = historyRes.data || [];

                    // Match by job title since notification usually has it
                    // Extract job title from subject: "Job Offer from Smart-Cruiter" -> might need better matching
                    // Actually, notifications usually contain the job title in the message
                    const historyRecord = history.find((h: any) =>
                        selectedEmail.message.includes(h.job_title) ||
                        selectedEmail.subject.includes(h.job_title)
                    );

                    if (historyRecord) {
                        setApplicantOfferStatus(historyRecord.status.toLowerCase());
                        setApplicant({ ...historyRecord, id: applicantId }); // Partial mock
                    } else {
                        setApplicantOfferStatus(null);
                        setApplicant(null);
                    }
                } catch (historyErr) {
                    console.error("Failed to check history", historyErr);
                    setApplicantOfferStatus(null);
                    setApplicant(null);
                }
            } else {
                setOfferRules(null);
                setApplicantOfferStatus(null);
                setApplicant(null);
            }
        };

        checkOfferStatus();
    }, [selectedEmail, user.email]);

    return (
        <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>

            {/* Conditional Rendering: Detail View or List View */}
            {selectedEmail ? (
                // --- DETAIL VIEW ---
                <div className="animate-fade-in">
                    {/* Header */}
                    <div className="mb-6 flex items-center">
                        <button
                            onClick={() => setSelectedEmail(null)}
                            style={{ background: 'transparent', border: 'none', color: '#cbd5e1', padding: '0' }}
                            className="flex items-center gap-2 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={18} />
                            Back to Inbox
                        </button>
                        <button
                            onClick={() => handleDeleteSingle(selectedEmail.id)}
                            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#ef4444' }}
                            className="flex items-center gap-2 hover:text-red-400 transition-colors"
                        >
                            <Trash2 size={18} />
                            Delete
                        </button>
                    </div>

                    {/* Email Content Card */}
                    <div style={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', minHeight: '60vh', maxWidth: '1000px', margin: '0 auto' }} className="rounded-xl shadow-2xl">
                        {/* Email Header - Strict Vertical Layout */}
                        <div className="border-b border-[#ffffff10]" style={{ background: 'linear-gradient(to bottom, #334155, #1e293b)', padding: '60px 60px 20px 60px' }}>

                            {/* 1. Job Offer Title */}
                            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
                                {selectedEmail.subject}
                            </h1>

                            {/* 2. Sender */}
                            <p className="text-xl text-gray-200 font-medium mb-2">
                                Smart-Cruiter Team
                            </p>

                            {/* 3. Date and Time */}
                            <div className="flex items-center gap-2 text-gray-400 text-md mb-2">
                                <Clock size={16} />
                                <span>
                                    {(() => {
                                        let dateStr = selectedEmail.created_at;
                                        // If missing 'T' or 'Z', it's likely the old SQLite format, append Z for UTC
                                        if (!dateStr.includes('T') && !dateStr.includes('Z')) {
                                            dateStr = dateStr.replace(' ', 'T') + 'Z';
                                        }
                                        return new Date(dateStr).toLocaleString(undefined, {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });
                                    })()}
                                </span>
                            </div>
                        </div>

                        {/* Email Body */}
                        <div style={{ backgroundColor: 'transparent', padding: '10px 60px 60px 60px' }}>
                            {/* 4. Content (Congratulations...) */}
                            <div className="prose prose-invert max-w-none text-gray-300 space-y-6 text-xs [&_*]:text-xs leading-relaxed">
                                <div dangerouslySetInnerHTML={{
                                    __html: selectedEmail.message
                                        .replace(
                                            'Please log in to your candidate dashboard to view the full offer letter and accept/reject it.',
                                            ''
                                        )
                                        .replace('Offer Details:', '<div style="margin-top: 20px; margin-bottom: 10px; font-weight: bold; font-size: 1.1em; font-family: \'Outfit\', sans-serif; color: white;">Offer Details:</div>')
                                        .replace('Best regards,', '<div style="margin-top: 40px;">Best regards,</div>')
                                        .replace('The Smart-Cruiter Team', '<div style="margin-top: -10px;">The Smart-Cruiter Team</div>')
                                        // Remove the generic "View Offer Details" button to keep user on this page (using custom actions instead)
                                        .replace(/<a\s+[^>]*>[\s\S]*?View Offer Details[\s\S]*?<\/a>/gi, '')
                                        // Inject rules below Joining Date (which is the end of the UL)
                                        .replace('</ul>', '</ul>' + (offerRules ? `
                                            <div style="margin-top: 30px; padding: 60px; background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;">
                                                <h3 style="color: white; font-weight: bold; font-size: 1.1em; margin-bottom: 30px; font-family: 'Outfit', sans-serif;">Company Rules & Regulations</h3>
                                                <div style="color: #cbd5e1; font-size: 0.9em; white-space: pre-wrap; line-height: 2.0;">${offerRules}</div>
                                            </div>
                                        ` : ''))
                                }} />
                            </div>

                            {/* Action Area (for Offers) */}
                            {selectedEmail.subject.toLowerCase().includes('offer') && selectedEmail.message.includes('candidate/applications/') && applicantOfferStatus === 'pending' && (
                                <div className="border-t border-[#ffffff10] pt-8" style={{ marginTop: '30px' }}>
                                    <div className="bg-[#1e293b]/40 rounded-xl p-8 border border-[#ffffff08]">
                                        <h3 className="text-lg font-semibold text-white mb-6 uppercase tracking-wider text-sm opacity-80">
                                            Please Respond to Offer
                                        </h3>

                                        <div style={{ display: 'flex', gap: '20px', marginTop: '30px', flexDirection: 'row', width: '100%', maxWidth: '600px' }}>
                                            <button
                                                style={{
                                                    flex: 1,
                                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    padding: '16px 32px',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 4px 14px 0 rgba(16,185,129,0.39)',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '15px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '10px',
                                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.23)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(16,185,129,0.39)';
                                                }}
                                                onClick={() => {
                                                    const match = selectedEmail.message.match(/candidate\/applications\/([a-zA-Z0-9-]+)\/status/);
                                                    if (match && match[1]) {
                                                        setConfirmModal({
                                                            isOpen: true,
                                                            type: 'success',
                                                            title: 'Accept Offer?',
                                                            message: "Are you sure you want to ACCEPT this offer?",
                                                            confirmLabel: 'Accept Now',
                                                            onConfirm: async () => {
                                                                try {
                                                                    await applicantsApi.respondToOffer(match[1], 'accepted');
                                                                    setStatusModal({
                                                                        isOpen: true,
                                                                        type: 'success',
                                                                        title: 'Congratulations! Offer Accepted',
                                                                        message: 'Congratulations! You have successfully accepted the job offer. Our team will contact you soon.'
                                                                    });
                                                                    if (applicant) {
                                                                        // 1. Create Employee record (Auto-onboard)
                                                                        await employeesApi.create({
                                                                            applicant_id: applicant.id,
                                                                            name: `${applicant.first_name} ${applicant.last_name}`,
                                                                            email: applicant.email,
                                                                            job_title: applicant.job_title || 'New Employee',
                                                                            department: 'General', // Default department
                                                                            hired_date: new Date().toISOString(),
                                                                            status: 'active'
                                                                        });

                                                                        // 2. Log "Accepted" in history
                                                                        await logApplicationDecision({
                                                                            name: `${applicant.first_name} ${applicant.last_name}`,
                                                                            email: applicant.email,
                                                                            job_title: applicant.job_title || 'Candidate',
                                                                            status: 'Accepted',
                                                                            reason: 'Candidate accepted the job offer via email dashboard.'
                                                                        });

                                                                        // 3. Remove from applicants table to prevent duplicates or accidental rejections
                                                                        // await applicantsApi.delete(applicant.id);
                                                                    }
                                                                    loadEmails();
                                                                    setApplicantOfferStatus('accepted');
                                                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    setStatusModal({
                                                                        isOpen: true,
                                                                        type: 'error',
                                                                        title: 'Action Failed',
                                                                        message: 'Could not process your request at this time. Please try again.'
                                                                    });
                                                                }
                                                            }
                                                        });
                                                    }
                                                }}
                                            >
                                                <CheckCircle size={20} /> Accept Offer
                                            </button>

                                            <button
                                                style={{
                                                    flex: 1,
                                                    background: 'transparent',
                                                    border: '2px solid #ef4444',
                                                    color: '#ef4444',
                                                    fontWeight: 'bold',
                                                    padding: '16px 32px',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    fontSize: '15px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '10px',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                                onClick={() => {
                                                    const match = selectedEmail.message.match(/candidate\/applications\/([a-zA-Z0-9-]+)\/status/);
                                                    if (match && match[1]) {
                                                        setConfirmModal({
                                                            isOpen: true,
                                                            type: 'danger',
                                                            title: 'Decline Offer?',
                                                            message: "Are you sure you want to DECLINE this offer? This action cannot be undone.",
                                                            confirmLabel: 'Yes, Decline',
                                                            onConfirm: async () => {
                                                                try {
                                                                    await applicantsApi.respondToOffer(match[1], 'rejected');
                                                                    setStatusModal({
                                                                        isOpen: true,
                                                                        type: 'success',
                                                                        title: 'Offer Declined',
                                                                        message: 'You have declined the offer. Your response has been recorded.'
                                                                    });
                                                                    if (applicant) {
                                                                        // 1. Log "Rejected" in history
                                                                        await logApplicationDecision({
                                                                            name: `${applicant.first_name} ${applicant.last_name}`,
                                                                            email: applicant.email,
                                                                            job_title: applicant.job_title || 'Candidate',
                                                                            status: 'Rejected',
                                                                            reason: 'Candidate declined the job offer via email dashboard.'
                                                                        });

                                                                        // 2. Remove from applicants table
                                                                        // await applicantsApi.delete(applicant.id);
                                                                    }
                                                                    loadEmails();
                                                                    setApplicantOfferStatus('rejected');
                                                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    setStatusModal({
                                                                        isOpen: true,
                                                                        type: 'error',
                                                                        title: 'Action Failed',
                                                                        message: 'Could not process your request at this time. Please try again.'
                                                                    });
                                                                }
                                                            }
                                                        });
                                                    }
                                                }}
                                            >
                                                <AlertCircle size={20} /> Decline Offer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Status Indicator (if already responded) */}
                            {selectedEmail.subject.toLowerCase().includes('offer') && applicantOfferStatus && applicantOfferStatus !== 'pending' && (
                                <div className="border-t border-[#ffffff10] pt-8" style={{ marginTop: '30px', textAlign: 'center' }}>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '16px 32px',
                                        borderRadius: '16px',
                                        backgroundColor: applicantOfferStatus === 'accepted' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: applicantOfferStatus === 'accepted' ? '#10b981' : '#ef4444',
                                        fontWeight: '700',
                                        fontSize: '1rem',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        border: `1px solid ${applicantOfferStatus === 'accepted' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                        boxShadow: applicantOfferStatus === 'accepted' ? '0 4px 20px rgba(16, 185, 129, 0.1)' : '0 4px 20px rgba(239, 68, 68, 0.1)'
                                    }}>
                                        {applicantOfferStatus === 'accepted' ? <CheckCircle size={22} /> : <XCircle size={22} />}
                                        OFFER {applicantOfferStatus.toUpperCase()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* CONFIRMATION MODAL */}
                    <ConfirmationModal
                        isOpen={confirmModal.isOpen}
                        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                        onConfirm={confirmModal.onConfirm}
                        title={confirmModal.title}
                        message={confirmModal.message}
                        type={confirmModal.type}
                        confirmLabel={confirmModal.confirmLabel}
                    />
                </div>
            ) : (
                // --- LIST VIEW ---
                // Using explicit inline styles to force vertical stacking
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>

                    {/* 1. Back Button Row */}
                    <div style={{ width: '100%', marginBottom: '20px', display: 'flex', justifyContent: 'flex-start' }}>
                        <Link
                            to="/candidate/dashboard"
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1e293b] hover:bg-[#334155] text-gray-300 hover:text-white transition-colors border border-[#ffffff10]"
                        >
                            <ArrowLeft size={18} />
                            Back to Dashboard
                        </Link>
                    </div>

                    {/* 2. Page Title */}
                    <div style={{ width: '100%', textAlign: 'center', marginBottom: '10px' }}>
                        <h1 className="text-2xl font-bold text-white">
                            Communication Center
                        </h1>
                    </div>

                    {/* 3. Welcome Message */}
                    <div style={{ width: '100%', textAlign: 'center', marginTop: '30px', marginBottom: '40px' }}>
                        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-2">
                            Welcome to your Inbox
                        </h2>
                        <p className="text-xs text-gray-400">View and manage all your application updates here.</p>
                    </div>

                    {/* Bulk Actions Row */}
                    {emails.length > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 20px',
                            marginBottom: '16px',
                            backgroundColor: 'rgba(30, 41, 59, 0.4)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(10px)',
                            position: 'relative',
                            zIndex: 40
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                <button
                                    onClick={toggleSelectAll}
                                    style={{ background: 'transparent', border: 'none', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '5px', borderRadius: '4px' }}
                                    className="hover:bg-indigo-500/10 transition-colors"
                                >
                                    {selectedEmailIds.size === emails.length ? <CheckSquare size={20} /> : <Square size={20} />}
                                    <span style={{ fontWeight: 600 }}>{selectedEmailIds.size === emails.length ? 'Deselect All' : 'Select All'}</span>
                                </button>
                                {selectedEmailIds.size > 0 && (
                                    <span style={{ color: '#94a3b8', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
                                        {selectedEmailIds.size} message{selectedEmailIds.size > 1 ? 's' : ''} selected
                                    </span>
                                )}
                            </div>
                            {selectedEmailIds.size > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteBulk();
                                    }}
                                    type="button"
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid #ef4444',
                                        color: '#ef4444',
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        transition: 'all 0.2s',
                                        userSelect: 'none',
                                        outline: 'none',
                                        minWidth: '140px',
                                        justifyContent: 'center'
                                    }}
                                    className="hover:bg-red-500 hover:text-white active:scale-95"
                                >
                                    <Trash2 size={16} /> Delete ({selectedEmailIds.size})
                                </button>
                            )}
                        </div>
                    )}

                    {/* 4. Vertical Email List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {loading ? (
                            <div className="text-center py-12 text-gray-500">Loading messages...</div>
                        ) : emails.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-[#1e293b]/30 rounded-2xl border border-dashed border-gray-700">
                                <Mail size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No messages found.</p>
                            </div>
                        ) : (
                            emails.map(email => (
                                <div
                                    key={email.id}
                                    style={{
                                        display: 'flex',
                                        width: '100%',
                                        marginBottom: '16px',
                                        backgroundColor: selectedEmailIds.has(email.id) ? 'rgba(99, 102, 241, 0.1)' : 'rgba(30, 41, 59, 0.7)',
                                        border: '1px solid ' + (selectedEmailIds.has(email.id) ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.1)'),
                                        borderRadius: '12px',
                                        padding: '24px',
                                        alignItems: 'flex-start',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                        position: 'relative'
                                    }}
                                    className="hover:bg-[#1e293b] hover:border-primary/40 transition-all"
                                >
                                    {/* Select Checkbox */}
                                    <div
                                        onClick={(e) => toggleSelectEmail(email.id, e)}
                                        style={{ marginRight: '15px', marginTop: '5px', color: selectedEmailIds.has(email.id) ? '#6366f1' : '#475569', cursor: 'pointer' }}
                                    >
                                        {selectedEmailIds.has(email.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </div>

                                    <div
                                        onClick={() => {
                                            setSelectedEmail(email);
                                            notificationsApi.markAsRead(email.id)
                                                .then(() => refreshUnreadCount())
                                                .catch(console.error);
                                            setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: 1 } : e));
                                        }}
                                        style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, cursor: 'pointer' }}
                                    >

                                        {/* Line 1: Subject */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {email.is_read === 0 && (
                                                <div style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    backgroundColor: '#3b82f6',
                                                    borderRadius: '50%',
                                                    flexShrink: 0
                                                }} />
                                            )}
                                            <h3 className="text-lg font-bold text-white leading-tight">
                                                {email.subject}
                                            </h3>
                                        </div>

                                        {/* Line 2: Date & Time */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#9ca3af' }}>
                                            <Clock size={14} />
                                            {(() => {
                                                let dateStr = email.created_at;
                                                if (!dateStr.includes('T') && !dateStr.includes('Z')) {
                                                    dateStr = dateStr.replace(' ', 'T') + 'Z';
                                                }
                                                return new Date(dateStr).toLocaleString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                });
                                            })()}
                                        </div>

                                        {/* Line 3: Sender */}
                                        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                            From: <span className="text-gray-300 font-medium">Smart-Cruiter Team</span>
                                        </p>

                                        {/* Line 4: Action */}
                                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary, #3b82f6)', textTransform: 'uppercase' }}>
                                            <span>Click to read</span>
                                            <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                                        </div>
                                    </div>

                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* CONFIRMATION MODAL - Rendered Globally */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmLabel={confirmModal.confirmLabel}
            />

            {/* STATUS MODAL - Rendered Globally */}
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
