export interface Question {
  id: string;
  examId?: string;
  statement: string;
  options: string[]; // [A, B, C, D, E]
  correctOption: string; // The value of the correct option
  explanation?: string;
  disciplineId?: string;
  difficulty?: number;
  order?: number; // Order of the question in the exam
}

export interface Exam {
  id: string;
  disciplineId: string;
  name: string; // e.g., "Exame 2014 – 1ª época"
  year: number;
  season: string; // "1ª época", "2ª época", etc.
  questionsCount: number;
  createdAt: any; // Timestamp string or Date
  description?: string;
  university?: string; // ID da Universidade (Supabase university_id)
  universityId?: string; // Alias para compatibilidade com código antigo
  isActive?: boolean; // Se o exame está ativo/visível para os usuários
}
