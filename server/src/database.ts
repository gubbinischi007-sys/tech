import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eluarxdyxvxwknylejaj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsdWFyeGR5eHZ4d2tueWxlamFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg5ODU5NiwiZXhwIjoyMDg3NDc0NTk2fQ.7RK3EqTtOlOrS4KNqttdmFb6mhuDp99bAKyKywphFXE';

// Use service role key for full server-side access (bypasses Row Level Security)
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// Helper: convert SQLite-style ? placeholders → $1, $2, ... for PostgreSQL
// This keeps ALL existing route files working with zero changes.
// ─────────────────────────────────────────────────────────────────────────────
function toPostgres(sql: string): string {
  let idx = 0;
  return sql.replace(/\?/g, () => `$${++idx}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// run() – INSERT / UPDATE / DELETE
// ─────────────────────────────────────────────────────────────────────────────
export async function run(sql: string, params: any[] = []): Promise<void> {
  const { error } = await supabase.rpc('exec_sql', {
    query: toPostgres(sql),
    params: params
  }).throwOnError();

  // Fallback: use raw postgres via supabase.from for simple queries
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// get() – SELECT single row
// ─────────────────────────────────────────────────────────────────────────────
export async function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const { data, error } = await supabase.rpc('exec_sql_returning', {
    query: toPostgres(sql),
    params: params
  });
  if (error) throw error;
  return (data?.[0]) as T | undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// all() – SELECT multiple rows
// ─────────────────────────────────────────────────────────────────────────────
export async function all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const { data, error } = await supabase.rpc('exec_sql_returning', {
    query: toPostgres(sql),
    params: params
  });
  if (error) throw error;
  return (data || []) as T[];
}

// ─────────────────────────────────────────────────────────────────────────────
// initDatabase() — create all tables via Supabase SQL Editor RPC
// ─────────────────────────────────────────────────────────────────────────────
export async function initDatabase(): Promise<void> {
  console.log('Initializing Supabase database tables...');

  const queries = [
    // Jobs
    `CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      department TEXT,
      location TEXT,
      type TEXT,
      description TEXT,
      requirements TEXT,
      status TEXT DEFAULT 'open',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // Applicants
    `CREATE TABLE IF NOT EXISTS applicants (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      resume_url TEXT,
      cover_letter TEXT,
      stage TEXT DEFAULT 'applied',
      status TEXT DEFAULT 'active',
      applied_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      offer_salary TEXT,
      offer_joining_date TEXT,
      offer_status TEXT,
      offer_notes TEXT,
      offer_sent_at TIMESTAMPTZ,
      offer_rules TEXT
    )`,

    // Interviews
    `CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      applicant_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      scheduled_at TIMESTAMPTZ NOT NULL,
      type TEXT DEFAULT 'online',
      meeting_link TEXT,
      notes TEXT,
      status TEXT DEFAULT 'scheduled',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // Employees
    `CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      applicant_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      job_title TEXT,
      department TEXT,
      hired_date TIMESTAMPTZ,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // Notifications
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // Application History
    `CREATE TABLE IF NOT EXISTS application_history (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      job_title TEXT,
      status TEXT NOT NULL,
      reason TEXT,
      date TIMESTAMPTZ DEFAULT NOW()
    )`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_applicants_job_id ON applicants(job_id)`,
    `CREATE INDEX IF NOT EXISTS idx_applicants_stage ON applicants(stage)`,
    `CREATE INDEX IF NOT EXISTS idx_interviews_applicant_id ON interviews(applicant_id)`,
    `CREATE INDEX IF NOT EXISTS idx_history_email ON application_history(email)`,
  ];

  for (const query of queries) {
    const { error } = await supabase.rpc('exec_sql', { query, params: [] });
    if (error && !error.message.includes('already exists')) {
      console.error('Migration error:', error.message);
    }
  }

  console.log('Supabase database tables initialized.');
}
