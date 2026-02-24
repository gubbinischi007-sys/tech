import express from 'express';
import { get, all } from '../database.js';
import { sendEmail, sendBulkEmails } from '../services/email.js';

const router = express.Router();

// Send bulk acceptance emails
router.post('/bulk-acceptance', async (req, res) => {
  try {
    const { applicant_ids } = req.body;

    if (!Array.isArray(applicant_ids) || applicant_ids.length === 0) {
      return res.status(400).json({ error: 'applicant_ids array is required' });
    }

    const placeholders = applicant_ids.map(() => '?').join(',');
    const applicants = await all<any>(
      `SELECT a.*, j.title as job_title 
       FROM applicants a 
       LEFT JOIN jobs j ON a.job_id = j.id 
       WHERE a.id IN (${placeholders})`,
      applicant_ids
    );

    if (applicants.length === 0) {
      return res.status(404).json({ error: 'No applicants found' });
    }

    const results = await sendBulkEmails(
      applicants,
      'acceptance',
      (applicant) => ({
        subject: `Congratulations! You've been accepted for ${applicant.job_title}`,
        html: `
          <h2>Congratulations ${applicant.first_name}!</h2>
          <p>We are pleased to inform you that you have been accepted for the position of <strong>${applicant.job_title}</strong>.</p>
          <p>Our HR team will be in touch with you shortly regarding next steps.</p>
          <p>Best regards,<br>Smart-Cruiter Team</p>
        `,
      })
    );

    res.json({
      message: `Sent ${results.successful} acceptance emails`,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Error sending bulk acceptance emails:', error);
    res.status(500).json({ error: 'Failed to send bulk acceptance emails' });
  }
});

// Send bulk rejection emails
router.post('/bulk-rejection', async (req, res) => {
  try {
    const { applicant_ids } = req.body;

    if (!Array.isArray(applicant_ids) || applicant_ids.length === 0) {
      return res.status(400).json({ error: 'applicant_ids array is required' });
    }

    const placeholders = applicant_ids.map(() => '?').join(',');
    const applicants = await all<any>(
      `SELECT a.*, j.title as job_title 
       FROM applicants a 
       LEFT JOIN jobs j ON a.job_id = j.id 
       WHERE a.id IN (${placeholders})`,
      applicant_ids
    );

    if (applicants.length === 0) {
      return res.status(404).json({ error: 'No applicants found' });
    }

    const results = await sendBulkEmails(
      applicants,
      'rejection',
      (applicant) => ({
        subject: `Application Update: ${applicant.job_title}`,
        html: `
          <h2>Thank you for your interest, ${applicant.first_name}</h2>
          <p>We appreciate you taking the time to apply for the position of <strong>${applicant.job_title}</strong>.</p>
          <p>After careful consideration, we have decided to move forward with other candidates. We encourage you to apply for future opportunities that match your skills and experience.</p>
          <p>Best regards,<br>Smart-Cruiter Team</p>
        `,
      })
    );

    res.json({
      message: `Sent ${results.successful} rejection emails`,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Error sending bulk rejection emails:', error);
    res.status(500).json({ error: 'Failed to send bulk rejection emails' });
  }
});

// Send duplicate warning emails
router.post('/duplicate-warning', async (req, res) => {
  try {
    const { applicant_ids } = req.body;

    if (!Array.isArray(applicant_ids) || applicant_ids.length === 0) {
      return res.status(400).json({ error: 'applicant_ids array is required' });
    }

    const placeholders = applicant_ids.map(() => '?').join(',');
    const applicants = await all<any>(
      `SELECT a.*, j.title as job_title 
       FROM applicants a 
       LEFT JOIN jobs j ON a.job_id = j.id 
       WHERE a.id IN (${placeholders})`,
      applicant_ids
    );

    if (applicants.length === 0) {
      return res.status(404).json({ error: 'No applicants found' });
    }

    // Since duplicates have the same email, we can group them or send one email per unique email.
    // However, the tool is strictly for "sending warning to that applicant".
    // We will send an email for each ID to ensure they get the notification (or we can de-dupe by email).
    // Let's send one email per duplicate instance to be safe, or we can just target unique emails.
    // For simplicity and to match the "bulk" pattern, we'll process them normally.

    // De-dupe emails to avoid spamming the same user multiple times if multiple duplicates are merged at once
    const uniqueApplicants = Array.from(new Map(applicants.map(item => [item.email, item])).values());

    const results = await sendBulkEmails(
      uniqueApplicants,
      'duplicate_warning',
      (applicant) => ({
        subject: `WARNING: Duplicate Applications Detected`,
        html: `
          <h2>Hello ${applicant.first_name},</h2>
          <p>We noticed that you have submitted multiple applications to our system. This is a violation of our application policy.</p>
          <p style="color: red; font-weight: bold;">Please do not repeat this again.</p>
          <p><strong>If you continue to submit duplicate applications, you will be added to our blacklist and barred from future opportunities.</strong></p>
          <p>We have merged your duplicate profiles into a single record for now.</p>
          <p>Regards,<br>Smart-Cruiter Compliance Team</p>
        `,
      })
    );

    res.json({
      message: `Sent ${results.successful} duplicate warning emails`,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Error sending duplicate warning emails:', error);
    res.status(500).json({ error: 'Failed to send duplicate warning emails' });
  }
});

// Send identity conflict warning emails
router.post('/identity-warning', async (req, res) => {
  try {
    const { applicant_ids } = req.body;

    if (!Array.isArray(applicant_ids) || applicant_ids.length === 0) {
      return res.status(400).json({ error: 'applicant_ids array is required' });
    }

    const placeholders = applicant_ids.map(() => '?').join(',');
    const applicants = await all<any>(
      `SELECT a.*, j.title as job_title 
       FROM applicants a 
       LEFT JOIN jobs j ON a.job_id = j.id 
       WHERE a.id IN (${placeholders})`,
      applicant_ids
    );

    if (applicants.length === 0) {
      return res.status(404).json({ error: 'No applicants found' });
    }

    const results = await sendBulkEmails(
      applicants,
      'identity_warning',
      (applicant) => ({
        subject: `URGENT: Resume Identity Verification Required`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ef4444; border-radius: 8px;">
            <h2 style="color: #ef4444;">Identity Mismatch Detected</h2>
            <p>Hello <strong>${applicant.first_name}</strong>,</p>
            <p>During our automated screening process, we detected that the resume you uploaded for the <strong>${applicant.job_title}</strong> position appears to belong to another individual or contains conflicting identity information.</p>
            <p style="background: #fee2e2; padding: 10px; border-radius: 4px; color: #b91c1c;">
              <strong>Issue:</strong> The name on the uploaded resume document does not match the name on your application profile.
            </p>
            <p>Please log in to your portal and re-upload the correct document immediately to avoid disqualification from this and future roles.</p>
            <p>If you believe this is an error, please contact our support team.</p>
            <p>Regards,<br>Smart-Cruiter Security Team</p>
          </div>
        `,
      })
    );

    res.json({
      message: `Sent ${results.successful} identity mismatch warnings`,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Error sending identity warning emails:', error);
    res.status(500).json({ error: 'Failed to send identity warning emails' });
  }
});

export { router as emailRoutes };

