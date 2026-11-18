DROP POLICY IF EXISTS user_roles_insert_own ON public.user_roles;
CREATE POLICY user_roles_insert_own ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role IN ('produtor'::public.app_role, 'agronomo'::public.app_role));

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id AND perfil IN ('produtor'::public.app_role, 'agronomo'::public.app_role));

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND perfil IN ('produtor'::public.app_role, 'agronomo'::public.app_role));

CREATE TABLE public.assinaturas (
  produtor_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  plano text NOT NULL DEFAULT 'basico' CHECK (plano IN ('basico', 'premium')),
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'expirado', 'atrasado')),
  expira_em date NOT NULL DEFAULT (CURRENT_DATE + 365),
  forma_recebimento text NOT NULL DEFAULT 'gateway' CHECK (forma_recebimento IN ('dinheiro', 'pix', 'gateway')),
  observacoes_internas text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assinaturas TO authenticated;
GRANT ALL ON public.assinaturas TO service_role;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY assinaturas_owner_select ON public.assinaturas
FOR SELECT TO authenticated
USING (auth.uid() = produtor_id);
CREATE POLICY assinaturas_gestor_all ON public.assinaturas
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'gestor'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'gestor'::public.app_role));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER assinaturas_set_updated_at
BEFORE UPDATE ON public.assinaturas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.criar_assinatura_produtor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.perfil = 'produtor'::public.app_role THEN
    INSERT INTO public.assinaturas (produtor_id)
    VALUES (NEW.id)
    ON CONFLICT (produtor_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.criar_assinatura_produtor() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.criar_assinatura_produtor() TO service_role;

CREATE TRIGGER profiles_criar_assinatura_produtor
AFTER INSERT OR UPDATE OF perfil ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.criar_assinatura_produtor();

INSERT INTO public.assinaturas (produtor_id)
SELECT p.id
FROM public.profiles p
WHERE p.perfil = 'produtor'::public.app_role
ON CONFLICT (produtor_id) DO NOTHING;

CREATE POLICY profiles_select_gestor ON public.profiles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'gestor'::public.app_role));