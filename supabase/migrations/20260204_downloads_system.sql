-- Migration: Sistema de Downloads e Materiais
-- 2026-02-04

CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size TEXT,
  type TEXT DEFAULT 'exam', -- 'exam', 'guide', 'summary', 'other'
  discipline_id TEXT REFERENCES disciplines(id) ON DELETE SET NULL,
  discipline_name TEXT,
  university_id TEXT REFERENCES universities(id) ON DELETE SET NULL,
  university_name TEXT,
  year INTEGER,
  is_premium BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_downloads_discipline ON downloads(discipline_id);
CREATE INDEX IF NOT EXISTS idx_downloads_university ON downloads(university_id);
CREATE INDEX IF NOT EXISTS idx_downloads_type ON downloads(type);

-- RLS (Row Level Security)
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Public select downloads" ON downloads 
FOR SELECT USING (true);

CREATE POLICY "Admin manage downloads" ON downloads 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Trigger para updated_at (opcional mas bom ter)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_downloads_updated_at
BEFORE UPDATE ON downloads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Função para incrementar contador de downloads
CREATE OR REPLACE FUNCTION increment_download_count(material_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE downloads
    SET download_count = COALESCE(download_count, 0) + 1
    WHERE id = material_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
