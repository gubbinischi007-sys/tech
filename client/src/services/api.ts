import { MOCK_JOBS, MOCK_APPLICANTS, MOCK_INTERVIEWS, MOCK_NOTIFICATIONS, MOCK_HISTORY } from '../lib/mockData';

// --- MOCK STORAGE SYSTEM (In-Memory for UI demo) ---
// This ensures that updates during the demo persist in the current browser session
let _mockJobs = [...MOCK_JOBS];
let _mockApplicants = [...MOCK_APPLICANTS];
let _mockInterviews = [...MOCK_INTERVIEWS];
let _mockNotifications = [...MOCK_NOTIFICATIONS];
let _mockHistory = [...MOCK_HISTORY];

const wait = (ms: number = 300) => new Date(Date.now() + ms); // artificial delay for realism

export const setCompanyId = (companyId: string | null) => {
  console.log('UI Mock Mode: Set company id to', companyId);
};

// Jobs API
export const jobsApi = {
  getAll: async (status?: string) => {
    let filtered = _mockJobs;
    if (status) filtered = filtered.filter(j => j.status === status);
    return { data: filtered };
  },
  getById: async (id: string) => {
    return { data: _mockJobs.find(j => j.id === id) };
  },
  create: async (data: any) => {
    const newJob = { ...data, id: `job-${_mockJobs.length + 1}`, created_at: new Date().toISOString() };
    _mockJobs = [newJob, ..._mockJobs];
    return { data: newJob };
  },
  update: async (id: string, data: any) => {
    _mockJobs = _mockJobs.map(j => j.id === id ? { ...j, ...data } : j);
    return { data: _mockJobs.find(j => j.id === id) };
  },
  delete: async (id: string) => {
    _mockJobs = _mockJobs.filter(j => j.id !== id);
    return { data: { success: true } };
  },
};

// Applicants API
export const applicantsApi = {
  getAll: async (params?: { job_id?: string; stage?: string; status?: string; email?: string }) => {
    let filtered = _mockApplicants;
    if (params?.job_id) filtered = filtered.filter(a => a.job_id === params.job_id);
    if (params?.stage) filtered = filtered.filter(a => a.stage === params.stage);
    if (params?.status) filtered = filtered.filter(a => a.status === params.status);
    if (params?.email) filtered = filtered.filter(a => a.email === params.email);
    return { data: filtered };
  },
  getById: async (id: string) => {
    return { data: _mockApplicants.find(a => a.id === id) };
  },
  create: async (data: any) => {
    const newApplicant = { ...data, id: `app-${_mockApplicants.length + 1}`, applied_at: new Date().toISOString() };
    _mockApplicants = [newApplicant, ..._mockApplicants];
    return { data: newApplicant };
  },
  update: async (id: string, data: any) => {
    _mockApplicants = _mockApplicants.map(a => a.id === id ? { ...a, ...data } : a);
    return { data: _mockApplicants.find(a => a.id === id) };
  },
  bulkUpdateStage: async (applicant_ids: string[], stage: string, rejection_reason?: string) => {
    _mockApplicants = _mockApplicants.map(a => 
      applicant_ids.includes(a.id) ? { ...a, stage, status: stage === 'rejected' ? 'rejected' : a.status, rejection_reason } : a
    );
    return { data: { success: true } };
  },
  deleteAll: async () => {
    _mockApplicants = [];
    return { data: { success: true } };
  },
  delete: async (id: string) => {
    _mockApplicants = _mockApplicants.filter(a => a.id !== id);
    return { data: { success: true } };
  },
  sendOffer: async (id: string, data: any) => {
    _mockApplicants = _mockApplicants.map(a => a.id === id ? { ...a, offer_status: 'sent', stage: 'offer' } : a);
    return { data: { success: true } };
  },
  respondToOffer: async (id: string, response: 'accepted' | 'rejected') => {
    _mockApplicants = _mockApplicants.map(a => a.id === id ? { ...a, offer_status: response, stage: response === 'accepted' ? 'hired' : 'declined' } : a);
    return { data: { success: true } };
  },
};

