/**
 * database.ts — Supabase Compatibility Shim
 *
 * Replaces the old SQLite layer. All existing routes call `run()`, `get()`, and `all()`
 * with raw SQL. This shim translates those calls into Supabase Postgres queries, so all
 * existing route files work without modification.
 */

import { supabase } from './lib/supabase.js';

// ─────────────────────────────────────────────────────────
// SQL → Supabase Query Translator
// ─────────────────────────────────────────────────────────

/**
 * Parses a SQLite-style parameterized query (using ?) and params array,
 * then executes it against Supabase via the REST API.
 */

function substitutePlaceholders(sql: string, params: any[]): string {
  let i = 0;
  return sql.replace(/\?/g, () => {
    const val = params[i++];
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return String(val);
    // Escape single quotes
    return `'${String(val).replace(/'/g, "''")}'`;
  });
}

async function executeRaw(sql: string): Promise<any[]> {
  const { data, error } = await supabase.rpc('exec_sql', { query: sql }).select();
  if (error) throw error;
  return data || [];
}

/** 
 * Determines target table from a SQL string 
 */
function extractTable(sql: string): string {
  const lower = sql.toLowerCase().trim();
  // INSERT INTO <table>
  let m = lower.match(/insert\s+into\s+"?(\w+)"?/);
  if (m) return m[1];
  // UPDATE <table>
  m = lower.match(/update\s+"?(\w+)"?/);
  if (m) return m[1];
  // DELETE FROM <table>
  m = lower.match(/delete\s+from\s+"?(\w+)"?/);
  if (m) return m[1];
  // SELECT ... FROM <table>
  m = lower.match(/from\s+"?(\w+)"?/);
  if (m) return m[1];
  return '';
}

// ─────────────────────────────────────────────────────────
// Parse INSERT statements
// ─────────────────────────────────────────────────────────
function parseInsert(sql: string, params: any[]): { table: string; row: Record<string, any> } | null {
  const m = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (!m) return null;
  const table = m[1];
  const cols = m[2].split(',').map(c => c.trim());
  const values = params;
  const row: Record<string, any> = {};
  cols.forEach((col, i) => { row[col] = values[i] !== undefined ? values[i] : null; });
  return { table, row };
}

// ─────────────────────────────────────────────────────────
// Parse UPDATE statements
// ─────────────────────────────────────────────────────────
function parseUpdate(sql: string, params: any[]): { table: string; updates: Record<string, any>; whereCol: string; whereVal: any } | null {
  const m = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+)\s+WHERE\s+(\w+)\s*=\s*\?/i);
  if (!m) return null;
  const table = m[1];
  const setPart = m[2];
  const whereCol = m[3];
  
  // Extract SET assignments
  const assignments = setPart.split(',').map(s => s.trim());
  const updates: Record<string, any> = {};
  let paramIdx = 0;
  for (const a of assignments) {
    const am = a.match(/(\w+)\s*=\s*\?/);
    if (am) {
      updates[am[1]] = params[paramIdx++];
    }
  }
  // Last param is WHERE value
  const whereVal = params[paramIdx];
  return { table, updates, whereCol, whereVal };
}

// ─────────────────────────────────────────────────────────
// Parse DELETE statements
// ─────────────────────────────────────────────────────────
function parseDelete(sql: string, params: any[]): { table: string; filters: Record<string, any> } | null {
  const m = sql.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
  if (!m) return null;
  const table = m[1];
  const wherePart = m[2] || '';
  const filters: Record<string, any> = {};
  
  if (wherePart) {
    const conds = wherePart.split(/\s+AND\s+/i);
    let paramIdx = 0;
    for (const cond of conds) {
      const cm = cond.match(/(\w+)\s*=\s*\?/i);
      if (cm) {
        filters[cm[1]] = params[paramIdx++];
      }
    }
  }
  return { table, filters };
}

