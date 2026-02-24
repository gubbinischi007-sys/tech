import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { run, get, all } from '../database.js';
import { Applicant, CreateApplicantInput, UpdateApplicantInput, ApplicantStage } from '../models/applicant.js';
import { sendEmail } from '../services/email.js';

const router = express.Router();

// Get all applicants (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { job_id, stage, status, email } = req.query;
    let query = `
      SELECT a.*, j.title as job_title 
      FROM applicants a 
      LEFT JOIN jobs j ON a.job_id = j.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (email) {
      query += ' AND a.email = ?';
      params.push(email);
    }
    if (job_id) {
      query += ' AND a.job_id = ?';
      params.push(job_id);
    }
    if (stage) {
      query += ' AND a.stage = ?';
      params.push(stage);
    }
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.applied_at DESC';

    const applicants = await all<any>(query, params);
    res.json(applicants);
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ error: 'Failed to fetch applicants' });
  }
});

// Get applicant by ID
router.get('/:id', async (req, res) => {
  try {
    const applicant = await get<any>(
      `SELECT a.*, j.title as job_title, j.department, j.location 
       FROM applicants a 
       LEFT JOIN jobs j ON a.job_id = j.id 
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }
    res.json(applicant);
  } catch (error) {
    console.error('Error fetching applicant:', error);
    res.status(500).json({ error: 'Failed to fetch applicant' });
  }
});

