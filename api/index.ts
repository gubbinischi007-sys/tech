import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

dotenv.config();

// ── Supabase ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eluarxdyxvxwknylejaj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsdWFyeGR5eHZ4d2tueWxlamFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg5ODU5NiwiZXhwIjoyMDg3NDc0NTk2fQ.7RK3EqTtOlOrS4KNqttdmFb6mhuDp99bAKyKywphFXE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function toPostgres(sql: string): string {
    let idx = 0;
    return sql.replace(/\?/g, () => `$${++idx}`);
}

async function dbRun(sql: string, params: any[] = []): Promise<void> {
    const { error } = await supabase.rpc('exec_sql', { query: toPostgres(sql), params: params.map(String) });
    if (error) throw error;
}

async function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const { data, error } = await supabase.rpc('exec_sql_returning', { query: toPostgres(sql), params: params.map(String) });
    if (error) throw error;
    return data?.[0] as T | undefined;
}

async function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const { data, error } = await supabase.rpc('exec_sql_returning', { query: toPostgres(sql), params: params.map(String) });
    if (error) throw error;
    return (data || []) as T[];
}

// ── Email ─────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

async function sendEmail(opts: { to: string; subject: string; html: string }) {
    try {
        await transporter.sendMail({ from: process.env.EMAIL_USER, ...opts });
    } catch (e) { console.error('Email error:', e); }
}

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

const api = express.Router();

// ── Health ────────────────────────────────────────────────────────────────────
api.get('/health', (_req, res) => res.json({ status: 'ok', db: 'supabase' }));

