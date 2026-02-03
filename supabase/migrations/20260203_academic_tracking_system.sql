-- ============================================
-- MIGRATION: Sistema de Acompanhamento Inteligente
-- Descrição: Adiciona tabelas para tracking de progresso,
--            requisitos de curso, e análise de performance
-- Data: 2026-02-03
-- ============================================

-- ============================================
-- 1. REQUISITOS DE CURSO
-- ============================================

CREATE TABLE IF NOT EXISTS course_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id TEXT REFERENCES universities(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  disciplines JSONB NOT NULL DEFAULT '[]', -- Array de {disciplineId, disciplineName, weight, isRequired}
  minimum_score INTEGER DEFAULT 50,
  estimated_study_hours INTEGER DEFAULT 200,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_course_requirements_university ON course_requirements(university_id);
CREATE INDEX idx_course_requirements_course ON course_requirements(course_name);

COMMENT ON TABLE course_requirements IS 'Requisitos e pesos de disciplinas para cada curso universitário';

-- ============================================
-- 2. CONTEÚDO PROGRAMÁTICO (SYLLABUS)
-- ============================================

CREATE TABLE IF NOT EXISTS syllabus_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id TEXT REFERENCES disciplines(id) ON DELETE CASCADE,
  university_id TEXT REFERENCES universities(id) ON DELETE SET NULL,
  course_name TEXT,
  
  topic_name TEXT NOT NULL,
  subtopics JSONB DEFAULT '[]', -- Array de strings
  description TEXT,
  
  importance INTEGER CHECK (importance BETWEEN 1 AND 5) DEFAULT 3,
  estimated_hours INTEGER DEFAULT 2,
  order_index INTEGER DEFAULT 0,
  
  prerequisites JSONB DEFAULT '[]', -- Array de topic IDs
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_syllabus_topics_discipline ON syllabus_topics(discipline_id);
CREATE INDEX idx_syllabus_topics_university ON syllabus_topics(university_id);
CREATE INDEX idx_syllabus_topics_importance ON syllabus_topics(importance);

COMMENT ON TABLE syllabus_topics IS 'Tópicos do conteúdo programático por disciplina';

-- ============================================
-- 3. RELACIONAMENTO QUESTÕES ↔ TÓPICOS
-- ============================================

CREATE TABLE IF NOT EXISTS question_topics (
  question_id TEXT REFERENCES learning_questions(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES syllabus_topics(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, topic_id)
);

CREATE INDEX idx_question_topics_question ON question_topics(question_id);
CREATE INDEX idx_question_topics_topic ON question_topics(topic_id);

COMMENT ON TABLE question_topics IS 'Relacionamento many-to-many entre questões e tópicos do syllabus';

-- ============================================
-- 4. PROGRESSO DO ESTUDANTE POR TÓPICO
-- ============================================

CREATE TABLE IF NOT EXISTS topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES syllabus_topics(id) ON DELETE CASCADE,
  
  status TEXT CHECK (status IN ('not-started', 'in-progress', 'completed', 'mastered')) DEFAULT 'not-started',
  score INTEGER DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- minutos
  
  last_studied TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, topic_id)
);

CREATE INDEX idx_topic_progress_user ON topic_progress(user_id);
CREATE INDEX idx_topic_progress_topic ON topic_progress(topic_id);
CREATE INDEX idx_topic_progress_status ON topic_progress(status);
CREATE INDEX idx_topic_progress_score ON topic_progress(score);

COMMENT ON TABLE topic_progress IS 'Progresso individual do estudante em cada tópico';

-- ============================================
-- 5. HISTÓRICO DE PERFORMANCE
-- ============================================

CREATE TABLE IF NOT EXISTS performance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  discipline_id TEXT REFERENCES disciplines(id) ON DELETE SET NULL,
  
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- minutos
  
  topics_studied JSONB DEFAULT '[]', -- Array de topic IDs
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_performance_history_user ON performance_history(user_id);
CREATE INDEX idx_performance_history_discipline ON performance_history(discipline_id);
CREATE INDEX idx_performance_history_date ON performance_history(session_date);

