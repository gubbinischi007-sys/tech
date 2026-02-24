import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

dotenv.config();

// ── Supabase ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eluarxdyxvxwknylejaj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsdWFyeGR5eHZ4d2tueWxlamFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg5ODU5NiwiZXhwIjoyMDg3NDc0NTk2fQ.7RK3EqTtOlOrS4KNqttdmFb6mhuDp99bAKyKywphFXE';
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper for complex queries via RPC (SELECT only)
async function sql<T = any>(query: string, params: any[] = []): Promise<T[]> {
    let idx = 0;
    const pg = query.replace(/\?/g, () => `$${++idx}`);
    const { data, error } = await sb.rpc('exec_sql_returning', { query: pg, params: params.map(String) });
    if (error) throw error;
    return (data || []) as T[];
}
async function sqlOne<T = any>(query: string, params: any[] = []): Promise<T | undefined> {
    const rows = await sql<T>(query, params);
    return rows[0];
}

// ── Email ─────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});
async function sendEmail(opts: { to: string; subject: string; html: string }) {
    try { await transporter.sendMail({ from: process.env.EMAIL_USER, ...opts }); }
    catch (e) { console.error('Email error:', e); }
}

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
const api = express.Router();

// ── HEALTH ────────────────────────────────────────────────────────────────────
api.get('/health', (_req: any, res: any) => res.json({ status: 'ok', db: 'supabase' }));

