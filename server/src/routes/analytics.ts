import express from 'express';
import { get, all } from '../database.js';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const totalJobs = await get<{ count: string }>('SELECT COUNT(*) as count FROM jobs');
    const openJobs = await get<{ count: string }>('SELECT COUNT(*) as count FROM jobs WHERE status = ?', ['open']);
    const totalApplicants = await get<{ count: string }>('SELECT COUNT(*) as count FROM applicants');

    const applicantsByStage = await all<{ stage: string; count: number }>(
      `SELECT stage, COUNT(*) as count FROM applicants GROUP BY stage`
    );

    const applicantsByJob = await all<{ job_id: string; job_title: string; count: number }>(
      `SELECT j.id as job_id, j.title as job_title, COUNT(a.id) as count
       FROM jobs j
       LEFT JOIN applicants a ON j.id = a.job_id
       GROUP BY j.id, j.title
       ORDER BY count DESC
       LIMIT 10`
    );

    // PostgreSQL: use NOW() - INTERVAL
    const recentApplicants = await get<{ count: string }>(
      `SELECT COUNT(*) as count FROM applicants WHERE applied_at >= NOW() - INTERVAL '30 days'`
    );

    // PostgreSQL: use NOW() directly
    const scheduledInterviews = await get<{ count: string }>(
      `SELECT COUNT(*) as count FROM interviews WHERE status = 'scheduled' AND scheduled_at >= NOW()`
    );

    res.json({
      totalJobs: parseInt(totalJobs?.count || '0'),
      openJobs: parseInt(openJobs?.count || '0'),
      totalApplicants: parseInt(totalApplicants?.count || '0'),
      recentApplicants: parseInt(recentApplicants?.count || '0'),
      scheduledInterviews: parseInt(scheduledInterviews?.count || '0'),
      applicantsByStage,
      applicantsByJob,
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// Get applicants by stage (for charts)
router.get('/applicants-by-stage', async (req, res) => {
  try {
    const data = await all<{ stage: string; count: number }>(
      `SELECT stage, COUNT(*) as count
       FROM applicants
       GROUP BY stage
       ORDER BY
         CASE stage
           WHEN 'applied' THEN 1
           WHEN 'shortlisted' THEN 2
           WHEN 'recommended' THEN 3
           WHEN 'hired' THEN 4
           WHEN 'declined' THEN 5
           WHEN 'withdrawn' THEN 6
           ELSE 7
         END`
    );
    res.json(data);
  } catch (error) {
    console.error('Error fetching applicants by stage:', error);
    res.status(500).json({ error: 'Failed to fetch applicants by stage' });
  }
});

// Get applicants over time
router.get('/applicants-over-time', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    // PostgreSQL: cast to date and use parameterized INTERVAL
    const data = await all<{ date: string; count: number }>(
      `SELECT applied_at::date as date, COUNT(*) as count
       FROM applicants
       WHERE applied_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY applied_at::date
       ORDER BY date ASC`,
      [days]
    );
    res.json(data);
  } catch (error) {
    console.error('Error fetching applicants over time:', error);
    res.status(500).json({ error: 'Failed to fetch applicants over time' });
  }
});

// Get job statistics
router.get('/job-stats/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const totalApplicants = await get<{ count: string }>(
      'SELECT COUNT(*) as count FROM applicants WHERE job_id = ?',
      [jobId]
    );

    const applicantsByStage = await all<{ stage: string; count: number }>(
      `SELECT stage, COUNT(*) as count FROM applicants WHERE job_id = ? GROUP BY stage`,
      [jobId]
    );

    const interviews = await get<{ count: string }>(
      'SELECT COUNT(*) as count FROM interviews WHERE job_id = ?',
      [jobId]
    );

    res.json({
      totalApplicants: parseInt(totalApplicants?.count || '0'),
      applicantsByStage,
      totalInterviews: parseInt(interviews?.count || '0'),
    });
  } catch (error) {
    console.error('Error fetching job statistics:', error);
    res.status(500).json({ error: 'Failed to fetch job statistics' });
  }
});

export { router as analyticsRoutes };