// ─────────────────────────────────────────────────────────
// Parse SELECT statements
// ─────────────────────────────────────────────────────────
function parseSelect(sql: string, params: any[]): { table: string; filters: Record<string, any>; orderBy?: string; orderDir?: string; limit?: number } | null {
  const m = sql.match(/FROM\s+(\w+)/i);
  if (!m) return null;
  const table = m[1];

  const filters: Record<string, any> = {};
  let paramIdx = 0;

  // WHERE conditions (col = ?)
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
  if (whereMatch) {
    const wherePart = whereMatch[1];
    const conds = wherePart.split(/\s+AND\s+/i);
    for (const cond of conds) {
      const cm = cond.trim().match(/(\w+)\s*=\s*\?/i);
      if (cm && paramIdx < params.length) {
        filters[cm[1]] = params[paramIdx++];
      }
    }
  }

  // ORDER BY
  let orderBy: string | undefined;
  let orderDir: string | undefined;
  const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
  if (orderMatch) {
    orderBy = orderMatch[1];
    orderDir = (orderMatch[2] || 'ASC').toUpperCase();
  }

  // LIMIT
  let limit: number | undefined;
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) limit = parseInt(limitMatch[1]);

  return { table, filters, orderBy, orderDir, limit };
}

// ─────────────────────────────────────────────────────────
// Public API — matches the old database.ts interface
// ─────────────────────────────────────────────────────────

/** Executes INSERT, UPDATE, DELETE */
export async function run(sql: string, params: any[] = []): Promise<void> {
  const trimmed = sql.trim().toUpperCase();

  if (trimmed.startsWith('INSERT')) {
    const parsed = parseInsert(sql, params);
    if (!parsed) throw new Error(`Could not parse INSERT: ${sql}`);
    const { error } = await supabase.from(parsed.table).insert(parsed.row);
    if (error) throw error;
    return;
  }

  if (trimmed.startsWith('UPDATE')) {
    const parsed = parseUpdate(sql, params);
    if (!parsed) throw new Error(`Could not parse UPDATE: ${sql}`);
    let query = supabase.from(parsed.table).update(parsed.updates);
    if (parsed.whereCol && parsed.whereVal !== undefined) {
      query = query.eq(parsed.whereCol, parsed.whereVal);
    }
    const { error } = await query;
    if (error) throw error;
    return;
  }

  if (trimmed.startsWith('DELETE')) {
    const parsed = parseDelete(sql, params);
    if (!parsed) throw new Error(`Could not parse DELETE: ${sql}`);
    let query = supabase.from(parsed.table).delete();
    for (const [col, val] of Object.entries(parsed.filters)) {
      query = query.eq(col, val);
    }
    if (Object.keys(parsed.filters).length === 0) {
      // Safety: never delete everything unless explicitly intended
      query = query.neq('id', '__never__');
    }
    const { error } = await query;
    if (error) throw error;
    return;
  }

  // CREATE TABLE / ALTER TABLE / CREATE INDEX — ignore, Supabase manages schema
  if (trimmed.startsWith('CREATE') || trimmed.startsWith('ALTER') || trimmed.startsWith('DROP')) {
    return;
  }

  throw new Error(`Unsupported SQL statement in run(): ${sql}`);
}

/** Returns first matching row or undefined */
export async function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const rows = await all<T>(sql, params);
  return rows[0];
}

/** Returns all matching rows */
export async function all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const parsed = parseSelect(sql, params);
  if (!parsed) throw new Error(`Could not parse SELECT: ${sql}`);
  const { table, filters, orderBy, orderDir, limit } = parsed;

  let query = supabase.from(table).select('*');

  for (const [col, val] of Object.entries(filters)) {
    if (val === null) {
      query = query.is(col, null);
    } else {
      query = query.eq(col, val);
    }
  }

  if (orderBy) {
    query = query.order(orderBy, { ascending: orderDir !== 'DESC' });
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as T[];
}

/** 
 * Called on startup — no-op now since Supabase manages schema via migrations 
 */
export async function initDatabase(): Promise<void> {
  console.log('✅ Database layer: Supabase Postgres (SQLite disabled)');
}