// ── JOBS ──────────────────────────────────────────────────────────────────────
api.get('/jobs', async (req, res) => {
    try {
        const { status } = req.query;
        let q = 'SELECT * FROM jobs ORDER BY created_at DESC';
        const p: any[] = [];
        if (status) { q = 'SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC'; p.push(status); }
        res.json(await dbAll(q, p));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/jobs/:id', async (req, res) => {
    try {
        const job = await dbGet('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json(job);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/jobs', async (req, res) => {
    try {
        const { title, department, location, type, description, requirements, status } = req.body;
        const id = uuidv4(); const now = new Date().toISOString();
        await dbRun(`INSERT INTO jobs (id,title,department,location,type,description,requirements,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [id, title, department || null, location || null, type || null, description || null, requirements || null, status || 'open', now, now]);
        res.status(201).json(await dbGet('SELECT * FROM jobs WHERE id = ?', [id]));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.put('/jobs/:id', async (req, res) => {
    try {
        const existing = await dbGet('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Job not found' });
        const updates: string[] = []; const params: any[] = [];
        const fields = ['title', 'department', 'location', 'type', 'description', 'requirements', 'status'];
        for (const f of fields) if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }
        if (!updates.length) return res.json(existing);
        updates.push('updated_at = ?'); params.push(new Date().toISOString()); params.push(req.params.id);
        await dbRun(`UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`, params);
        res.json(await dbGet('SELECT * FROM jobs WHERE id = ?', [req.params.id]));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/jobs/:id', async (req, res) => {
    try {
        const job = await dbGet('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
        if (!job) return res.status(404).json({ error: 'Job not found' });
        await dbRun('DELETE FROM applicants WHERE job_id = ?', [req.params.id]);
        await dbRun('DELETE FROM jobs WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── APPLICANTS ────────────────────────────────────────────────────────────────
api.get('/applicants', async (req, res) => {
    try {
        const { job_id, stage, status, email } = req.query;
        let q = `SELECT a.*, j.title as job_title FROM applicants a LEFT JOIN jobs j ON a.job_id = j.id WHERE 1=1`;
        const p: any[] = [];
        if (email) { q += ' AND a.email = ?'; p.push(email); }
        if (job_id) { q += ' AND a.job_id = ?'; p.push(job_id); }
        if (stage) { q += ' AND a.stage = ?'; p.push(stage); }
        if (status) { q += ' AND a.status = ?'; p.push(status); }
        q += ' ORDER BY a.applied_at DESC';
        res.json(await dbAll(q, p));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/applicants/:id', async (req, res) => {
    try {
        const a = await dbGet(`SELECT a.*, j.title as job_title FROM applicants a LEFT JOIN jobs j ON a.job_id = j.id WHERE a.id = ?`, [req.params.id]);
        if (!a) return res.status(404).json({ error: 'Applicant not found' });
        res.json(a);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/applicants', async (req, res) => {
    try {
        const { job_id, first_name, last_name, email, phone, resume_url, cover_letter } = req.body;
        if (!job_id || !first_name || !last_name || !email) return res.status(400).json({ error: 'Missing required fields' });
        const job = await dbGet('SELECT id, status FROM jobs WHERE id = ?', [job_id]);
        if (!job) return res.status(404).json({ error: 'Job not found' });
        if (job.status !== 'open') return res.status(400).json({ error: 'Job is not open' });
        const id = uuidv4(); const now = new Date().toISOString();
        await dbRun(`INSERT INTO applicants (id,job_id,first_name,last_name,email,phone,resume_url,cover_letter,stage,status,applied_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [id, job_id, first_name, last_name, email, phone || null, resume_url || null, cover_letter || null, 'applied', 'active', now, now]);
        res.status(201).json(await dbGet('SELECT * FROM applicants WHERE id = ?', [id]));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.put('/applicants/:id', async (req, res) => {
    try {
        const existing = await dbGet('SELECT * FROM applicants WHERE id = ?', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Applicant not found' });
        const updates: string[] = []; const params: any[] = [];
        const fields = ['first_name', 'last_name', 'email', 'phone', 'resume_url', 'cover_letter', 'stage', 'status'];
        for (const f of fields) if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }
        if (!updates.length) return res.json(existing);
        updates.push('updated_at = ?'); params.push(new Date().toISOString()); params.push(req.params.id);
        await dbRun(`UPDATE applicants SET ${updates.join(', ')} WHERE id = ?`, params);
        res.json(await dbGet('SELECT * FROM applicants WHERE id = ?', [req.params.id]));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/applicants/bulk-update-stage', async (req, res) => {
    try {
        const { applicant_ids, stage } = req.body;
        if (!Array.isArray(applicant_ids) || !stage) return res.status(400).json({ error: 'applicant_ids and stage required' });
        const ph = applicant_ids.map(() => '?').join(',');
        await dbRun(`UPDATE applicants SET stage = ?, updated_at = ? WHERE id IN (${ph})`, [stage, new Date().toISOString(), ...applicant_ids]);
        res.json({ message: `Updated ${applicant_ids.length} applicants` });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/applicants', async (_req, res) => {
    try { await dbRun('DELETE FROM applicants'); res.status(204).send(); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/applicants/:id', async (req, res) => {
    try {
        const existing = await dbGet('SELECT * FROM applicants WHERE id = ?', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Applicant not found' });
        await dbRun('DELETE FROM applicants WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.patch('/applicants/:id/offer', async (req, res) => {
    try {
        const { salary, joining_date, notes, rules } = req.body;
        const now = new Date().toISOString();
        const existing = await dbGet(`SELECT a.*, j.title as job_title FROM applicants a LEFT JOIN jobs j ON a.job_id = j.id WHERE a.id = ?`, [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Applicant not found' });
        await dbRun(`UPDATE applicants SET offer_salary=?,offer_joining_date=?,offer_notes=?,offer_rules=?,offer_status='pending',offer_sent_at=?,updated_at=? WHERE id=?`,
            [salary, joining_date, notes, rules, now, now, req.params.id]);
        await sendEmail({
            to: existing.email, subject: 'Job Offer from Smart-Cruiter',
            html: `<h2>Congratulations ${existing.first_name}!</h2><p>You have been offered <strong>${existing.job_title}</strong>.</p><p>Salary: ${salary} | Joining: ${joining_date}</p>`
        });
        res.json({ message: 'Offer sent', applicant: await dbGet('SELECT * FROM applicants WHERE id = ?', [req.params.id]) });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/applicants/:id/offer-response', async (req, res) => {
    try {
        const { response } = req.body;
        if (response !== 'accepted' && response !== 'rejected') return res.status(400).json({ error: 'Invalid response' });
        const existing = await dbGet('SELECT * FROM applicants WHERE id = ?', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Applicant not found' });
        const stage = response === 'accepted' ? 'hired' : 'declined';
        await dbRun(`UPDATE applicants SET offer_status=?,stage=?,updated_at=? WHERE id=?`, [response, stage, new Date().toISOString(), req.params.id]);
        res.json({ message: `Offer ${response}`, stage });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── INTERVIEWS ────────────────────────────────────────────────────────────────
api.get('/interviews', async (req, res) => {
    try {
        const { applicant_id, job_id, status } = req.query;
        let q = `SELECT i.*, a.first_name||' '||a.last_name as applicant_name, a.email as applicant_email, j.title as job_title FROM interviews i LEFT JOIN applicants a ON i.applicant_id=a.id LEFT JOIN jobs j ON i.job_id=j.id WHERE 1=1`;
        const p: any[] = [];
        if (applicant_id) { q += ' AND i.applicant_id=?'; p.push(applicant_id); }
        if (job_id) { q += ' AND i.job_id=?'; p.push(job_id); }
        if (status) { q += ' AND i.status=?'; p.push(status); }
        q += ' ORDER BY i.scheduled_at ASC';
        res.json(await dbAll(q, p));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/interviews', async (req, res) => {
    try {
        const { applicant_id, job_id, scheduled_at, type, meeting_link, notes } = req.body;
        const id = uuidv4(); const now = new Date().toISOString();
        await dbRun(`INSERT INTO interviews (id,applicant_id,job_id,scheduled_at,type,meeting_link,notes,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [id, applicant_id, job_id, scheduled_at, type || 'online', meeting_link || null, notes || null, 'scheduled', now, now]);
        res.status(201).json(await dbGet('SELECT * FROM interviews WHERE id = ?', [id]));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.put('/interviews/:id', async (req, res) => {
    try {
        const existing = await dbGet('SELECT * FROM interviews WHERE id = ?', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Interview not found' });
        const updates: string[] = []; const params: any[] = [];
        for (const f of ['scheduled_at', 'type', 'meeting_link', 'notes', 'status']) if (req.body[f] !== undefined) { updates.push(`${f}=?`); params.push(req.body[f]); }
        if (!updates.length) return res.json(existing);
        updates.push('updated_at=?'); params.push(new Date().toISOString()); params.push(req.params.id);
        await dbRun(`UPDATE interviews SET ${updates.join(',')} WHERE id=?`, params);
        res.json(await dbGet('SELECT * FROM interviews WHERE id = ?', [req.params.id]));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/interviews/:id', async (req, res) => {
    try {
        if (!await dbGet('SELECT id FROM interviews WHERE id=?', [req.params.id])) return res.status(404).json({ error: 'Not found' });
        await dbRun('DELETE FROM interviews WHERE id=?', [req.params.id]);
        res.status(204).send();
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── EMPLOYEES ─────────────────────────────────────────────────────────────────
api.get('/employees', async (_req, res) => {
    try { res.json(await dbAll('SELECT * FROM employees ORDER BY created_at DESC')); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/employees', async (req, res) => {
    try {
        const { applicant_id, name, email, job_title, department, hired_date, status } = req.body;
        if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
        if (await dbGet('SELECT id FROM employees WHERE email=?', [email])) return res.status(400).json({ error: 'Employee already exists' });
        const id = uuidv4();
        await dbRun(`INSERT INTO employees (id,applicant_id,name,email,job_title,department,hired_date,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)`,
            [id, applicant_id || null, name, email, job_title, department, hired_date || new Date().toISOString(), status || 'active', new Date().toISOString()]);
        res.status(201).json(await dbGet('SELECT * FROM employees WHERE id=?', [id]));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.patch('/employees/:id', async (req, res) => {
    try {
        const existing = await dbGet('SELECT * FROM employees WHERE id=?', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Employee not found' });
        const updates: string[] = []; const params: any[] = [];
        for (const f of ['name', 'email', 'job_title', 'department', 'hired_date', 'status']) if (req.body[f] !== undefined) { updates.push(`${f}=?`); params.push(req.body[f]); }
        if (!updates.length) return res.json(existing);
        params.push(req.params.id);
        await dbRun(`UPDATE employees SET ${updates.join(',')} WHERE id=?`, params);
        res.json(await dbGet('SELECT * FROM employees WHERE id=?', [req.params.id]));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/employees/:id', async (req, res) => {
    try {
        if (!await dbGet('SELECT id FROM employees WHERE id=?', [req.params.id])) return res.status(404).json({ error: 'Not found' });
        await dbRun('DELETE FROM employees WHERE id=?', [req.params.id]);
        res.status(204).send();
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
api.get('/analytics/dashboard', async (_req, res) => {
    try {
        const [totalJobs, openJobs, totalApplicants, recentApplicants, scheduledInterviews, applicantsByStage, applicantsByJob] = await Promise.all([
            dbGet<{ count: string }>('SELECT COUNT(*) as count FROM jobs'),
            dbGet<{ count: string }>('SELECT COUNT(*) as count FROM jobs WHERE status=?', ['open']),
            dbGet<{ count: string }>('SELECT COUNT(*) as count FROM applicants'),
            dbGet<{ count: string }>(`SELECT COUNT(*) as count FROM applicants WHERE applied_at >= NOW() - INTERVAL '30 days'`),
            dbGet<{ count: string }>(`SELECT COUNT(*) as count FROM interviews WHERE status='scheduled' AND scheduled_at >= NOW()`),
            dbAll<{ stage: string; count: number }>('SELECT stage, COUNT(*) as count FROM applicants GROUP BY stage'),
            dbAll<{ job_id: string; job_title: string; count: number }>(`SELECT j.id as job_id, j.title as job_title, COUNT(a.id) as count FROM jobs j LEFT JOIN applicants a ON j.id=a.job_id GROUP BY j.id, j.title ORDER BY count DESC LIMIT 10`),
        ]);
        res.json({
            totalJobs: parseInt(totalJobs?.count || '0'),
            openJobs: parseInt(openJobs?.count || '0'),
            totalApplicants: parseInt(totalApplicants?.count || '0'),
            recentApplicants: parseInt(recentApplicants?.count || '0'),
            scheduledInterviews: parseInt(scheduledInterviews?.count || '0'),
            applicantsByStage, applicantsByJob,
        });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/analytics/applicants-by-stage', async (_req, res) => {
    try { res.json(await dbAll('SELECT stage, COUNT(*) as count FROM applicants GROUP BY stage')); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/analytics/applicants-over-time', async (req, res) => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        res.json(await dbAll(`SELECT applied_at::date as date, COUNT(*) as count FROM applicants WHERE applied_at >= NOW() - ($1 || ' days')::INTERVAL GROUP BY applied_at::date ORDER BY date ASC`, [days]));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/analytics/job-stats/:jobId', async (req, res) => {
    try {
        const [totalApplicants, applicantsByStage, interviews] = await Promise.all([
            dbGet<{ count: string }>('SELECT COUNT(*) as count FROM applicants WHERE job_id=?', [req.params.jobId]),
            dbAll<{ stage: string; count: number }>('SELECT stage, COUNT(*) as count FROM applicants WHERE job_id=? GROUP BY stage', [req.params.jobId]),
            dbGet<{ count: string }>('SELECT COUNT(*) as count FROM interviews WHERE job_id=?', [req.params.jobId]),
        ]);
        res.json({ totalApplicants: parseInt(totalApplicants?.count || '0'), applicantsByStage, totalInterviews: parseInt(interviews?.count || '0') });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
api.get('/notifications', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email required' });
        res.json(await dbAll('SELECT * FROM notifications WHERE LOWER(recipient_email)=LOWER(?) ORDER BY created_at DESC', [email]));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/notifications/unread-count', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email required' });
        const r = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM notifications WHERE LOWER(recipient_email)=LOWER(?) AND is_read=0', [email]);
        res.json({ count: r?.count || 0 });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.patch('/notifications/:id/read', async (req, res) => {
    try { await dbRun('UPDATE notifications SET is_read=1 WHERE id=?', [req.params.id]); res.json({ success: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/notifications/:id', async (req, res) => {
    try { await dbRun('DELETE FROM notifications WHERE id=?', [req.params.id]); res.json({ success: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/notifications', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' });
        const ph = ids.map(() => '?').join(',');
        await dbRun(`DELETE FROM notifications WHERE id IN (${ph})`, ids);
        res.json({ success: true, count: ids.length });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── EMAILS ────────────────────────────────────────────────────────────────────
api.post('/emails/send', async (req, res) => {
    try {
        const { to, subject, html } = req.body;
        await sendEmail({ to, subject, html });
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── HISTORY ───────────────────────────────────────────────────────────────────
api.get('/history', async (req, res) => {
    try {
        const { email } = req.query;
        let q = 'SELECT * FROM application_history';
        const p: any[] = [];
        if (email) { q += ' WHERE email=?'; p.push(email); }
        q += ' ORDER BY date DESC';
        res.json(await dbAll(q, p));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.get('/history/stats', async (_req, res) => {
    try { res.json(await dbAll('SELECT status, COUNT(*) as count FROM application_history GROUP BY status')); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.post('/history', async (req, res) => {
    try {
        const { name, email, job_title, status, reason } = req.body;
        if (!name || !email || !status) return res.status(400).json({ error: 'Missing required fields' });
        const id = uuidv4();
        await dbRun('INSERT INTO application_history (id,name,email,job_title,status,reason,date) VALUES (?,?,?,?,?,?,?)',
            [id, name, email, job_title, status, reason, new Date().toISOString()]);
        res.status(201).json({ id, name, email, status });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/history', async (_req, res) => {
    try { await dbRun('DELETE FROM application_history'); res.json({ message: 'Cleared' }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
});

api.delete('/history/:id', async (req, res) => {
    try { await dbRun('DELETE FROM application_history WHERE id=?', [req.params.id]); res.json({ message: 'Deleted' }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Mount on both /api and / so it works on Vercel (which strips /api prefix)
app.use('/api', api);
app.use('/', api);

export default app;
