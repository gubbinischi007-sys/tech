import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { run, get, all } from '../database.js';
import { Interview, CreateInterviewInput, UpdateInterviewInput } from '../models/interview.js';

const router = express.Router();

// Get all interviews (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { applicant_id, job_id, status } = req.query;
    let query = `
      SELECT i.*, 
             a.first_name || ' ' || a.last_name as applicant_name,
             a.email as applicant_email,
             j.title as job_title
      FROM interviews i
      LEFT JOIN applicants a ON i.applicant_id = a.id
      LEFT JOIN jobs j ON i.job_id = j.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (applicant_id) {
      query += ' AND i.applicant_id = ?';
      params.push(applicant_id);
    }
    if (job_id) {
      query += ' AND i.job_id = ?';
      params.push(job_id);
    }
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    query += ' ORDER BY i.scheduled_at ASC';

    const interviews = await all<any>(query, params);
    res.json(interviews);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// Get interview by ID
router.get('/:id', async (req, res) => {
  try {
    const interview = await get<any>(
      `SELECT i.*, 
              a.first_name || ' ' || a.last_name as applicant_name,
              a.email as applicant_email,
              j.title as job_title
       FROM interviews i
       LEFT JOIN applicants a ON i.applicant_id = a.id
       LEFT JOIN jobs j ON i.job_id = j.id
       WHERE i.id = ?`,
      [req.params.id]
    );
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    res.json(interview);
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
});

// Create interview
router.post('/', async (req, res) => {
  try {
    const input: CreateInterviewInput = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    // Verify applicant and job exist
    const applicant = await get('SELECT id FROM applicants WHERE id = ?', [input.applicant_id]);
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const job = await get('SELECT id FROM jobs WHERE id = ?', [input.job_id]);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await run(
      `INSERT INTO interviews (id, applicant_id, job_id, scheduled_at, type, meeting_link, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.applicant_id,
        input.job_id,
        input.scheduled_at,
        input.type || 'online',
        input.meeting_link || null,
        input.notes || null,
        'scheduled',
        now,
        now,
      ]
    );

    const interview = await get<Interview>('SELECT * FROM interviews WHERE id = ?', [id]);
    res.status(201).json(interview);
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({ error: 'Failed to create interview' });
  }
});

// Update interview
router.put('/:id', async (req, res) => {
  try {
    const input: UpdateInterviewInput = req.body;
    const existing = await get<Interview>('SELECT * FROM interviews WHERE id = ?', [req.params.id]);

    if (!existing) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (input.scheduled_at !== undefined) {
      updates.push('scheduled_at = ?');
      params.push(input.scheduled_at);
    }
    if (input.type !== undefined) {
      updates.push('type = ?');
      params.push(input.type);
    }
    if (input.meeting_link !== undefined) {
      updates.push('meeting_link = ?');
      params.push(input.meeting_link);
    }
    if (input.notes !== undefined) {
      updates.push('notes = ?');
      params.push(input.notes);
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
      `UPDATE interviews SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updated = await get<Interview>('SELECT * FROM interviews WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({ error: 'Failed to update interview' });
  }
});

// Delete interview
router.delete('/:id', async (req, res) => {
  try {
    const existing = await get<Interview>('SELECT * FROM interviews WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    await run('DELETE FROM interviews WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ error: 'Failed to delete interview' });
  }
});

export { router as interviewRoutes };

