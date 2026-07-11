-- HandymanOS AI — minimal auth login fix (paste into Supabase SQL Editor → Run)
-- Use when login succeeds in Supabase Auth but the app shows "Ошибка авторизации".

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

-- Repair existing users missing company_id (run once after deploying the functions above)
DO $$
DECLARE
  r RECORD;
  v_company_id UUID;
  v_full_name TEXT;
BEGIN
  FOR r IN
    SELECT p.id, p.email, p.full_name
    FROM profiles p
    WHERE p.company_id IS NULL
  LOOP
    v_full_name := COALESCE(NULLIF(r.full_name, ''), split_part(r.email, '@', 1));
    v_company_id := uuid_generate_v4();
    INSERT INTO companies (id, name, email, subscription_plan, settings)
    VALUES (v_company_id, v_full_name || '''s Handyman Co.', r.email, 'starter', '{}'::jsonb);
    UPDATE profiles SET company_id = v_company_id, role = 'owner' WHERE id = r.id;
    INSERT INTO company_members (company_id, profile_id, role)
    VALUES (v_company_id, r.id, 'owner')
    ON CONFLICT (company_id, profile_id) DO NOTHING;
  END LOOP;
END $$;
