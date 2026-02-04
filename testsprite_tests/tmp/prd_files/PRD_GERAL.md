# Documento de Especificações do Produto (PRD) - LumoEdu (Admission Platform)

## 1. Visão Geral do Produto
O **LumoEdu** é uma plataforma de admissão e aprendizagem adaptativa focada em preparar estudantes para exames vestibulares e concursos. A plataforma utiliza um poderoso motor de **Inteligência Artificial (Professor IA)** para personalizar a jornada de estudo, prever desempenho e otimizar o tempo do aluno.

## 2. Objetivos Principais
- **Personalização Extrema:** Adaptar o conteúdo e o cronograma às necessidades individuais de cada aluno.
- **Previsibilidade:** Oferecer métricas claras sobre a chance de aprovação (Score de Admissão).
- **Engajamento:** Gamificação e feedback constante para manter a motivação.
- **Eficiência:** Maximizar o ROI (Retorno sobre Investimento) do tempo de estudo.

## 3. Arquitetura Técnica
- **Frontend:** React (Vite), TypeScript, TailwindCSS.
- **Backend/Database:** Supabase (PostgreSQL, Auth, RLS).
- **Gerenciamento de Estado:** Zustand.
- **IA/Lógica:** Algoritmos proprietários em `academicAI.service.ts`.

## 4. Funcionalidades Detalhadas

### 4.1. Autenticação e Perfis (Auth)
- Sistema completo de Login/Registro via Supabase Auth.
- Perfis de usuário estendidos (`user_profiles`) com dados acadêmicos.
- Suporte a roles (Estudante, Admin).

### 4.2. Professor IA (Core Feature)
O cérebro da plataforma, responsável por:
- **Motor Preditivo:** Regressão linear para prever notas futuras.
- **Detecção de Platô:** Alerta quando o aluno para de evoluir (< 3% variação).
- **Análise de Padrões:** Identifica melhores horários e dias de estudo.
- **Otimizador de Cronograma:** Algoritmo "Greedy" que monta a agenda ideal baseada em ROI.

### 4.3. Módulos de Estudo
- **Dashboard do Estudante:** Visão geral com métricas, streak e atalhos.
- **Agenda Otimizada:** Painel interativo com o plano de estudos do dia.
- **Banco de Questões:** Milhares de exercícios categorizados.
- **Simulados:** Provas completas com temporizador e correção automática.

### 4.4. Área Administrativa (Backoffice)
- Gestão de Usuários.
- Gestão de Exames e Questões.
- Gestão de Conteúdo (Syllabus).

## 5. Regras de Negócio Importantes
- **Privacidade Dados:** RLS (Row Level Security) rigoroso no Supabase; alunos só veem seus próprios dados.
- **Cálculo de Score:** Baseado em peso das disciplinas x desempenho recente (média móvel exponencial).
- **Freemium:** Algumas funcionalidades (ex: Recomendações Avançadas de IA) podem ser exclusivas de assinantes (flag `is_premium`).

## 6. Critérios de Aceite (Quality Assurance)
- O login deve persistir a sessão corretamente.
- A previsão de IA deve ser calculada em < 200ms.
- O Dashboard deve carregar em < 1.5s (LCP).
- Todas as rotas administrativas devem estar protegidas.
