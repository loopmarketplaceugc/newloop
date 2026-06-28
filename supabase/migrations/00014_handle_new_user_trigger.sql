-- Guarantee a profile row exists immediately after auth.users INSERT.
-- Uses a temporary handle derived from the user's UUID so the NOT NULL + unique
-- constraint is satisfied; onboarding overwrites it with the real one via upsert.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role  text;
  v_email text;
BEGIN
  v_role  := COALESCE(NEW.raw_user_meta_data->>'role', 'creator');
  v_email := NEW.email;

  INSERT INTO public.profiles (id, role, handle, email)
  VALUES (
    NEW.id,
    v_role::user_role,
    -- Temp handle: 'u' + first 8 hex chars of UUID (no hyphens) → 9 chars, always unique
    'u' || replace(substring(NEW.id::text, 1, 9), '-', ''),
    v_email
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
