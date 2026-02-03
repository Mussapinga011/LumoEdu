
-- Permitir leitura pública de Universidades
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universities are viewable by everyone" 
ON universities FOR SELECT 
USING (true);

-- Permitir leitura pública de Disciplinas (se ainda não tiver)
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Disciplines are viewable by everyone" 
ON disciplines FOR SELECT 
USING (true);

-- Permitir leitura pública de Cursos (Course Requirements) para preencher os selects
ALTER TABLE course_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course requirements are viewable by everyone" 
ON course_requirements FOR SELECT 
USING (true);
