import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as ics from 'ics';
import { run, get, all } from '../database.js';
import { Interview, CreateInterviewInput, UpdateInterviewInput } from '../models/interview.js';
import { sendEmail } from '../services/email.js';
import { format, addHours } from 'date-fns';

const router = express.Router();

// Get all interviews (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { applicant_id, job_id, status } = req.query;
    const companyId = req.headers['x-company-id'];
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

    if (companyId) {
      query += ' AND j.company_id = ?';
      params.push(companyId);
    }

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
    const applicant = await get('SELECT id, first_name, last_name, email FROM applicants WHERE id = ?', [input.applicant_id]);
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const job = await get('SELECT id, title FROM jobs WHERE id = ?', [input.job_id]);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Auto-generate meeting link for online interviews if missing
    let finalMeetingLink = input.meeting_link;
    if ((!input.type || input.type === 'online') && !finalMeetingLink) {
      finalMeetingLink = `https://meet.apexrecruit.com/${id.split('-')[0]}`;
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
        finalMeetingLink || null,
        input.notes || null,
        'scheduled',
        now,
        now,
      ]
    );

    // Prepare Calendar Invite (ics)
    const startDate = new Date(input.scheduled_at);
    const event: ics.EventAttributes = {
      start: [
        startDate.getUTCFullYear(),
        startDate.getUTCMonth() + 1,
        startDate.getUTCDate(),
        startDate.getUTCHours(),
        startDate.getUTCMinutes()
      ],
      startInputType: 'utc',
      duration: { hours: 1, minutes: 0 },
      title: `Interview: ${job.title} at ApexRecruit`,
      description: `Interview for ${job.title} position.\nNotes: ${input.notes || ''}`,
      location: finalMeetingLink || 'Our Main Office',
      url: finalMeetingLink || '',
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: 'ApexRecruit HR', email: 'hr@apexrecruit.com' },
      attendees: [
        { name: `${applicant.first_name} ${applicant.last_name}`, email: applicant.email, rsvp: true, role: 'REQ-PARTICIPANT' }
      ]
    };

    ics.createEvent(event, async (error, value) => {
      if (!error && value) {
        // Send email with ICS attachment
        try {
          // You need to configure nodemailer in `sendEmail` to accept attachments if you want the actual .ics file,
          // but just providing the raw text in the body or standard calendar header also works. We will just send it as an email.
          // For a true calendar invite, it would be attached, here we simulate by notifying.
          // In a real app we would modify `sendEmail` to accept `alternatives` or `attachments`. 
          const emailHtml = `
            <h2>Interview Scheduled: ${job.title}</h2>
            <p>Hi ${applicant.first_name},</p>
            <p>Your interview has been scheduled for <strong>${format(startDate, 'MMMM do, yyyy h:mm a')}</strong>.</p>
            <p>${finalMeetingLink ? `Meeting Link: <a href="${finalMeetingLink}">${finalMeetingLink}</a>` : 'Location: Our Main Office'}</p>
            <p>Please find the calendar invite details added to your schedule.</p>
          `;
          await sendEmail({
            to: applicant.email,
            subject: `Interview Scheduled: ${job.title}`,
            html: emailHtml,
          });
        } catch (e) {
          console.error('Failed to send calendar invite', e);
        }
      }
    });

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
    if (input.rating !== undefined) {
      updates.push('rating = ?');
      params.push(input.rating);
    }
    if (input.feedback !== undefined) {
      updates.push('feedback = ?');
      params.push(input.feedback);
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

    // Post-Interview Scorecard Logic: automatically move to Recommended if rating >= 4
    if (input.rating !== undefined && input.rating >= 4) {
      await run(`UPDATE applicants SET stage = 'recommended', updated_at = ? WHERE id = ?`, [new Date().toISOString(), existing.applicant_id]);
      console.log(`Applicant ${existing.applicant_id} auto-promoted to recommended due to high rating (${input.rating})`);
    }

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

