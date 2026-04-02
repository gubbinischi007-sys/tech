import { createClient } from '@libsql/client';
import 'dotenv/config';

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

/**
 * Turso / libSQL Client
 * Works locally (file:local.db) and in production (libsql://...)
 */
export const turso = createClient({
  url: url,
  authToken: authToken,
});