// ══════════════════════════════════════════════════════════════════════════════
// JOBS
// ══════════════════════════════════════════════════════════════════════════════
api.get('/jobs', async (req: any, res: any) => {
    try {
        let q = sb.from('jobs').select('*').order('created_at', { ascending: false });
        if (req.query.status) q = q.eq('status', req.query.status);
        const { data, error } = await q;
        if (error) throw error;
        res.json(data || []);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/jobs/:id', async (req: any, res: any) => {
    try {
        const { data, error } = await sb.from('jobs').select('*').eq('id', req.params.id).single();
        if (error) return res.status(404).json({ error: 'Job not found' });
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/jobs', async (req: any, res: any) => {
    try {
        const { title, department, location, type, description, requirements, status } = req.body;
        const now = new Date().toISOString();
        const { data, error } = await sb.from('jobs').insert({
            id: uuidv4(), title, department: department || null, location: location || null,
            type: type || null, description: description || null, requirements: requirements || null,
            status: status || 'open', created_at: now, updated_at: now
        }).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.put('/jobs/:id', async (req: any, res: any) => {
    try {
        const updates: any = { updated_at: new Date().toISOString() };
        for (const f of ['title', 'department', 'location', 'type', 'description', 'requirements', 'status'])
            if (req.body[f] !== undefined) updates[f] = req.body[f];
        const { data, error } = await sb.from('jobs').update(updates).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/jobs/:id', async (req: any, res: any) => {
    try {
        await sb.from('applicants').delete().eq('job_id', req.params.id);
        const { error } = await sb.from('jobs').delete().eq('id', req.params.id);
        if (error) throw error;
        res.status(204).send();
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// APPLICANTS
// ══════════════════════════════════════════════════════════════════════════════
api.get('/applicants', async (req: any, res: any) => {
    try {
        const { job_id, stage, status, email } = req.query;
        let q = sb.from('applicants').select('*').order('applied_at', { ascending: false });
        if (email) q = q.eq('email', email);
        if (job_id) q = q.eq('job_id', job_id);
        if (stage) q = q.eq('stage', stage);
        if (status) q = q.eq('status', status);
        const { data, error } = await q;
        if (error) throw error;

        const { data: jobs } = await sb.from('jobs').select('id, title');
        const jobsMap = Object.fromEntries((jobs || []).map((j: any) => [j.id, j.title]));

        const rows = (data || []).map((a: any) => ({ ...a, job_title: jobsMap[a.job_id] }));
        res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/applicants/:id', async (req: any, res: any) => {
    try {
        const { data, error } = await sb.from('applicants').select('*').eq('id', req.params.id).single();
        if (error) return res.status(404).json({ error: 'Applicant not found' });

        let jobDetails = {};
        if (data.job_id) {
            const { data: job } = await sb.from('jobs').select('title, department, location').eq('id', data.job_id).single();
            if (job) jobDetails = { job_title: job.title, jobs: job };
        }
        res.json({ ...data, ...jobDetails });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/applicants', async (req: any, res: any) => {
    try {
        const { job_id, first_name, last_name, email, phone, resume_url, cover_letter } = req.body;
        if (!job_id || !first_name || !last_name || !email) return res.status(400).json({ error: 'Missing required fields' });
        const { data: job } = await sb.from('jobs').select('id, status').eq('id', job_id).single();
        if (!job) return res.status(404).json({ error: 'Job not found' });
        if (job.status !== 'open') return res.status(400).json({ error: 'Job is not open' });
        const now = new Date().toISOString();
        const { data, error } = await sb.from('applicants').insert({
            id: uuidv4(), job_id, first_name, last_name, email,
            phone: phone || null, resume_url: resume_url || null, cover_letter: cover_letter || null,
            stage: 'applied', status: 'active', applied_at: now, updated_at: now
        }).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.put('/applicants/:id', async (req: any, res: any) => {
    try {
        const updates: any = { updated_at: new Date().toISOString() };
        for (const f of ['first_name', 'last_name', 'email', 'phone', 'resume_url', 'cover_letter', 'stage', 'status'])
            if (req.body[f] !== undefined) updates[f] = req.body[f];
        const { data, error } = await sb.from('applicants').update(updates).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/applicants/bulk-update-stage', async (req: any, res: any) => {
    try {
        const { applicant_ids, stage } = req.body;
        if (!Array.isArray(applicant_ids) || !stage) return res.status(400).json({ error: 'applicant_ids and stage required' });
        const { error } = await sb.from('applicants').update({ stage, updated_at: new Date().toISOString() }).in('id', applicant_ids);
        if (error) throw error;
        res.json({ message: `Updated ${applicant_ids.length} applicants` });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/applicants', async (_req: any, res: any) => {
    try {
        const { error } = await sb.from('applicants').delete().neq('id', '');
        if (error) throw error;
        res.status(204).send();
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/applicants/:id', async (req: any, res: any) => {
    try {
        const { error } = await sb.from('applicants').delete().eq('id', req.params.id);
        if (error) throw error;
        res.status(204).send();
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.patch('/applicants/:id/offer', async (req: any, res: any) => {
    try {
        const { salary, joining_date, notes, rules } = req.body;
        const now = new Date().toISOString();
        const { data: existing } = await sb.from('applicants').select('*').eq('id', req.params.id).single();
        if (!existing) return res.status(404).json({ error: 'Applicant not found' });

        let jobTitle = 'Unknown Job';
        if (existing.job_id) {
            const { data: job } = await sb.from('jobs').select('title').eq('id', existing.job_id).single();
            if (job) jobTitle = job.title;
        }

        const { data, error } = await sb.from('applicants').update({
            offer_salary: salary, offer_joining_date: joining_date, offer_notes: notes,
            offer_rules: rules, offer_status: 'pending', offer_sent_at: now, updated_at: now
        }).eq('id', req.params.id).select().single();
        if (error) throw error;
        await sendEmail({
            to: existing.email, subject: 'Job Offer from Smart-Cruiter',
            html: `<h2>Congratulations ${existing.first_name}!</h2><p>You have been offered <strong>${jobTitle}</strong>.</p><p>Salary: ${salary} | Joining: ${joining_date}</p>`
        });
        res.json({ message: 'Offer sent', applicant: data });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/applicants/:id/offer-response', async (req: any, res: any) => {
    try {
        const { response } = req.body;
        if (response !== 'accepted' && response !== 'rejected') return res.status(400).json({ error: 'Invalid response' });
        const stage = response === 'accepted' ? 'hired' : 'declined';
        const { error } = await sb.from('applicants').update({ offer_status: response, stage, updated_at: new Date().toISOString() }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: `Offer ${response}`, stage });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// INTERVIEWS
// ══════════════════════════════════════════════════════════════════════════════
api.get('/interviews', async (req: any, res: any) => {
    try {
        const { applicant_id, job_id, status } = req.query;
        const rows = await sql(`
      SELECT i.*, a.first_name||' '||a.last_name as applicant_name, a.email as applicant_email, j.title as job_title
      FROM interviews i
      LEFT JOIN applicants a ON i.applicant_id=a.id
      LEFT JOIN jobs j ON i.job_id=j.id
      WHERE 1=1
      ${applicant_id ? `AND i.applicant_id='${applicant_id}'` : ''}
      ${job_id ? `AND i.job_id='${job_id}'` : ''}
      ${status ? `AND i.status='${status}'` : ''}
      ORDER BY i.scheduled_at ASC`);
        res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/interviews', async (req: any, res: any) => {
    try {
        const { applicant_id, job_id, scheduled_at, type, meeting_link, notes } = req.body;
        const now = new Date().toISOString();
        const { data, error } = await sb.from('interviews').insert({
            id: uuidv4(), applicant_id, job_id, scheduled_at,
            type: type || 'online', meeting_link: meeting_link || null,
            notes: notes || null, status: 'scheduled', created_at: now, updated_at: now
        }).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.put('/interviews/:id', async (req: any, res: any) => {
    try {
        const updates: any = { updated_at: new Date().toISOString() };
        for (const f of ['scheduled_at', 'type', 'meeting_link', 'notes', 'status'])
            if (req.body[f] !== undefined) updates[f] = req.body[f];
        const { data, error } = await sb.from('interviews').update(updates).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/interviews/:id', async (req: any, res: any) => {
    try {
        const { error } = await sb.from('interviews').delete().eq('id', req.params.id);
        if (error) throw error;
        res.status(204).send();
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// EMPLOYEES
// ══════════════════════════════════════════════════════════════════════════════
api.get('/employees', async (_req: any, res: any) => {
    try {
        const { data, error } = await sb.from('employees').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/employees', async (req: any, res: any) => {
    try {
        const { applicant_id, name, email, job_title, department, hired_date, status } = req.body;
        if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
        const { data: existing } = await sb.from('employees').select('id').eq('email', email).maybeSingle();
        if (existing) return res.status(400).json({ error: 'Employee already exists' });
        const { data, error } = await sb.from('employees').insert({
            id: uuidv4(), applicant_id: applicant_id || null, name, email,
            job_title: job_title || null, department: department || null,
            hired_date: hired_date || new Date().toISOString(),
            status: status || 'active', created_at: new Date().toISOString()
        }).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.patch('/employees/:id', async (req: any, res: any) => {
    try {
        const updates: any = {};
        for (const f of ['name', 'email', 'job_title', 'department', 'hired_date', 'status'])
            if (req.body[f] !== undefined) updates[f] = req.body[f];
        const { data, error } = await sb.from('employees').update(updates).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/employees/:id', async (req: any, res: any) => {
    try {
        const { error } = await sb.from('employees').delete().eq('id', req.params.id);
        if (error) throw error;
        res.status(204).send();
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════
api.get('/analytics/dashboard', async (_req: any, res: any) => {
    try {
        // Run all counts in parallel
        const [r1, r2, r3, r4, r5, r6, r7] = await Promise.all([
            sb.from('jobs').select('*', { count: 'exact', head: true }),
            sb.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
            sb.from('applicants').select('*', { count: 'exact', head: true }),
            sb.from('interviews').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
            sb.from('applicants').select('stage'),
            sb.from('jobs').select('id, title'),
            sb.from('applicants').select('job_id'),
        ]);

        // Count by stage
        const stageMap: Record<string, number> = {};
        (r5.data || []).forEach((r: any) => { stageMap[r.stage] = (stageMap[r.stage] || 0) + 1; });
        const applicantsByStage = Object.entries(stageMap).map(([stage, count]) => ({ stage, count }));

        // Count applicants per job
        const jobCountMap: Record<string, number> = {};
        (r7.data || []).forEach((r: any) => { jobCountMap[r.job_id] = (jobCountMap[r.job_id] || 0) + 1; });
        const applicantsByJob = (r6.data || [])
            .map((j: any) => ({ job_id: j.id, job_title: j.title, count: jobCountMap[j.id] || 0 }))
            .sort((a: any, b: any) => b.count - a.count)
            .slice(0, 10);

        res.json({
            totalJobs: r1.count || 0,
            openJobs: r2.count || 0,
            totalApplicants: r3.count || 0,
            recentApplicants: r3.count || 0,
            scheduledInterviews: r4.count || 0,
            applicantsByStage,
            applicantsByJob,
        });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});


api.get('/analytics/applicants-by-stage', async (_req: any, res: any) => {
    try {
        const { data } = await sb.from('applicants').select('stage');
        const map: Record<string, number> = {};
        (data || []).forEach((r: any) => { map[r.stage] = (map[r.stage] || 0) + 1; });
        res.json(Object.entries(map).map(([stage, count]) => ({ stage, count })));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/analytics/applicants-over-time', async (req: any, res: any) => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const { data } = await sb.from('applicants').select('applied_at').gte('applied_at', since);
        const map: Record<string, number> = {};
        (data || []).forEach((r: any) => { const d = r.applied_at?.slice(0, 10); if (d) map[d] = (map[d] || 0) + 1; });
        res.json(Object.entries(map).sort().map(([date, count]) => ({ date, count })));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/analytics/job-stats/:jobId', async (req: any, res: any) => {
    try {
        const { data: applicants } = await sb.from('applicants').select('stage').eq('job_id', req.params.jobId);
        const { count: totalInterviews } = await sb.from('interviews').select('*', { count: 'exact', head: true }).eq('job_id', req.params.jobId);
        const map: Record<string, number> = {};
        (applicants || []).forEach((r: any) => { map[r.stage] = (map[r.stage] || 0) + 1; });
        res.json({
            totalApplicants: applicants?.length || 0,
            applicantsByStage: Object.entries(map).map(([stage, count]) => ({ stage, count })),
            totalInterviews: totalInterviews || 0
        });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════
api.get('/notifications/unread-count', async (req: any, res: any) => {
    try {
        const email = req.query.email as string;
        if (!email) return res.status(400).json({ error: 'Email required' });
        const { count } = await sb.from('notifications').select('*', { count: 'exact', head: true })
            .ilike('recipient_email', email).eq('is_read', 0);
        res.json({ count: count || 0 });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/notifications', async (req: any, res: any) => {
    try {
        const email = req.query.email as string;
        if (!email) return res.status(400).json({ error: 'Email required' });
        const { data, error } = await sb.from('notifications').select('*')
            .ilike('recipient_email', email).order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.patch('/notifications/:id/read', async (req: any, res: any) => {
    try {
        const { error } = await sb.from('notifications').update({ is_read: 1 }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/notifications/:id', async (req: any, res: any) => {
    try {
        const { error } = await sb.from('notifications').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/notifications', async (req: any, res: any) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' });
        const { error } = await sb.from('notifications').delete().in('id', ids);
        if (error) throw error;
        res.json({ success: true, count: ids.length });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// EMAILS
// ══════════════════════════════════════════════════════════════════════════════
api.post('/emails/send', async (req: any, res: any) => {
    try {
        await sendEmail(req.body);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// HISTORY
// ══════════════════════════════════════════════════════════════════════════════
api.get('/history/stats', async (_req: any, res: any) => {
    try {
        const { data } = await sb.from('application_history').select('status');
        const map: Record<string, number> = {};
        (data || []).forEach((r: any) => { map[r.status] = (map[r.status] || 0) + 1; });
        res.json(Object.entries(map).map(([status, count]) => ({ status, count })));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/history', async (req: any, res: any) => {
    try {
        let q = sb.from('application_history').select('*').order('date', { ascending: false });
        if (req.query.email) q = q.eq('email', req.query.email);
        const { data, error } = await q;
        if (error) throw error;
        res.json(data || []);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/history', async (req: any, res: any) => {
    try {
        const { name, email, job_title, status, reason } = req.body;
        if (!name || !email || !status) return res.status(400).json({ error: 'Missing required fields' });
        const { data, error } = await sb.from('application_history').insert({
            id: uuidv4(), name, email, job_title: job_title || null,
            status, reason: reason || null, date: new Date().toISOString()
        }).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/history', async (_req: any, res: any) => {
    try {
        await sb.from('application_history').delete().neq('id', '');
        res.json({ message: 'Cleared' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/history/:id', async (req: any, res: any) => {
    try {
        const { error } = await sb.from('application_history').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Deleted' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Mount on both /api and / (Vercel strips /api prefix when routing to function)
app.use('/api', api);
app.use('/', api);

export default app;
