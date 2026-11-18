CREATE TABLE public.talhoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cultura text NOT NULL DEFAULT 'soja',
  area_ha numeric NOT NULL DEFAULT 0,
  dispositivo text NOT NULL DEFAULT '',
  estadio text NOT NULL DEFAULT '',
  coords jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.talhoes TO authenticated;
GRANT ALL ON public.talhoes TO service_role;
ALTER TABLE public.talhoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY talhoes_owner_all ON public.talhoes FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY talhoes_agronomo_select ON public.talhoes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agronomo'));

CREATE TABLE public.operacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talhao_id uuid NOT NULL REFERENCES public.talhoes(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  safra text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'adubacao',
  produto text NOT NULL DEFAULT '',
  dose text NOT NULL DEFAULT '',
  data date NOT NULL DEFAULT CURRENT_DATE,
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operacoes TO authenticated;
GRANT ALL ON public.operacoes TO service_role;
ALTER TABLE public.operacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY operacoes_owner_all ON public.operacoes FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY operacoes_agronomo_select ON public.operacoes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agronomo'));

CREATE TABLE public.safras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talhao_id uuid NOT NULL REFERENCES public.talhoes(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cultura text NOT NULL DEFAULT 'soja',
  area_ha numeric NOT NULL DEFAULT 0,
  produtividade numeric NOT NULL DEFAULT 0,
  plantio date,
  colheita date,
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safras TO authenticated;
GRANT ALL ON public.safras TO service_role;
ALTER TABLE public.safras ENABLE ROW LEVEL SECURITY;
CREATE POLICY safras_owner_all ON public.safras FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY safras_agronomo_select ON public.safras FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agronomo'));

CREATE TABLE public.vistorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talhao_id uuid NOT NULL REFERENCES public.talhoes(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estadio text NOT NULL DEFAULT '',
  alvo text NOT NULL DEFAULT '',
  severidade text NOT NULL DEFAULT 'baixa',
  recomendacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vistorias TO authenticated;
GRANT ALL ON public.vistorias TO service_role;
ALTER TABLE public.vistorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY vistorias_owner_all ON public.vistorias FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY vistorias_agronomo_select ON public.vistorias FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agronomo'));
CREATE POLICY vistorias_agronomo_insert ON public.vistorias FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'agronomo') AND auth.uid() = autor_id);

CREATE POLICY profiles_select_agronomo ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agronomo'));