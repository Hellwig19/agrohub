CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

ALTER POLICY maquinas_agronomo_select ON public.maquinas USING (private.has_role(auth.uid(), 'agronomo'::public.app_role));
ALTER POLICY manutencoes_agronomo_select ON public.manutencoes USING (private.has_role(auth.uid(), 'agronomo'::public.app_role));
ALTER POLICY servicos_agronomo_select ON public.servicos USING (private.has_role(auth.uid(), 'agronomo'::public.app_role));
ALTER POLICY telemetria_agronomo_select ON public.telemetria USING (private.has_role(auth.uid(), 'agronomo'::public.app_role));
ALTER POLICY talhoes_agronomo_select ON public.talhoes USING (private.has_role(auth.uid(), 'agronomo'::public.app_role));
ALTER POLICY operacoes_agronomo_select ON public.operacoes USING (private.has_role(auth.uid(), 'agronomo'::public.app_role));
ALTER POLICY safras_agronomo_select ON public.safras USING (private.has_role(auth.uid(), 'agronomo'::public.app_role));
ALTER POLICY vistorias_agronomo_select ON public.vistorias USING (private.has_role(auth.uid(), 'agronomo'::public.app_role));
ALTER POLICY vistorias_agronomo_insert ON public.vistorias WITH CHECK (private.has_role(auth.uid(), 'agronomo'::public.app_role) AND auth.uid() = autor_id);
ALTER POLICY profiles_select_agronomo ON public.profiles USING (private.has_role(auth.uid(), 'agronomo'::public.app_role));
ALTER POLICY profiles_select_gestor ON public.profiles USING (private.has_role(auth.uid(), 'gestor'::public.app_role));
ALTER POLICY assinaturas_gestor_all ON public.assinaturas USING (private.has_role(auth.uid(), 'gestor'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'gestor'::public.app_role));

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;