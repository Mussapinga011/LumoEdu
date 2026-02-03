const { createClient } = require('@supabase/supabase-js');

// Configuração manual - Substitua se necessário, mas estou usando os dados do .env.local que li anteriormente


const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const UEM_ID = 'cewMKU1N72RgmDaKKgiO';

const SYLLABUS_DATA = {
  'Matemática': [
    { name: 'Conjuntos Numéricos', subtopics: ['Naturais', 'Inteiros', 'Racionais', 'Reais'], importance: 4 },
    { name: 'Funções', subtopics: ['Domínio', 'Imagem', 'Função Afim', 'Função Quadrática'], importance: 2 },
    { name: 'Logaritmos', subtopics: ['Propriedades', 'Equações Logarítmicas'], importance: 2 },
    { name: 'Trigonometria', subtopics: ['Ciclo Trigonométrico', 'Seno e Cosseno', 'Identidades'], importance: 1 },
    { name: 'Matrizes e Determinantes', subtopics: ['Operações', 'Cálculo de Determinantes'], importance: 3 },
    { name: 'Geometria Plana', subtopics: ['Áreas', 'Perímetros', 'Triângulos', 'Polígonos'], importance: 2 },
    { name: 'Geometria Espacial', subtopics: ['Volumes', 'Prismas', 'Pirâmides', 'Esferas'], importance: 3 },
    { name: 'Análise Combinatória', subtopics: ['Arranjos', 'Combinações', 'Permutações'], importance: 2 },
    { name: 'Probabilidade', subtopics: ['Definição', 'Eventos Independentes'], importance: 2 },
    { name: 'Limites e Derivadas', subtopics: ['Noção de Limite', 'Derivadas Polinomiais'], importance: 1 }
  ],
  'Física': [
    { name: 'Cinemática', subtopics: ['MRU', 'MRUV', 'Queda Livre', 'Lançamento Oblíquo'], importance: 1 },
    { name: 'Dinâmica', subtopics: ['Leis de Newton', 'Força de Atrito', 'Plano Inclinado'], importance: 1 },
    { name: 'Trabalho e Energia', subtopics: ['Energia Cinética', 'Energia Potencial', 'Conservação'], importance: 2 },
    { name: 'Termodinâmica', subtopics: ['Escalas Termométricas', 'Calorimetria', 'Gases Ideais'], importance: 2 },
    { name: 'Óptica', subtopics: ['Reflexão', 'Refração', 'Lentes', 'Espelhos'], importance: 3 },
    { name: 'Eletrostática', subtopics: ['Carga Elétrica', 'Lei de Coulomb', 'Campo Elétrico'], importance: 2 },
    { name: 'Eletrodinâmica', subtopics: ['Corrente', 'Resistência', 'Leis de Ohm', 'Potência'], importance: 1 }
  ],
  'Química': [
    { name: 'Estrutura Atômica', subtopics: ['Modelos Atômicos', 'Distribuição Eletrônica'], importance: 3 },
    { name: 'Tabela Periódica', subtopics: ['Propriedades Periódicas', 'Famílias'], importance: 2 },
    { name: 'Ligações Químicas', subtopics: ['Iônica', 'Covalente', 'Metálica'], importance: 1 },
    { name: 'Estequiometria', subtopics: ['Mols', 'Cálculos Estequiométricos'], importance: 1 },
    { name: 'Soluções', subtopics: ['Concentração', 'Diluição', 'Misturas'], importance: 2 },
    { name: 'Termoquímica', subtopics: ['Entalpia', 'Reações Exotérmicas e Endotérmicas'], importance: 3 },
    { name: 'Química Orgânica', subtopics: ['Cadeias Carbônicas', 'Funções Orgânicas', 'Isomeria'], importance: 1 }
  ],
  'Português': [
    { name: 'Interpretação de Texto', subtopics: ['Tipologia Textual', 'Gêneros'], importance: 1 },
    { name: 'Morfologia', subtopics: ['Classes de Palavras', 'Estrutura das Palavras'], importance: 2 },
    { name: 'Sintaxe', subtopics: ['Análise Sintática', 'Concordância', 'Regência'], importance: 1 },
    { name: 'Ortografia', subtopics: ['Acentuação', 'Hífen'], importance: 3 },
    { name: 'Literatura', subtopics: ['Escolas Literárias', 'Obras Obrigatórias'], importance: 2 }
  ],
  'Biologia': [
    { name: 'Citologia', subtopics: ['Célula', 'Organelas', 'Membrana'], importance: 1 },
    { name: 'Genética', subtopics: ['Leis de Mendel', 'DNA/RNA', 'Biotecnologia'], importance: 1 },
    { name: 'Ecologia', subtopics: ['Cadeias Alimentares', 'Relações Ecológicas', 'Ciclos'], importance: 2 },
    { name: 'Fisiologia Humana', subtopics: ['Sistemas', 'Digestão', 'Respiração'], importance: 2 },
    { name: 'Evolução', subtopics: ['Teorias Evolutivas', 'Darwinismo'], importance: 3 }
  ]
};