// Create applicant
router.post('/', async (req, res) => {
  try {
    const input: CreateApplicantInput = req.body;

    // Basic input validation
    if (!input.job_id || !input.first_name || !input.last_name || !input.email) {
      return res.status(400).json({ error: 'job_id, first_name, last_name and email are required' });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    // Verify job exists and is open
    const job = await get('SELECT id, status FROM jobs WHERE id = ?', [input.job_id]);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.status !== 'open') {
      return res.status(400).json({ error: 'Job is not open for applications' });
    }

    await run(
      `INSERT INTO applicants (id, job_id, first_name, last_name, email, phone, resume_url, cover_letter, stage, status, applied_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.job_id,
        input.first_name,
        input.last_name,
        input.email,
        input.phone || null,
        input.resume_url || null,
        input.cover_letter || null,
        'applied',
        'active',
        now,
        now,
      ]
    );

    const applicant = await get<Applicant>('SELECT * FROM applicants WHERE id = ?', [id]);
    res.status(201).json(applicant);
  } catch (error) {
    console.error('Error creating applicant:', error);
    res.status(500).json({ error: 'Failed to create applicant' });
  }
});

// Update applicant
router.put('/:id', async (req, res) => {
  try {
    const input: UpdateApplicantInput = req.body;
    const existing = await get<Applicant>('SELECT * FROM applicants WHERE id = ?', [req.params.id]);

    if (!existing) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (input.first_name !== undefined) {
      updates.push('first_name = ?');
      params.push(input.first_name);
    }
    if (input.last_name !== undefined) {
      updates.push('last_name = ?');
      params.push(input.last_name);
    }
    if (input.email !== undefined) {
      updates.push('email = ?');
      params.push(input.email);
    }
    if (input.phone !== undefined) {
      updates.push('phone = ?');
      params.push(input.phone);
    }
    if (input.resume_url !== undefined) {
      updates.push('resume_url = ?');
      params.push(input.resume_url);
    }
    if (input.cover_letter !== undefined) {
      updates.push('cover_letter = ?');
      params.push(input.cover_letter);
    }
    if (input.stage !== undefined) {
      updates.push('stage = ?');
      params.push(input.stage);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
    }

    if (updates.length === 0) {
      return res.json(existing);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(req.params.id);

    await run(
      `UPDATE applicants SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updated = await get<Applicant>('SELECT * FROM applicants WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating applicant:', error);
    res.status(500).json({ error: 'Failed to update applicant' });
  }
});

// Bulk update applicant stages
router.post('/bulk-update-stage', async (req, res) => {
  try {
    const { applicant_ids, stage } = req.body;

    if (!Array.isArray(applicant_ids) || !stage) {
      return res.status(400).json({ error: 'applicant_ids (array) and stage are required' });
    }

    const placeholders = applicant_ids.map(() => '?').join(',');
    await run(
      `UPDATE applicants SET stage = ?, updated_at = ? WHERE id IN (${placeholders})`,
      [stage, new Date().toISOString(), ...applicant_ids]
    );

    res.json({ message: `Updated ${applicant_ids.length} applicants to stage: ${stage}` });
  } catch (error) {
    console.error('Error bulk updating applicants:', error);
    res.status(500).json({ error: 'Failed to bulk update applicants' });
  }
});

// Delete all applicants
router.delete('/', async (req, res) => {
  try {
    await run('DELETE FROM applicants');
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting all applicants:', error);
    res.status(500).json({ error: 'Failed to delete all applicants' });
  }
});

// Delete applicant
router.delete('/:id', async (req, res) => {
  try {
    const existing = await get<Applicant>('SELECT * FROM applicants WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    await run('DELETE FROM applicants WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting applicant:', error);
    res.status(500).json({ error: 'Failed to delete applicant' });
  }
});

// Send job offer to applicant
router.patch('/:id/offer', async (req, res) => {
  try {
    const { salary, joining_date, notes, rules } = req.body;
    const now = new Date().toISOString();

    const existing = await get<any>(`
      SELECT a.*, j.title as job_title 
      FROM applicants a 
      LEFT JOIN jobs j ON a.job_id = j.id 
      WHERE a.id = ?`,
      [req.params.id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    await run(
      `UPDATE applicants 
       SET offer_salary = ?, 
           offer_joining_date = ?, 
           offer_notes = ?, 
           offer_rules = ?,
           offer_status = 'pending',
           offer_sent_at = ?,
           updated_at = ?
       WHERE id = ?`,
      [salary, joining_date, notes, rules, now, now, req.params.id]
    );

    // Send Offer Email
    try {
      await sendEmail({
        to: existing.email,
        subject: `Job Offer from Smart-Cruiter`,
        html: `
          <h2>Congratulations ${existing.first_name}!</h2>
          <p>We are thrilled to offer you the position of <strong>${existing.job_title}</strong> at Smart-Cruiter Inc.</p>
          
          <h3>Offer Details:</h3>
          <ul>
            <li><strong>Annual Salary:</strong> ${salary}</li>
            <li><strong>Joining Date:</strong> ${joining_date}</li>
          </ul>
          
          ${notes ? `<h3>Benefits & Notes:</h3><p>${notes}</p>` : ''}
          
          <p>Please log in to your candidate dashboard to view the full offer letter and accept/reject it.</p>
          <a href="${process.env.VITE_CLIENT_URL || 'http://localhost:3000'}/candidate/applications/${existing.id}/status" style="display:inline-block;padding:10px 20px;background:#6366f1;color:white;text-decoration:none;border-radius:5px;margin-top:10px;">View Offer Details</a>
          
          <p>Best regards,<br>The Smart-Cruiter Team</p>
        `
      });
    } catch (emailError) {
      console.error("Failed to send offer email:", emailError);
    }

    const updated = await get<Applicant>('SELECT * FROM applicants WHERE id = ?', [req.params.id]);
    res.json({ message: 'Offer sent successfully', applicant: updated });
  } catch (error) {
    console.error('Error sending offer:', error);
    res.status(500).json({ error: 'Failed to send offer' });
  }
});

// Candidate response to offer
router.post('/:id/offer-response', async (req, res) => {
  try {
    const { response } = req.body; // 'accepted' or 'rejected'

    if (response !== 'accepted' && response !== 'rejected') {
      return res.status(400).json({ error: 'Response must be "accepted" or "rejected"' });
    }

    const existing = await get<Applicant>('SELECT * FROM applicants WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    if (!existing.offer_sent_at) {
      return res.status(400).json({ error: 'No offer found for this candidate' });
    }

    const stage = response === 'accepted' ? 'hired' : 'declined';
    const now = new Date().toISOString();

    await run(
      `UPDATE applicants 
       SET offer_status = ?, 
           stage = ?,
           updated_at = ?
       WHERE id = ?`,
      [response, stage, now, req.params.id]
    );

    res.json({ message: `Offer ${response} successfully`, stage });
  } catch (error) {
    console.error('Error responding to offer:', error);
    res.status(500).json({ error: 'Failed to process offer response' });
  }
});

export { router as applicantRoutes };

