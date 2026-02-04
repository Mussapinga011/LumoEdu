-- ============================================
-- MIGRATION: Sistema de Comunidade e Grupos
-- Descrição: Criação das tabelas para grupos de estudo,
--            membros e mensagens.
-- Data: 2026-02-04
-- ============================================

-- 1. Tabela de Grupos de Estudo
CREATE TABLE IF NOT EXISTS study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discipline_id TEXT REFERENCES disciplines(id) ON DELETE SET NULL,
  discipline_name TEXT,
  created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  max_members INTEGER DEFAULT 50,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Membros dos Grupos
CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'member', 'admin'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- 3. Tabela de Mensagens dos Grupos
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  user_photo TEXT,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'text', -- 'text', 'image', 'system'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_study_groups_discipline ON study_groups(discipline_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created ON group_messages(created_at);

-- RLS (Row Level Security)
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (Estudo de grupos públicos)
CREATE POLICY "Grupos públicos são visíveis por todos" 
  ON study_groups FOR SELECT 
  USING (is_private = false);

CREATE POLICY "Qualquer usuário autenticado pode criar grupos" 
  ON study_groups FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Dono ou Admin pode atualizar o grupo" 
  ON study_groups FOR UPDATE 
  USING (auth.uid() = created_by OR (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Políticas para Membros
CREATE POLICY "Membros são visíveis por integrantes" 
  ON group_members FOR SELECT 
  USING (true);

CREATE POLICY "Usuário pode entrar em grupos" 
  ON group_members FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Membro pode sair do grupo" 
  ON group_members FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas para Mensagens
CREATE POLICY "Mensagens são visíveis por todos em grupos públicos" 
  ON group_messages FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM study_groups WHERE id = group_id AND is_private = false
  ) OR EXISTS (
    SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid()
  ));

CREATE POLICY "Membros podem enviar mensagens" 
  ON group_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