async function seed() {
  console.log('🌱 Iniciando Seed do Academic Tracking...');

  try {
    // 1. Buscar Disciplinas
    console.log('📚 Buscando disciplinas...');
    const { data: disciplines, error: discError } = await supabase
      .from('disciplines')
      .select('id, title');
    
    if (discError) throw discError;
    
    const discMap = {};
    disciplines.forEach(d => {
      // Normalizar para encontrar no mapa (ex: 'matematica' -> 'Matemática')
      const key = Object.keys(SYLLABUS_DATA).find(k => 
        k.toLowerCase() === d.title.toLowerCase() || 
        d.title.toLowerCase().includes(k.toLowerCase().slice(0, 4))
      );
      if (key) discMap[key] = d.id;
    });

    console.log('✅ Disciplinas mapeadas:', discMap);

    // 2. Criar Course Requirements
    console.log('🎓 Criando Requisitos de Curso...');

    const courses = [
      {
        name: 'Medicina',
        disciplines: [
          { disciplineId: discMap['Biologia'], disciplineName: 'Biologia', weight: 0.4, isRequired: true },
          { disciplineId: discMap['Química'], disciplineName: 'Química', weight: 0.3, isRequired: true },
          { disciplineId: discMap['Física'], disciplineName: 'Física', weight: 0.15, isRequired: true },
          { disciplineId: discMap['Português'], disciplineName: 'Português', weight: 0.15, isRequired: true }
        ].filter(d => d.disciplineId)
      },
      {
        name: 'Engenharia Informática',
        disciplines: [
          { disciplineId: discMap['Matemática'], disciplineName: 'Matemática', weight: 0.5, isRequired: true },
          { disciplineId: discMap['Física'], disciplineName: 'Física', weight: 0.3, isRequired: true },
          { disciplineId: discMap['Português'], disciplineName: 'Português', weight: 0.2, isRequired: true }
        ].filter(d => d.disciplineId)
      }
    ];

    for (const course of courses) {
      if (course.disciplines.length === 0) continue;

      await supabase.from('course_requirements').insert({
        university_id: UEM_ID,
        course_name: course.name,
        disciplines: course.disciplines,
        minimum_score: 60,
        estimated_study_hours: 300
      });
    }

    // 3. Criar Tópicos do Syllabus e Vincular Questões
    console.log('📝 Criando Tópicos e Vinculando Questões...');

    for (const [discName, topics] of Object.entries(SYLLABUS_DATA)) {
      const discId = discMap[discName];
      if (!discId) {
        console.warn(`⚠️ Disciplina ${discName} não encontrada no banco.`);
        continue;
      }

      for (const topic of topics) {
        // Criar Tópico
        const { data: topicData, error: topicError } = await supabase
          .from('syllabus_topics')
          .insert({
            discipline_id: discId,
            university_id: UEM_ID,
            topic_name: topic.name,
            subtopics: topic.subtopics,
            importance: topic.importance,
            estimated_hours: 4
          })
          .select()
          .single();

        if (topicError) {
          console.error(`❌ Erro ao criar tópico ${topic.name}:`, topicError.message);
          continue;
        }

        const topicId = topicData.id;

        // Buscar questões relacionadas (Busca simples por texto)
        // Tentamos buscar pelo nome do tópico ou subtópicos
        const terms = [topic.name, ...topic.subtopics].map(t => t.split(' ')[0]); // Pegar primeira palavra
        
        let relatedQuestions = [];
        
        // Fazer buscas separadas e juntar (Supabase 'or' filters podem ser complexos)
          const { data: questions } = await supabase
            .from('learning_questions')
            .select('id, statement')
            // .eq('discipline_id', discId) 
            .or(terms.map(t => `statement.ilike.%${t}%`).join(','))
            .limit(20);

        if (questions && questions.length > 0) {
          // Criar relacionamentos
          const relations = questions.map(q => ({
            question_id: q.id,
            topic_id: topicId
          }));

          const { error: relError } = await supabase
            .from('question_topics')
            .upsert(relations, { onConflict: 'question_id,topic_id' });

          if (!relError) {
            console.log(`🔗 ${questions.length} questões vinculadas a "${topic.name}"`);
          }
        }
      }
    }

    console.log('✅ Seed concluído com sucesso!');

  } catch (err) {
    console.error('🔥 Erro fatal:', err);
  }
}

seed();
