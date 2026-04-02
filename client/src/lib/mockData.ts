import { v4 as uuidv4 } from 'uuid';

/**
 * MOCK DATA FOR SMARTCRUITER (UI-ONLY PREVIEW)
 * This data is "baked-in" to the frontend bundle so it works flawlessly on Vercel
 * without any database or API connectivity.
 */

export const MOCK_JOBS = [
  {
    id: 'job-1',
    title: 'Senior Full Stack Engineer',
    department: 'Engineering',
    location: 'Remote / Bangalore',
    type: 'Full-time',
    status: 'open',
    description: 'Seeking a Lead Developer for our core platform and AI integration...',
    requirements: 'React, Node.js, PostgreSQL, OpenAI API experience.',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'job-2',
    title: 'Product Designer (UX/UI)',
    department: 'Design',
    location: 'Hybrid / Mumbai',
    type: 'Full-time',
    status: 'open',
    description: 'Join our creative team to build beautiful, intuitive recruitment experiences.',
    requirements: 'Figma, Prototyping, Design Systems, User Research.',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'job-3',
    title: 'Marketing Manager',
    department: 'Growth',
    location: 'San Francisco, CA',
    type: 'Full-time',
    status: 'open',
    description: 'Scale our user acquisition and brand presence across global markets.',
    requirements: 'B2B SaaS experience, SEO/SEM, Content Strategy.',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'job-4',
    title: 'Backend specialist (Node.js)',
    department: 'Engineering',
    location: 'Remote',
    type: 'Contract',
    status: 'closed',
    description: 'Optimize our high-throughput API layer and database architecture.',
    requirements: 'Node.js, Redis, Microservices, Kubernetes.',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'job-5',
    title: 'HR Operations Lead',
    department: 'Human Resources',
    location: 'London, UK',
    type: 'Full-time',
    status: 'open',
    description: 'Manage our employee life-cycle and internal organizational culture.',
    requirements: 'HRIS, Policy Development, People Management.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper to generate a random date in the last X days
const randomDate = (days: number) => new Date(Date.now() - Math.random() * days * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_APPLICANTS = [
  // Shortlisted Candidates
  { id: 'app-1', job_id: 'job-1', first_name: 'Aditya', last_name: 'Sharma', email: 'aditya.sharma@example.com', stage: 'shortlisted', status: 'active', applied_at: randomDate(5), job_title: 'Senior Full Stack Engineer' },
  { id: 'app-2', job_id: 'job-1', first_name: 'Priya', last_name: 'Patel', email: 'priya.patel@example.com', stage: 'interview', status: 'active', applied_at: randomDate(7), job_title: 'Senior Full Stack Engineer' },
  { id: 'app-3', job_id: 'job-2', first_name: 'Rahul', last_name: 'Verma', email: 'rahul.v@example.com', stage: 'hired', status: 'active', applied_at: randomDate(15), job_title: 'Product Designer (UX/UI)' },
  { id: 'app-4', job_id: 'job-2', first_name: 'Sneha', last_name: 'Reddy', email: 'sneha.r@example.com', stage: 'applied', status: 'active', applied_at: randomDate(2), job_title: 'Product Designer (UX/UI)' },
  { id: 'app-5', job_id: 'job-1', first_name: 'Vikram', last_name: 'Singh', email: 'v.singh@example.com', stage: 'rejected', status: 'rejected', applied_at: randomDate(3), job_title: 'Senior Full Stack Engineer' },
  
  // Generating 45 more diverse applicants
  ...Array.from({ length: 45 }).map((_, i) => {
    const firstNames = ['Amit', 'Anjali', 'Arjun', 'Deepika', 'Ishaan', 'Kavya', 'Manish', 'Neha', 'Rohan', 'Tanvi', 'John', 'Sarah', 'Michael', 'Emma', 'David'];
    const lastNames = ['Gupta', 'Iyer', 'Kapoor', 'Mehta', 'Nayar', 'Rao', 'Shah', 'Trivedi', 'Wadhwa', 'Yadav', 'Smith', 'Johnson', 'Brown', 'Davis', 'Wilson'];
    const departments = ['Engineering', 'Design', 'Growth', 'Human Resources'];
    const stages = ['applied', 'shortlisted', 'technical', 'interview', 'offer', 'hired', 'rejected'];
    const status = (stage: string) => stage === 'rejected' ? 'rejected' : (stage === 'hired' ? 'hired' : 'active');
    
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const stage = stages[Math.floor(Math.random() * stages.length)];
    const job = MOCK_JOBS[Math.floor(Math.random() * MOCK_JOBS.length)];

    return {
      id: `app-gen-${i + 6}`,
      job_id: job.id,
      first_name: fName,
      last_name: lName,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}@example.com`,
      stage: stage,
      status: status(stage),
      applied_at: randomDate(20),
      job_title: job.title,
    };
  })
];

export const MOCK_INTERVIEWS = [
  { id: 'int-1', applicant_id: 'app-2', job_id: 'job-1', scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'scheduled', type: 'online', applicant_name: 'Priya Patel', job_title: 'Senior Full Stack Engineer' },
  { id: 'int-2', applicant_id: 'app-1', job_id: 'job-1', scheduled_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), status: 'scheduled', type: 'online', applicant_name: 'Aditya Sharma', job_title: 'Senior Full Stack Engineer' },
];

export const MOCK_NOTIFICATIONS = [
  { id: 'not-1', recipient_email: 'demo@example.com', subject: 'New Application Received', message: 'A new candidate has applied for the Senior Full Stack Engineer role.', type: 'info', is_read: 0, created_at: randomDate(1) },
  { id: 'not-2', recipient_email: 'demo@example.com', subject: 'Interview Scheduled', message: 'Your interview with Aditya Sharma is starting in 30 minutes.', type: 'alert', is_read: 0, created_at: randomDate(2) },
];

export const MOCK_HISTORY = [
  { id: 'hist-1', name: 'Rahul Verma', email: 'rahul.v@example.com', job_title: 'Product Designer (UX/UI)', status: 'Accepted', date: randomDate(15), reason: 'Hired' },
  { id: 'hist-2', name: 'Vikram Singh', email: 'v.singh@example.com', job_title: 'Senior Full Stack Engineer', status: 'Rejected', date: randomDate(3), reason: 'Technical mismatch' },
];
