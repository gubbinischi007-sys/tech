import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { run, all, get } from '../database.js';
import { sendEmail } from '../services/email.js';

const router = express.Router();

// Request references for an applicant (HR Only)
router.post('/request', async (req, res) => {
  try {
    const { applicant_id, ref_name, ref_email, relationship } = req.body;
    
    if (!applicant_id || !ref_name || !ref_email) {
      return res.status(400).json({ error: 'applicant_id, ref_name and ref_email are required' });
    }

    const applicant = await get('SELECT * FROM applicants WHERE id = ?', [applicant_id]);
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const id = uuidv4();
    const token = uuidv4(); // Unique token for the public form

    await run(
      'INSERT INTO candidate_references (id, applicant_id, ref_name, ref_email, relationship, token) VALUES (?, ?, ?, ?, ?, ?)',
      [id, applicant_id, ref_name, ref_email, relationship || null, token]
    );

    // Send email to the reference
    const portalUrl = process.env.VITE_CLIENT_URL || 'http://localhost:3000';
    const referenceUrl = `${portalUrl}/reference-check/${token}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6366f1;">Professional Reference Request</h2>
          <p>Hello ${ref_name},</p>
          <p><strong>${applicant.first_name} ${applicant.last_name}</strong> has listed you as a professional reference for their job application at Smart-Cruiter.</p>
          <p>We would appreciate your candid feedback regarding their professional background and skills. The process only takes 2-3 minutes.</p>
          <p style="margin-top: 30px;">
              <a href="${referenceUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
                  Provide Reference Feedback
              </a>
          </p>
          <p style="color:#666; font-size: 14px; margin-top: 20px;">If the button above doesn't work, copy and paste this link into your browser: <br/> ${referenceUrl}</p>
          <br/>
          <p>Best regards,</p>
          <p><strong>The Talent Acquisition Team</strong></p>
      </div>
    `;

    try {
      await sendEmail({
        to: ref_email,
        subject: `Reference Request for ${applicant.first_name} ${applicant.last_name}`,
        html: emailHtml
      });
    } catch (emailErr) {
      console.error('Failed to send reference request email:', emailErr);
      // We still return 201 because the database entry was created
    }

    res.status(201).json({ id, token, applicant_id });
  } catch (error) {
    console.error('Error requesting reference:', error);
    res.status(500).json({ error: 'Failed to request reference' });
  }
});

// Get reference form details via token (Public)
router.get('/form/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const ref = await get(
      `SELECT r.*, a.first_name, a.last_name, j.title as job_title 
       FROM candidate_references r 
       JOIN applicants a ON r.applicant_id = a.id 
       JOIN jobs j ON a.job_id = j.id
       WHERE r.token = ?`,
      [token]
    );

    if (!ref) {
      return res.status(404).json({ error: 'Reference request not found or link expired' });
    }

    if (ref.status === 'submitted') {
      return res.status(400).json({ error: 'This reference form has already been submitted. Thank you!' });
    }

    res.json(ref);
  } catch (error) {
    console.error('Error fetching reference form:', error);
    res.status(500).json({ error: 'Failed to fetch reference form' });
  }
});

// Submit reference response (Public)
router.post('/form/:token/submit', async (req, res) => {
  try {
    const { token } = req.params;
    const { responses } = req.body; // JSON object with questionnaire data

    if (!responses) {
      return res.status(400).json({ error: 'Responses are required' });
    }

    const ref = await get('SELECT * FROM candidate_references WHERE token = ?', [token]);
    if (!ref) {
      return res.status(404).json({ error: 'Reference request not found' });
    }

    if (ref.status === 'submitted') {
      return res.status(400).json({ error: 'Reference already submitted' });
    }

    const now = new Date().toISOString();
    await run(
      'UPDATE candidate_references SET status = ?, responses = ?, submitted_at = ? WHERE token = ?',
      ['submitted', JSON.stringify(responses), now, token]
    );

    res.json({ message: 'Reference submitted successfully' });
  } catch (error) {
    console.error('Error submitting reference:', error);
    res.status(500).json({ error: 'Failed to submit reference' });
  }
});

// Get all references for an applicant (HR Only)
router.get('/applicant/:applicant_id', async (req, res) => {
  try {
    const { applicant_id } = req.params;
    const references = await all('SELECT * FROM candidate_references WHERE applicant_id = ? ORDER BY created_at DESC', [applicant_id]);
    
    // Parse JSON responses for each reference
    const parsedReferences = references.map(ref => ({
      ...ref,
      responses: ref.responses ? JSON.parse(ref.responses) : null
    }));

    res.json(parsedReferences);
  } catch (error) {
    console.error('Error fetching references for applicant:', error);
    res.status(500).json({ error: 'Failed to fetch references' });
  }
});

export default router;