COMMENT ON TABLE performance_history IS 'Histórico diário de performance do estudante';

-- ============================================
-- 6. PERFIL ACADÊMICO DO ESTUDANTE
-- ============================================

CREATE TABLE IF NOT EXISTS student_academic_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Meta de Admissão
  target_university TEXT,
  target_course TEXT,
  target_year INTEGER,
  admission_exam_date DATE,
  
  -- Nível Atual (JSONB: {disciplineId: {knowledgeLevel, lastAssessment, score, ...}})
  current_level JSONB DEFAULT '{}',
  
  -- Progresso de Conteúdo
  completed_sections JSONB DEFAULT '[]',
  completed_sessions JSONB DEFAULT '[]',
  mastered_topics JSONB DEFAULT '[]',
  weak_topics JSONB DEFAULT '[]',
  
  -- Estatísticas Gerais
  total_study_time INTEGER DEFAULT 0, -- minutos
  total_questions_answered INTEGER DEFAULT 0,
  overall_accuracy DECIMAL(5,2) DEFAULT 0.0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_student_profiles_user ON student_academic_profiles(user_id);
CREATE INDEX idx_student_profiles_university ON student_academic_profiles(target_university);
CREATE INDEX idx_student_profiles_course ON student_academic_profiles(target_course);

COMMENT ON TABLE student_academic_profiles IS 'Perfil acadêmico completo do estudante com metas e progresso';

-- ============================================
-- 7. RECOMENDAÇÕES DO SISTEMA
-- ============================================

CREATE TABLE IF NOT EXISTS content_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  type TEXT CHECK (type IN ('theory', 'practice', 'exam', 'review')) NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'session', 'question', 'exam', etc.
  content_title TEXT NOT NULL,
  discipline_id TEXT REFERENCES disciplines(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES syllabus_topics(id) ON DELETE SET NULL,
  
  estimated_time INTEGER, -- minutos
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  
  reason TEXT NOT NULL,
  expected_impact INTEGER CHECK (expected_impact BETWEEN 0 AND 100),
  
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_recommendations_user ON content_recommendations(user_id);
CREATE INDEX idx_recommendations_priority ON content_recommendations(priority);
CREATE INDEX idx_recommendations_completed ON content_recommendations(is_completed);

COMMENT ON TABLE content_recommendations IS 'Recomendações personalizadas de conteúdo para cada estudante';

-- ============================================
-- 8. ANÁLISE DE PERFORMANCE (CACHE)
-- ============================================

CREATE TABLE IF NOT EXISTS performance_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  
  overall_score DECIMAL(5,2),
  discipline_scores JSONB DEFAULT '{}',
  
  trend TEXT CHECK (trend IN ('improving', 'stable', 'declining')),
  improvement_rate DECIMAL(5,2),
  
  readiness_score INTEGER CHECK (readiness_score BETWEEN 0 AND 100),
  estimated_admission_chance INTEGER CHECK (estimated_admission_chance BETWEEN 0 AND 100),
  days_until_ready INTEGER,
  
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  common_mistakes JSONB DEFAULT '[]',
  
  insights JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

CREATE INDEX idx_performance_cache_user ON performance_analysis_cache(user_id);
CREATE INDEX idx_performance_cache_expires ON performance_analysis_cache(expires_at);

COMMENT ON TABLE performance_analysis_cache IS 'Cache de análises de performance para otimização';

-- ============================================
-- 9. CONQUISTAS (ACHIEVEMENTS)
-- ============================================

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  is_completed BOOLEAN DEFAULT FALSE,
  
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, type, title)
);

CREATE INDEX idx_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_achievements_completed ON user_achievements(is_completed);

