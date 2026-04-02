import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { run, get, all } from '../database.js';
import { Applicant, CreateApplicantInput, UpdateApplicantInput, ApplicantStage } from '../models/applicant.js';
import { sendEmail } from '../services/email.js';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = typeof pdfParseModule === 'function' ? pdfParseModule : pdfParseModule.default;

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Get all applicants (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { job_id, stage, status, email } = req.query;
    const companyId = req.headers['x-company-id'];
    let query = `
      SELECT a.*, j.title as job_title 
      FROM applicants a 
      LEFT JOIN jobs j ON a.job_id = j.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (companyId) {
      query += ' AND j.company_id = ?';
      params.push(companyId);
    }

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

// Retroactive Sync of Stages for ALL existing applicants
router.get('/sync-all', async (req, res) => {
  try {
    const applicants = await all<any>('SELECT a.*, j.title as job_title, j.requirements, j.description FROM applicants a LEFT JOIN jobs j ON a.job_id = j.id');
    const results = { rejected: 0, shortlisted: 0, unchanged: 0 };

    for (const applicant of applicants) {
      const resumeUrlLower = (applicant.resume_url || '').toLowerCase();
      const nameParts = [
        (applicant.first_name || '').toLowerCase(),
        (applicant.last_name || '').toLowerCase(),
        (applicant.email || '').split('@')[0].toLowerCase()
      ];

      const isLocalOwner = nameParts.some(part => part.length >= 3 && resumeUrlLower.includes(part));
      let score = 0;

      const jdText = `${applicant.job_title || ''} ${applicant.requirements || applicant.description || ''}`.toLowerCase().replace(/[^a-z\s]/g, ' ');
      const stopWords = new Set([
        'the', 'and', 'to', 'of', 'in', 'for', 'with', 'on', 'is', 'as', 'at', 'by', 'an', 'be', 'this', 'that', 'are', 'from', 'or', 'have', 'has', 'will', 'you', 'your', 'we', 'our', 'it', 'can', 'all', 'more', 'their', 'which', 'about', 'what', 'how', 'when', 'where', 'who', 'not', 'but', 'so', 'if', 'then', 'than', 'such', 'into', 'out', 'up', 'down', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'some', 'any', 'both', 'each', 'few', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'too', 'very',
        'job', 'role', 'team', 'work', 'company', 'experience', 'skills', 'looking', 'years', 'working', 'using', 'ability', 'knowledge', 'strong', 'good', 'excellent',
        'responsible', 'developing', 'maintaining', 'building', 'creating', 'testing', 'writing', 'managing', 'leading', 'supporting', 'understanding', 'ensure', 'ensuring', 'provide', 'providing', 'required', 'requirements', 'including',
        'design', 'designing', 'development', 'software', 'applications', 'systems', 'business', 'data', 'technical', 'technology', 'environment', 'project', 'projects', 'solutions', 'process', 'processes', 'management', 'client', 'clients', 'user', 'users', 'product', 'products', 'service', 'services', 'support', 'performance', 'quality', 'best', 'practices', 'drive', 'driving', 'within', 'across', 'highly', 'related', 'field', 'degree', 'computer', 'science', 'engineering', 'bachelor', 'master', 'equivalent',
        'must', 'plus', 'preferred', 'solid', 'proven', 'track', 'record', 'familiarity', 'proficient', 'proficiency', 'hands-on', 'position', 'opportunity', 'culture', 'benefits', 'salary', 'compensation', 'remote', 'flexible', 'office', 'join', 'hire', 'hiring', 'candidate', 'successful', 'ideal', 'passionate', 'driven', 'motivated', 'self-starter', 'fast-paced', 'dynamic', 'innovative', 'cutting-edge', 'industry', 'collaborating', 'cross', 'functional', 'teams'
      ]);

      const words = jdText.split(/\s+/);
      const keywordCounts: Record<string, number> = {};
      words.forEach(w => {
        if (w.length > 3 && !stopWords.has(w)) {
          keywordCounts[w] = (keywordCounts[w] || 0) + 1;
        }
      });

      const jdKeywords = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
      // Simulate PDF parsing by extracting some keywords based on standard resume structures
      const simulatedText = applicant.resume_url ? 'university bachelor degree experience intern pu school career team worked' : '';
      const applicantText = `${applicant.job_title || ''} ${applicant.first_name || ''} ${applicant.resume_url || ''} ${applicant.cover_letter || ''} ${simulatedText}`.toLowerCase();

      const missingSkills = jdKeywords.filter(kw => !applicantText.includes(kw));

      // Dynamic checks for broader candidate qualifications
      const hasEducation = ['school', 'pu', 'pre university', 'ug', 'pg', 'bachelor', 'master', 'degree', 'diploma', 'university'].some(term => applicantText.includes(term));
      const hasExperience = ['experience', 'intern', 'years', 'worked', 'career'].some(term => applicantText.includes(term));

      if (isLocalOwner) {
        if (jdKeywords.length > 0) {
          const matchRatio = (jdKeywords.length - missingSkills.length) / jdKeywords.length;
          // Base score from keyword text matching
          score = Math.round(100 * matchRatio);

          // Dynamic evaluation adjustments
          if (hasEducation) score += 15;
          if (hasExperience) score += 15;

          score = Math.min(score, 100);
        } else {
          score = 100;
        }
      }

      if (score <= 50) {
        await run('UPDATE applicants SET status = ?, stage = ? WHERE id = ?', ['rejected', 'rejected', applicant.id]);
        results.rejected++;
      } else if (score >= 90) {
        await run('UPDATE applicants SET stage = ? WHERE id = ?', ['shortlisted', applicant.id]);
        results.shortlisted++;
      } else {
        results.unchanged++;
      }
    }

    res.json({ message: 'Sync complete for all applicants', results });
  } catch (error) {
    console.error('Error syncing applicants:', error);
    res.status(500).json({ error: 'Failed to sync applicants' });
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
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const input: CreateApplicantInput = req.body;
    let actualPdfText = '';

    if (req.file) {
      try {
        console.log(`[PDF] Received file: ${req.file.originalname} (${req.file.size} bytes)`);
        const parsed = await pdfParse(req.file.buffer);
        actualPdfText = parsed.text || '';
        console.log(`[PDF] Parsed ${actualPdfText.length} chars of text`);
      } catch (err) {
        console.error("[PDF Parsing error]:", err);
      }
    } else {
      console.log('[PDF] No file received - using fallback scoring');
    }

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
    const job = await get<any>('SELECT * FROM jobs WHERE id = ?', [input.job_id]);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.status !== 'open') {
      return res.status(400).json({ error: 'Job is not open for applications' });
    }

    await run(
      `INSERT INTO applicants (id, job_id, first_name, last_name, email, phone, resume_url, cover_letter, resume_text, stage, status, applied_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.job_id,
        input.first_name,
        input.last_name,
        input.email,
        input.phone || null,
        input.resume_url || null,
        input.cover_letter || null,
        actualPdfText || null,
        'applied',
        'active',
        now,
        now,
      ]
    );

    const applicant = await get<Applicant>('SELECT * FROM applicants WHERE id = ?', [id]);

    // ---- POST CREATION AI AUTO-REJECT MAILER LOGIC ----
    const resumeUrlLower = (input.resume_url || '').toLowerCase();
    const nameParts = [
      (input.first_name || '').toLowerCase(),
      (input.last_name || '').toLowerCase(),
      (input.email || '').split('@')[0].toLowerCase()
    ];
    const isLocalOwner = nameParts.some(part => part.length >= 3 && resumeUrlLower.includes(part));

    let score = 0;
    let missingSkills: string[] = [];

    const jdText = `${job.title || ''} ${job.requirements || job.description || ''}`.toLowerCase().replace(/[^a-z\s]/g, ' ');
    const stopWords = new Set([
      'the', 'and', 'to', 'of', 'in', 'for', 'with', 'on', 'is', 'as', 'at', 'by', 'an', 'be', 'this', 'that', 'are', 'from', 'or', 'have', 'has', 'will', 'you', 'your', 'we', 'our', 'it', 'can', 'all', 'more', 'their', 'which', 'about', 'what', 'how', 'when', 'where', 'who', 'not', 'but', 'so', 'if', 'then', 'than', 'such', 'into', 'out', 'up', 'down', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'some', 'any', 'both', 'each', 'few', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'too', 'very',
      'job', 'role', 'team', 'work', 'company', 'experience', 'skills', 'looking', 'years', 'working', 'using', 'ability', 'knowledge', 'strong', 'good', 'excellent',
      'responsible', 'developing', 'maintaining', 'building', 'creating', 'testing', 'writing', 'managing', 'leading', 'supporting', 'understanding', 'ensure', 'ensuring', 'provide', 'providing', 'required', 'requirements', 'including',
      'design', 'designing', 'development', 'software', 'applications', 'systems', 'business', 'data', 'technical', 'technology', 'environment', 'project', 'projects', 'solutions', 'process', 'processes', 'management', 'client', 'clients', 'user', 'users', 'product', 'products', 'service', 'services', 'support', 'performance', 'quality', 'best', 'practices', 'drive', 'driving', 'within', 'across', 'highly', 'related', 'field', 'degree', 'computer', 'science', 'engineering', 'bachelor', 'master', 'equivalent',
      'must', 'plus', 'preferred', 'solid', 'proven', 'track', 'record', 'familiarity', 'proficient', 'proficiency', 'hands-on', 'position', 'opportunity', 'culture', 'benefits', 'salary', 'compensation', 'remote', 'flexible', 'office', 'join', 'hire', 'hiring', 'candidate', 'successful', 'ideal', 'passionate', 'driven', 'motivated', 'self-starter', 'fast-paced', 'dynamic', 'innovative', 'cutting-edge', 'industry', 'collaborating', 'cross', 'functional', 'teams'
    ]);

    const words = jdText.split(/\s+/);
    const keywordCounts: Record<string, number> = {};
    words.forEach(w => {
      if (w.length > 3 && !stopWords.has(w)) {
        keywordCounts[w] = (keywordCounts[w] || 0) + 1;
      }
    });

    const jdKeywords = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);

    // Use actual PDF text if available, fallback to simulated keywords
    const simulatedText = input.resume_url ? 'university bachelor degree experience intern pu school career team worked' : '';
    const bodyText = actualPdfText.length > 20 ? actualPdfText : simulatedText;
    const applicantText = `${job.title || ''} ${input.first_name || ''} ${input.resume_url || ''} ${input.cover_letter || ''} ${bodyText}`.toLowerCase();

    missingSkills = jdKeywords.filter(kw => !applicantText.includes(kw));

    // Dynamic checks for broader candidate qualifications
    const hasEducation = ['school', 'pu', 'pre university', 'ug', 'pg', 'bachelor', 'master', 'degree', 'diploma', 'university'].some(term => applicantText.includes(term));
    const hasExperience = ['experience', 'intern', 'years', 'worked', 'career'].some(term => applicantText.includes(term));

    if (isLocalOwner) {
      if (jdKeywords.length > 0) {
        const matchRatio = (jdKeywords.length - missingSkills.length) / jdKeywords.length;
        // Base score from keyword text matching
        score = Math.round(100 * matchRatio);

        // Dynamic evaluation adjustments
        if (hasEducation) score += 15;
        if (hasExperience) score += 15;

        score = Math.min(score, 100);
      } else {
        score = 100;
      }
    }

    if (score <= 50) {
      // Reason string for the candidate dashboard
      const autoRejectReason = missingSkills.length > 0
        ? `Your application did not highlight the core skills required: ${missingSkills.join(', ')}.`
        : 'Your application did not strongly align with the technical requirements of this role.';

      // Automatically reject in database
      await run('UPDATE applicants SET status = ?, stage = ?, rejection_reason = ? WHERE id = ?', ['rejected', 'rejected', autoRejectReason, id]);
      if (applicant) {
        applicant.status = 'rejected';
        applicant.stage = 'rejected';
        (applicant as any).rejection_reason = autoRejectReason;
      }

      // Format Missing Skills
      const formattedSkills = missingSkills.map(s => `<li><strong>${s.charAt(0).toUpperCase() + s.slice(1)}</strong></li>`).join('');

      const emailHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1e293b;">Update on your application for ${job.title}</h2>
                <p>Hi ${input.first_name},</p>
                <p>Thank you for taking the time to apply for the <strong>${job.title}</strong> position and for your interest in joining our team. We sincerely appreciate the opportunity to review your background.</p>
                <p>After careful consideration, our team has decided to move forward with candidates whose technical experience more closely aligns with the specific requirements of this role.</p>
                <p>For transparency, our application review system noted that your resume did not strongly highlight experience with the following core skills we are actively seeking for this position:</p>
                <ul style="color: #b91c1c; background: #fef2f2; padding: 15px 30px; border-radius: 5px; border-left: 4px solid #ef4444;">
                    ${formattedSkills || '<li>Core Domain Expertise</li>'}
                </ul>
                <p>We highly encourage you to continue developing these specific areas and we would love to see you apply for future roles with us once you have gained more hands-on experience with them.</p>
                <p>We wish you the absolute best in your professional journey and future endeavors.</p>
                <br/>
                <p>Best regards,</p>
                <p><strong>The Talent Acquisition Team</strong></p>
            </div>
        `;

      // Send email in background, await it so we know it executes correctly
      try {
        await sendEmail({
          to: input.email,
          subject: `Update regarding your application for ${job.title}`,
          html: emailHtml
        });
        console.log(`Auto - reject email sent to ${input.email} `);
      } catch (err) {
        console.error('Failed to send auto-reject email:', err);
      }
    } else if (score >= 90) {
      // Automatically shortlist in database
      await run('UPDATE applicants SET stage = ? WHERE id = ?', ['shortlisted', id]);
      if (applicant) {
        applicant.stage = 'shortlisted';
      }
    }
    // -------------------------------------------------------------

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
    if (input.rejection_reason !== undefined) {
      updates.push('rejection_reason = ?');
      params.push(input.rejection_reason);
    }

    if (updates.length === 0) {
      return res.json(existing);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(req.params.id);

    await run(
      `UPDATE applicants SET ${updates.join(', ')} WHERE id = ? `,
      params
    );

    const updated = await get<Applicant>('SELECT * FROM applicants WHERE id = ?', [req.params.id]);

    // Send rejection email if stage was changed to rejected or declined
    if (input.stage === 'rejected' || input.stage === 'declined') {
      if (existing.stage !== 'rejected' && existing.stage !== 'declined') {
        const jobForEmail = await get<any>('SELECT title FROM jobs WHERE id = ?', [existing.job_id]);

        const emailHtml = `
        < div style = "font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;" >
          <h2 style="color: #1e293b;" > Application Update: ${jobForEmail?.title || 'Job Application'} </h2>
            < p > Hi ${existing.first_name}, </p>
              < p > Thank you for taking the time to apply for the < strong > ${jobForEmail?.title || 'position'} </strong> and for your interest in joining our team. We sincerely appreciate the opportunity to review your background.</p >
                <p>After careful consideration, our team has decided to move forward with other candidates at this time.</p>
              ${input.rejection_reason ? `<p style="padding: 15px; background: #fef2f2; border-left: 4px solid #ef4444; color: #b91c1c; border-radius: 4px;"><strong>Feedback from our team:</strong><br/>${input.rejection_reason}</p>` : ''}
    <p>We highly encourage you to apply for future roles with us and wish you the absolute best in your professional journey and future endeavors.</p>
      < br />
      <p>Best regards, </p>
        < p > <strong>The Talent Acquisition Team < /strong></p >
          </div>
            `;
        try {
          await sendEmail({
            to: existing.email,
            subject: `Update regarding your application for ${jobForEmail?.title || 'our company'}`,
            html: emailHtml
          });
          console.log(`Rejection email sent to ${existing.email} `);
        } catch (emailErr) {
          console.error("Failed to send rejection email on manual update:", emailErr);
        }
      }
    }

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

    let setClause = `stage = ?, updated_at = ? `;
    const args: any[] = [stage, new Date().toISOString()];

    if (req.body.rejection_reason) {
      setClause += `, rejection_reason = ? `;
      args.push(req.body.rejection_reason);
    }

    args.push(...applicant_ids);

    await run(
      `UPDATE applicants SET ${setClause} WHERE id IN(${placeholders})`,
      args
    );

    // Send emails if stage is rejected
    if (stage === 'rejected' || stage === 'declined') {
      const applicantsToEmail = await all<any>(`SELECT a.email, a.first_name, j.title as job_title FROM applicants a LEFT JOIN jobs j ON a.job_id = j.id WHERE a.id IN(${placeholders})`, [...applicant_ids]);
      for (const a of applicantsToEmail) {
        if (!a.email) continue;
        const emailHtml = `
    < div style = "font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;" >
      <h2 style="color: #1e293b;" > Application Update: ${a.job_title || 'Job Application'} </h2>
        < p > Hi ${a.first_name}, </p>
          < p > Thank you for taking the time to apply for the < strong > ${a.job_title || 'position'} < /strong> and for your interest in joining our team. We sincerely appreciate the opportunity to review your background.</p >
            <p>After careful consideration, our team has decided to move forward with other candidates at this time.</p>
              ${req.body.rejection_reason ? `<p style="padding: 15px; background: #fef2f2; border-left: 4px solid #ef4444; color: #b91c1c; border-radius: 4px;"><strong>Feedback from our team:</strong><br/>${req.body.rejection_reason}</p>` : ''}
  <p>We highly encourage you to apply for future roles with us and wish you the absolute best in your professional journey and future endeavors.</p>
    < br />
    <p>Best regards, </p>
      < p > <strong>The Talent Acquisition Team < /strong></p >
        </div>
          `;
        try {
          // Fire and forget
          sendEmail({
            to: a.email,
            subject: `Update regarding your application for ${a.job_title || 'our company'}`,
            html: emailHtml
          }).catch(console.error);
        } catch (e) {
          console.error(e);
        }
      }
    }

    res.json({ message: `Updated ${applicant_ids.length} applicants to stage: ${stage} ` });
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
      WHERE a.id = ? `,
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
      WHERE id = ? `,
      [salary, joining_date, notes, rules, now, now, req.params.id]
    );

    // Send Offer Email
    try {
      await sendEmail({
        to: existing.email,
        subject: `Job Offer from Smart - Cruiter`,
        html: `
    < h2 > Congratulations ${existing.first_name} !</h2>
      < p > We are thrilled to offer you the position of < strong > ${existing.job_title} </strong> at ApexRecruit Inc.</p >

        <h3>Offer Details: </h3>
          < ul >
          <li><strong>Annual Salary: </strong> ${salary}</li >
            <li><strong>Joining Date: </strong> ${joining_date}</li >
              </ul>
          
          ${notes ? `<h3>Benefits & Notes:</h3><p>${notes}</p>` : ''}

  <p>Please log in to your candidate dashboard to view the full offer letter and accept / reject it.</p>
    < a href = "${process.env.VITE_CLIENT_URL || 'http://localhost:3000'}/candidate/applications/${existing.id}/status" style = "display:inline-block;padding:10px 20px;background:#6366f1;color:white;text-decoration:none;border-radius:5px;margin-top:10px;" > View Offer Details </a>

      < p > Best regards, <br>The Smart - Cruiter Team </p>
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
      WHERE id = ? `,
      [response, stage, now, req.params.id]
    );

    res.json({ message: `Offer ${response} successfully`, stage });
  } catch (error) {
    console.error('Error responding to offer:', error);
    res.status(500).json({ error: 'Failed to process offer response' });
  }
});

export { router as applicantRoutes };

