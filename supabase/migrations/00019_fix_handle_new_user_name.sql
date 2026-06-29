-- Fix: handle_new_user() omitted the NOT NULL `name` column, so every
-- auth.users INSERT failed and signup returned a 500 ("Database error saving
-- new user"). Provide a non-null placeholder name; onboarding overwrites it.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role  text;
  v_email text;
  v_name  text;
BEGIN
  v_role  := COALESCE(NEW.raw_user_meta_data->>'role', 'creator');
  v_email := NEW.email;
  v_name  := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'New user'
  );

  INSERT INTO public.profiles (id, role, handle, name, email)
  VALUES (
    NEW.id,
    v_role::user_role,
    -- Temp handle: 'u' + first hex chars of UUID (no hyphens), always unique
    'u' || replace(substring(NEW.id::text, 1, 9), '-', ''),
    v_name,
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
