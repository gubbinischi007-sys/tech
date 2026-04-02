import { turso } from './lib/turso.js';

/**
 * database.ts — Turso / SQLite Database Layer
 *
 * Implements run(), get(), and all() for the backend routes.
 * Uses libSQL (@libsql/client) for cloud persistence (Turso) or local file storage.
 */

// ─────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────

/** Executes INSERT, UPDATE, DELETE */
export async function run(sql: string, params: any[] = []): Promise<void> {
  // Convert ? to named parameters or simply pass them as an array if the driver supports it
  // @libsql/client supports standard sqlite ? placeholders
  try {
    await turso.execute({
      sql: sql,
      args: params
    });
  } catch (error) {
    console.error('Database Error (run):', { sql, params, error });
    throw error;
  }
}

/** Returns first matching row or undefined */
export async function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const rs = await turso.execute({
    sql: sql,
    args: params
  });
  return (rs.rows[0] as unknown as T) || undefined;
}

/** Returns all matching rows */
export async function all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const rs = await turso.execute({
    sql: sql,
    args: params
  });
  return rs.rows as unknown as T[];
}

/** 
 * Called on startup — creates tables if they don't exist
 */
export async function initDatabase(): Promise<void> {
  console.log('🔄 Initializing Turso Database Schema...');

  const tables = [
    // Companies
    `CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      slug TEXT UNIQUE NOT NULL,
      logo_url TEXT,
      invite_code TEXT UNIQUE,
      plan TEXT DEFAULT 'free',
      status TEXT DEFAULT 'pending',
      document_url TEXT,
      tracking_id TEXT UNIQUE,
      rejection_reason TEXT,
      company_pin TEXT,
      setup_completed BOOLEAN DEFAULT 0,
      owner_id TEXT,
      admin_doc_verified BOOLEAN DEFAULT 0,
      admin_doc_verified_at TEXT,
      admin_bg_checked BOOLEAN DEFAULT 0,
      admin_bg_checked_at TEXT,
      admin_notes TEXT DEFAULT '',
      extracted_tax_id TEXT,
      extracted_keywords TEXT, -- Store as JSON string or comma-separated
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // User Profiles
    `CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT DEFAULT '',
      role TEXT DEFAULT 'applicant',
      role_title TEXT,
      company_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )`,

    // Jobs
    `CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      title TEXT NOT NULL,
      department TEXT,
      location TEXT,
      type TEXT,
      description TEXT,
      requirements TEXT,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
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
      offer_salary TEXT,
      offer_joining_date TEXT,
      offer_status TEXT,
      offer_notes TEXT,
      offer_rules TEXT,
      offer_sent_at TEXT,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    )`,

    // Interviews
    `CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      applicant_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      meeting_link TEXT,
      notes TEXT,
      type TEXT DEFAULT 'online',
      status TEXT DEFAULT 'scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (applicant_id) REFERENCES applicants(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    )`,

    // Employees
    `CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      applicant_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      job_title TEXT,
      department TEXT,
      hired_date TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )`,

    // Notifications
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Application History
    `CREATE TABLE IF NOT EXISTS application_history (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      job_title TEXT,
      status TEXT NOT NULL,
      reason TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )`,

    // Candidate References
    `CREATE TABLE IF NOT EXISTS candidate_references (
      id TEXT PRIMARY KEY,
      applicant_id TEXT NOT NULL,
      ref_name TEXT NOT NULL,
      ref_email TEXT NOT NULL,
      relationship TEXT,
      token TEXT UNIQUE,
      responses TEXT, -- JSON string
      status TEXT DEFAULT 'pending',
      submitted_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  try {
    for (const sql of tables) {
      await turso.execute(sql);
    }
    console.log('✅ Turso Database: Schema initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize Turso database:', err);
    throw err;
  }
}
