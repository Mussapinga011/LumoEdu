export interface Question {
  id: string;
  examId: string;
  statement: string;
  options: string[]; // [A, B, C, D]
  correctOption: string; // The value of the correct option
  explanation?: string;
  disciplineId?: string;
  difficulty?: number;
}

export interface Exam {
  id: string;
  disciplineId: string;
  name: string; // e.g., "Exame 2014 – 1ª época"
  year: number;
  season: string; // "1ª época", "2ª época", etc.
  questionsCount: number;
  createdAt: any; // Timestamp
  description?: string;
}
