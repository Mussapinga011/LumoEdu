-- Criar tabela dedicada para Conteúdo Teórico (Aulas) - CORRIGIDO TIPO ID
CREATE TABLE IF NOT EXISTS public.learning_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  step_id TEXT NOT NULL REFERENCES public.learning_steps(id) ON DELETE CASCADE, -- Tipo TEXT para corresponder ao ID da tabela learning_steps
  title TEXT,
  content TEXT, -- O texto/HTML/Markdown da aula
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.learning_contents ENABLE ROW LEVEL SECURITY;

-- Permissões
CREATE POLICY "Public read access" ON public.learning_contents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access" ON public.learning_contents;
CREATE POLICY "Admin full access" ON public.learning_contents FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE role = 'admin' OR role = 'superadmin'
  )
);

GRANT ALL ON public.learning_contents TO postgres, authenticated, service_role;
