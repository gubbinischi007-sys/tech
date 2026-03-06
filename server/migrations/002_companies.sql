-- ============================================================
-- SmartCruiter Migration 002: Companies table (multi-tenancy)
-- Run this in Supabase SQL Editor if not already done via the UI
-- ✅ Already executed on 2026-03-06
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  invite_code TEXT NOT NULL UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
  logo_url    TEXT,
  plan        TEXT DEFAULT 'free',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Add company_id to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- RLS Policies
CREATE POLICY "Allow select on companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert on companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "HR can update own company"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())
  );
