-- Create the profile after signup even when email confirmation is required.
-- Never accept the privileged gestor role from user-controlled metadata.
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  selected_role public.app_role;
BEGIN
  selected_role := CASE WHEN NEW.raw_user_meta_data->>'perfil' = 'agronomo'
    THEN 'agronomo'::public.app_role ELSE 'produtor'::public.app_role END;
  INSERT INTO public.profiles (id, nome, perfil)
  VALUES (NEW.id, COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'nome'), ''), split_part(NEW.email, '@', 1)), selected_role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, selected_role);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();
