-- Adicionar order_index na tabela learning_questions se não existir
ALTER TABLE public.learning_questions 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Atualizar permissões
GRANT ALL ON public.learning_questions TO postgres, authenticated, service_role;