// Interviews API
export const interviewsApi = {
  getAll: async (params?: any) => ({ data: _mockInterviews }),
  getById: async (id: string) => ({ data: _mockInterviews.find(i => i.id === id) }),
  create: async (data: any) => {
    const newInterview = { ...data, id: `int-${_mockInterviews.length + 1}` };
    _mockInterviews = [newInterview, ..._mockInterviews];
    return { data: newInterview };
  },
  update: async (id: string, data: any) => {
    _mockInterviews = _mockInterviews.map(i => i.id === id ? { ...i, ...data } : i);
    return { data: _mockInterviews.find(i => i.id === id) };
  },
  delete: async (id: string) => {
    _mockInterviews = _mockInterviews.filter(i => i.id !== id);
    return { data: { success: true } };
  },
};

// Analytics API
export const analyticsApi = {
  getDashboard: async () => ({
    data: {
      totalJobs: _mockJobs.length,
      activeApplicants: _mockApplicants.filter(a => a.status === 'active').length,
      interviewsToday: 2,
      pendingOffers: _mockApplicants.filter(a => a.stage === 'offer').length,
      stages: [
        { name: 'Applied', value: _mockApplicants.filter(a => a.stage === 'applied').length },
        { name: 'Shortlisted', value: _mockApplicants.filter(a => a.stage === 'shortlisted').length },
        { name: 'Tech Interview', value: _mockApplicants.filter(a => a.stage === 'technical').length },
        { name: 'Interviews', value: _mockApplicants.filter(a => a.stage === 'interview').length },
        { name: 'Offer', value: _mockApplicants.filter(a => a.stage === 'offer').length },
        { name: 'Hired', value: _mockApplicants.filter(a => a.stage === 'hired').length },
      ]
    }
  }),
  getApplicantsByStage: async () => ({
    data: [
      { name: 'Applied', count: _mockApplicants.filter(a => a.stage === 'applied').length },
      { name: 'Shortlisted', count: _mockApplicants.filter(a => a.stage === 'shortlisted').length },
      { name: 'Interviews', count: _mockApplicants.filter(a => a.stage === 'interview').length },
      { name: 'Offer', count: _mockApplicants.filter(a => a.stage === 'offer').length },
      { name: 'Hired', count: _mockApplicants.filter(a => a.stage === 'hired').length },
    ]
  }),
  getApplicantsOverTime: async () => ({
    data: Array.from({ length: 7 }).map((_, i) => ({
      date: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: Math.floor(Math.random() * 10) + 2
    }))
  }),
  getJobStats: async (jobId: string) => ({
    data: { applicants: _mockApplicants.filter(a => a.job_id === jobId).length, views: 120 }
  }),
};

// Platform API (Mocked Status)
export const platformApi = {
  getCompanyStatus: async (email: string) => ({ data: { status: 'approved' } }),
  getCompanies: async (status?: string) => ({ data: [{ id: '1', name: 'Smart Solutions Inc.', status: 'approved' }] }),
  verifyCompany: async (id: string, status: string) => ({ data: { success: true } }),
  registerCompany: async (data: any) => ({ data: { success: true, tracking_id: 'TRK-DEFAULT' } }),
};

// History API
export const historyApi = {
  getAll: async () => ({ data: _mockHistory }),
  create: async (data: any) => {
    _mockHistory = [{ ...data, id: `hist-${_mockHistory.length + 1}`, date: new Date().toISOString() }, ..._mockHistory];
    return { data: _mockHistory[0] };
  },
  delete: async (id: string) => {
    _mockHistory = _mockHistory.filter(h => h.id !== id);
    return { data: { success: true } };
  },
  clearAll: async () => {
    _mockHistory = [];
    return { data: { success: true } };
  },
};

// Default api instance exported for compatibility
export default { 
  get: async (url: string) => ({ data: [] }),
  post: async (url: string) => ({ data: [] }),
  defaults: { headers: { common: {} } } 
} as any;

// Stubs for other APIs
export const notificationsApi = {
  getAll: async () => ({ data: _mockNotifications }),
  getUnreadCount: async () => ({ data: { count: _mockNotifications.length } }),
  markAsRead: async (id: string) => {
    _mockNotifications = _mockNotifications.map(n => n.id === id ? { ...n, is_read: 1 } : n);
    return { data: { success: true } };
  },
  delete: async (id: string) => ({ data: { success: true } }),
} as any;

export const emailApi = { 
  sendBulkAcceptance: async () => ({ data: { success: true } }), 
  sendBulkRejection: async () => ({ data: { success: true } }), 
} as any;

export const employeesApi = {
  getAll: async () => ({ data: _mockApplicants.filter(a => a.stage === 'hired') }),
} as any;

export const referencesApi = {
  request: async () => ({ data: { success: true } }),
  getByApplicant: async () => ({ data: [] }),
} as any;


