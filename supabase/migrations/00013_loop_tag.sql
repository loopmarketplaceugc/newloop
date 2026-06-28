-- Add loop_tag to profiles and mint_loop_tag RPC.
-- Previously only defined in full_migration.sql; this makes the numbered
-- migration set self-contained so a fresh DB built from 00001..N works too.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loop_tag text UNIQUE;

CREATE OR REPLACE FUNCTION public.mint_loop_tag()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing text;
  v_tag      text;
  v_chars    text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i          int;
BEGIN
  -- Return existing tag if already minted.
  SELECT loop_tag INTO v_existing FROM profiles WHERE id = auth.uid();
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Generate a unique LOOP-XXXX-XXXX tag.
  LOOP
    v_tag := 'LOOP-';
    FOR i IN 1..4 LOOP
      v_tag := v_tag || substr(v_chars, floor(random() * length(v_chars))::int + 1, 1);
    END LOOP;
    v_tag := v_tag || '-';
    FOR i IN 1..4 LOOP
      v_tag := v_tag || substr(v_chars, floor(random() * length(v_chars))::int + 1, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE loop_tag = v_tag);
  END LOOP;

  UPDATE profiles SET loop_tag = v_tag WHERE id = auth.uid();
  RETURN v_tag;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mint_loop_tag() TO authenticated;
