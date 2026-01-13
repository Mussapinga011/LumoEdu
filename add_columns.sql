-- Arquivo corrigido para adicionar colunas faltantes
-- Se a tabela learning_steps usa IDs do tipo TEXT, a chave estrangeira deve ser TEXT também.

-- Adicionar colunas content e session_id como TEXT
ALTER TABLE public.learning_sections 
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS session_id TEXT REFERENCES public.learning_steps(id) ON DELETE CASCADE;

-- Garantir que discipline_id possa ser vazio para itens de teoria
ALTER TABLE public.learning_sections 
ALTER COLUMN discipline_id DROP NOT NULL;

-- Atualizar permissões
GRANT ALL ON public.learning_sections TO postgres, authenticated, service_role;
