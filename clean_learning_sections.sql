-- Limpar colunas de teoria da tabela de Unidades (learning_sections)
-- ATENÇÃO: Execute isso apenas se tiver certeza que migrou (ou não precisa) dos dados de teoria antigos que estavam nesta tabela.
-- Como criamos a tabela 'learning_contents' para teoria, essas colunas não são mais necessárias aqui.

ALTER TABLE public.learning_sections
DROP COLUMN IF EXISTS content,
DROP COLUMN IF EXISTS session_id;