COMMENT ON TABLE user_achievements IS 'Conquistas e badges desbloqueados pelo estudante';

-- ============================================
-- 10. METAS DIÁRIAS
-- ============================================

CREATE TABLE IF NOT EXISTS daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  goal_date DATE NOT NULL,
  
  questions_to_solve INTEGER DEFAULT 10,
  minutes_to_study INTEGER DEFAULT 30,
  topics_to_review JSONB DEFAULT '[]',
  
  questions_solved INTEGER DEFAULT 0,
  minutes_studied INTEGER DEFAULT 0,
  topics_reviewed JSONB DEFAULT '[]',
  
  is_completed BOOLEAN DEFAULT FALSE,
  completion_rate INTEGER DEFAULT 0 CHECK (completion_rate BETWEEN 0 AND 100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, goal_date)
);

CREATE INDEX idx_daily_goals_user ON daily_goals(user_id);
CREATE INDEX idx_daily_goals_date ON daily_goals(goal_date);
CREATE INDEX idx_daily_goals_completed ON daily_goals(is_completed);

COMMENT ON TABLE daily_goals IS 'Metas diárias adaptativas para cada estudante';

-- ============================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_requirements_updated_at
    BEFORE UPDATE ON course_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_syllabus_topics_updated_at
    BEFORE UPDATE ON syllabus_topics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topic_progress_updated_at
    BEFORE UPDATE ON topic_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_goals_updated_at
    BEFORE UPDATE ON daily_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View: Progresso geral do estudante
CREATE OR REPLACE VIEW student_overall_progress AS
SELECT 
    sap.user_id,
    sap.target_university,
    sap.target_course,
    sap.overall_accuracy,
    sap.current_streak,
    COUNT(DISTINCT tp.topic_id) FILTER (WHERE tp.status = 'mastered') as mastered_topics_count,
    COUNT(DISTINCT tp.topic_id) FILTER (WHERE tp.status = 'in-progress') as in_progress_topics_count,
    AVG(tp.score) as avg_topic_score,
    SUM(tp.time_spent) as total_time_spent
FROM student_academic_profiles sap
LEFT JOIN topic_progress tp ON sap.user_id = tp.user_id
GROUP BY sap.user_id, sap.target_university, sap.target_course, sap.overall_accuracy, sap.current_streak;

COMMENT ON VIEW student_overall_progress IS 'Visão geral do progresso de cada estudante';

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE student_academic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;

-- Políticas: Usuários só veem seus próprios dados
CREATE POLICY "Users can view own academic profile"
    ON student_academic_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own academic profile"
    ON student_academic_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own topic progress"
    ON topic_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own topic progress"
    ON topic_progress FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own performance history"
    ON performance_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recommendations"
    ON content_recommendations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own daily goals"
    ON daily_goals FOR ALL
    USING (auth.uid() = user_id);

-- Admins podem ver tudo
CREATE POLICY "Admins can view all data"
    ON student_academic_profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- DADOS INICIAIS (SEED)
-- ============================================

-- Exemplo de requisitos de curso
INSERT INTO course_requirements (university_id, course_name, disciplines, minimum_score, estimated_study_hours)
SELECT 
    u.id,
    'Engenharia Civil',
    '[
        {"disciplineId": "math", "disciplineName": "Matemática", "weight": 0.4, "isRequired": true},
        {"disciplineId": "physics", "disciplineName": "Física", "weight": 0.3, "isRequired": true},
        {"disciplineId": "chemistry", "disciplineName": "Química", "weight": 0.2, "isRequired": true},
        {"disciplineId": "portuguese", "disciplineName": "Português", "weight": 0.1, "isRequired": true}
    ]'::jsonb,
    60,
    300
FROM universities u
WHERE u.short_name = 'UEM'
ON CONFLICT DO NOTHING;

-- ============================================
-- FIM DA MIGRATION
-- ============================================
