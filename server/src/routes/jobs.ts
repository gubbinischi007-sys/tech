import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { run, get, all } from '../database.js';
import { Job, CreateJobInput, UpdateJobInput } from '../models/job.js';
import { sendBulkEmails } from '../services/email.js';
import { Applicant } from '../models/applicant.js';

const router = express.Router();

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM jobs ORDER BY created_at DESC';
    const params: any[] = [];

    if (status) {
      query = 'SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC';
      params.push(status);
    }

    const jobs = await all<Job>(query, params);
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await get<Job>('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Create job
router.post('/', async (req, res) => {
  try {
    const input: CreateJobInput = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    await run(
      `INSERT INTO jobs (id, title, department, location, type, description, requirements, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.title,
        input.department || null,
        input.location || null,
        input.type || null,
        input.description || null,
        input.requirements || null,
        input.status || 'open',
        now,
        now,
      ]
    );

    const job = await get<Job>('SELECT * FROM jobs WHERE id = ?', [id]);
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Update job
router.put('/:id', async (req, res) => {
  try {
    const input: UpdateJobInput = req.body;
    const existing = await get<Job>('SELECT * FROM jobs WHERE id = ?', [req.params.id]);

    if (!existing) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      params.push(input.title);
    }
    if (input.department !== undefined) {
      updates.push('department = ?');
      params.push(input.department);
    }
    if (input.location !== undefined) {
      updates.push('location = ?');
      params.push(input.location);
    }
    if (input.type !== undefined) {
      updates.push('type = ?');
      params.push(input.type);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      params.push(input.description);
    }
    if (input.requirements !== undefined) {
      updates.push('requirements = ?');
      params.push(input.requirements);
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
      `UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updated = await get<Job>('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete job
router.delete('/:id', async (req, res) => {
  try {
    const job = await get<Job>('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Fetch all applicants for this job
    const applicants = await all<Applicant>('SELECT * FROM applicants WHERE job_id = ?', [req.params.id]);

    if (applicants && applicants.length > 0) {
      console.log(`Sending job closure emails to ${applicants.length} applicants for job: ${job.title}`);

      // Send bulk email
      await sendBulkEmails(applicants, 'job_closed', (applicant) => ({
        subject: `Update on your application for ${job.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <p>Dear ${applicant.first_name},</p>
            <p>Thank you for your interest in the <strong>${job.title}</strong> position at SmartCruiter.</p>
            <p>We are writing to inform you that this position has been closed and is no longer available.</p>
            <p>We appreciate the time you took to apply and assume your interest in future roles.</p>
            <p>Best regards,<br>The SmartCruiter Recruitment Team</p>
          </div>
        `
      }));
    }

    // Delete the job
    await run('DELETE FROM jobs WHERE id = ?', [req.params.id]);
    // Also cleanup applicants if not handled by DB constraint
    await run('DELETE FROM applicants WHERE job_id = ?', [req.params.id]);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

export { router as jobRoutes };

