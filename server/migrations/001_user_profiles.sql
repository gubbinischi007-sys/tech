-- ============================================================
-- SmartCruiter: user_profiles table for Supabase Auth
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/eluarxdyxvxwknylejaj/sql
-- ============================================================

-- 1. Create the user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'applicant' CHECK (role IN ('hr', 'applicant')),
  role_title  TEXT,
  company_id  UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- 4. Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- 5. Policy: Allow insert during sign-up (service role handles this)
CREATE POLICY "Allow insert for authenticated"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 6. Auto-create profile when a new user signs up (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role, role_title)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'applicant'),
    COALESCE(NEW.raw_user_meta_data->>'role_title', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger fires after each new auth.users row
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
