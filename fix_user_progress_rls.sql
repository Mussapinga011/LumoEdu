-- Corrigir permissões da tabela user_progress
-- Permitir que usuários autenticados vejam, criem e atualizem SEU PRÓPRIO progresso.

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas para evitar conflito
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can upsert own progress" ON public.user_progress;

-- Policy unificada para SELECT, INSERT, UPDATE
CREATE POLICY "Users manage own progress" ON public.user_progress
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Garantir acesso ao Postgres/Service Role
GRANT ALL ON public.user_progress TO postgres, service_role;
GRANT ALL ON public.user_progress TO authenticated;
