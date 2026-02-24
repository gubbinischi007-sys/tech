import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import { jobRoutes } from './routes/jobs.js';
import { applicantRoutes } from './routes/applicants.js';
import { interviewRoutes } from './routes/interviews.js';
import { emailRoutes } from './routes/emails.js';
import { analyticsRoutes } from './routes/analytics.js';
import { notificationRoutes } from './routes/notifications.js';
import employeeRoutes from './routes/employees.js';
import historyRoutes from './routes/history.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
initDatabase().then(() => {
  console.log('Database initialized');
});

// Create an API router to handle all routes
const apiRouter = express.Router();

// Routes
apiRouter.use('/jobs', jobRoutes);
apiRouter.use('/applicants', applicantRoutes);
apiRouter.use('/interviews', interviewRoutes);
apiRouter.use('/emails', emailRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/history', historyRoutes);

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount the router on both /api and /
// This ensures routes work locally (usually /api/...) and on Vercel (where /api might be stripped)
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Conditionally start the server if not running on Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`- Local: http://localhost:${PORT}`);
  });
}

export default app;


