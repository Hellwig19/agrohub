CREATE TYPE public.app_role AS ENUM ('agronomo','produtor');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  perfil public.app_role NOT NULL DEFAULT 'produtor',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_roles_insert_own" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.maquinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  modelo text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'trator',
  horimetro numeric NOT NULL DEFAULT 0,
  intervalo_manutencao_h integer NOT NULL DEFAULT 250,
  ultima_manutencao_h numeric NOT NULL DEFAULT 0,
  device_token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-',''),
  motor_ligado boolean NOT NULL DEFAULT false,
  ultima_leitura_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maquinas TO authenticated;
GRANT ALL ON public.maquinas TO service_role;
ALTER TABLE public.maquinas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maquinas_owner_all" ON public.maquinas FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "maquinas_agronomo_select" ON public.maquinas FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'agronomo'));

CREATE TABLE public.manutencoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maquina_id uuid NOT NULL REFERENCES public.maquinas(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  horas_previstas numeric,
  prevista_em date,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manutencoes TO authenticated;
GRANT ALL ON public.manutencoes TO service_role;
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manutencoes_owner_all" ON public.manutencoes FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "manutencoes_agronomo_select" ON public.manutencoes FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'agronomo'));

CREATE TABLE public.servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maquina_id uuid NOT NULL REFERENCES public.maquinas(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  custo numeric NOT NULL DEFAULT 0,
  horimetro numeric NOT NULL DEFAULT 0,
  realizado_em date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicos TO authenticated;
GRANT ALL ON public.servicos TO service_role;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "servicos_owner_all" ON public.servicos FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "servicos_agronomo_select" ON public.servicos FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'agronomo'));

CREATE TABLE public.telemetria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maquina_id uuid NOT NULL REFERENCES public.maquinas(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motor_ligado boolean NOT NULL DEFAULT true,
  horas_motor numeric NOT NULL DEFAULT 0,
  recebido_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.telemetria TO authenticated;
GRANT ALL ON public.telemetria TO service_role;
ALTER TABLE public.telemetria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telemetria_owner_select" ON public.telemetria FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "telemetria_agronomo_select" ON public.telemetria FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'agronomo'));
CREATE INDEX telemetria_maquina_idx ON public.telemetria (maquina_id, recebido_em DESC);