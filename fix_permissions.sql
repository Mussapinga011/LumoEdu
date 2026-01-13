-- Arquivo para corrigir permissões (RLS) no Supabase (VERSÃO CORRIGIDA)
-- Copie e cole este conteúdo no Editor SQL do seu Dashboard Supabase

-- 1. Habilitar inserção/atualização na tabela de Unidades (learning_sections)
DROP POLICY IF EXISTS "Enable all access for admins" ON "public"."learning_sections";
CREATE POLICY "Enable all access for admins" ON "public"."learning_sections"
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE role = 'admin' OR role = 'superadmin'
  )
);

-- 2. Habilitar inserção/atualização na tabela de Aulas (learning_steps)
DROP POLICY IF EXISTS "Enable all access for admins" ON "public"."learning_steps";
CREATE POLICY "Enable all access for admins" ON "public"."learning_steps"
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE role = 'admin' OR role = 'superadmin'
  )
);

-- 3. Habilitar inserção/atualização na tabela de Questões (learning_questions)
DROP POLICY IF EXISTS "Enable all access for admins" ON "public"."learning_questions";
CREATE POLICY "Enable all access for admins" ON "public"."learning_questions"
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE role = 'admin' OR role = 'superadmin'
  )
);
