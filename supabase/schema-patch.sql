-- HandymanOS AI — quick patch for existing Supabase databases
-- Run this FIRST if schema.sql fails with: column "company_id" does not exist
-- Then re-run the full schema.sql (SCHEMA_VERSION: 2026-07-11d) from GitHub main.

-- 1) Add missing profile/company columns (safe to re-run)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_plan subscription_plan DEFAULT 'starter';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2) Ensure company_members exists and has required columns
CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'technician',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, profile_id)
);

ALTER TABLE company_members ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'technician';
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3) Backfill memberships (self-healing dynamic SQL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'company_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'company_members' AND column_name = 'company_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'company_members' AND column_name = 'profile_id'
  ) THEN
    EXECUTE $sql$
      INSERT INTO company_members (company_id, profile_id, role)
      SELECT company_id, id, role
      FROM profiles
      WHERE company_id IS NOT NULL
      ON CONFLICT (company_id, profile_id) DO NOTHING
    $sql$;
  END IF;
END $$;

-- 4) Auth login fix: company_members insert policy + owner provisioning
DROP POLICY IF EXISTS "Users can insert own membership" ON company_members;
CREATE POLICY "Users can insert own membership" ON company_members
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_full_name TEXT;
  v_signup_type TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1));
  v_signup_type := COALESCE(NEW.raw_user_meta_data->>'signup_type', 'owner');

  IF v_signup_type <> 'invite' THEN
    v_company_id := uuid_generate_v4();
    INSERT INTO public.companies (id, name, email, subscription_plan, settings)
    VALUES (
      v_company_id,
      v_full_name || '''s Handyman Co.',
      COALESCE(NEW.email, ''),
      'starter',
      '{}'::jsonb
    );
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_full_name,
    CASE WHEN v_signup_type = 'invite' THEN 'technician'::user_role ELSE 'owner'::user_role END,
    v_company_id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(profiles.full_name, ''), EXCLUDED.full_name),
    company_id = COALESCE(profiles.company_id, EXCLUDED.company_id),
    role = CASE
      WHEN profiles.company_id IS NULL AND EXCLUDED.company_id IS NOT NULL THEN EXCLUDED.role
      ELSE profiles.role
    END;

  IF v_company_id IS NOT NULL THEN
    INSERT INTO public.company_members (company_id, profile_id, role)
    VALUES (v_company_id, NEW.id, 'owner')
    ON CONFLICT (company_id, profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.provision_owner_company()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_profile profiles%ROWTYPE;
  v_company_id UUID;
  v_full_name TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_profile.company_id IS NOT NULL THEN
    RETURN v_profile.company_id;
  END IF;

  v_full_name := NULLIF(v_profile.full_name, '');
  IF v_full_name IS NULL THEN
    SELECT COALESCE(raw_user_meta_data->>'full_name', split_part(COALESCE(email, ''), '@', 1))
    INTO v_full_name
    FROM auth.users
    WHERE id = v_uid;
  END IF;

  v_company_id := uuid_generate_v4();
  INSERT INTO companies (id, name, email, subscription_plan, settings)
  VALUES (
    v_company_id,
    v_full_name || '''s Handyman Co.',
    v_profile.email,
    'starter',
    '{}'::jsonb
  );

  UPDATE profiles
  SET company_id = v_company_id,
      role = 'owner'
  WHERE id = v_uid;

  INSERT INTO company_members (company_id, profile_id, role)
  VALUES (v_company_id, v_uid, 'owner')
  ON CONFLICT (company_id, profile_id) DO UPDATE SET role = 'owner';

  RETURN v_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION provision_owner_company() TO authenticated;

-- Vendor PO problem description (v1.14.8+)
ALTER TABLE vendor_po_records ADD COLUMN IF NOT EXISTS problem_description TEXT;
ALTER TABLE vendor_po_records ADD COLUMN IF NOT EXISTS problem_description_ru TEXT;
