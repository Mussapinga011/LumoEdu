// Tipos do Database Supabase
export interface Database {
  public: {
    Tables: {
      universities: {
        Row: {
          id: string;
          name: string;
          short_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          short_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          short_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      disciplines: {
        Row: {
          id: string;
          title: string;
          icon: string | null;
          color: string | null;
          university_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          icon?: string | null;
          color?: string | null;
          university_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          icon?: string | null;
          color?: string | null;
          university_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          display_name: string | null;
          photo_url: string | null;
          role: 'user' | 'admin';
          is_premium: boolean;
          streak: number;
          exams_completed: number;
          challenges_completed: number;
          average_grade: number;
          daily_exercises_count: number;
          last_active: string;
          last_study_date: string | null;
          last_exam_date: string | null;
          last_challenge_date: string | null;
          study_plan: any | null; // JSON column
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          photo_url?: string | null;
          role?: 'user' | 'admin';
          is_premium?: boolean;
          streak?: number;
          exams_completed?: number;
          challenges_completed?: number;
          average_grade?: number;
          daily_exercises_count?: number;
          last_active?: string;
          last_study_date?: string | null;
          last_exam_date?: string | null;
          last_challenge_date?: string | null;
          study_plan?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          photo_url?: string | null;
          role?: 'user' | 'admin';
          is_premium?: boolean;
          streak?: number;
          exams_completed?: number;
          challenges_completed?: number;
          average_grade?: number;
          daily_exercises_count?: number;
          last_active?: string;
          last_study_date?: string | null;
          last_exam_date?: string | null;
          last_challenge_date?: string | null;
          study_plan?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      learning_sections: {
        Row: {
          id: string;
          discipline_id: string;
          title: string;
          description: string | null;
          order_index: number;
          is_premium: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          discipline_id: string;
          title: string;
          description?: string | null;
          order_index: number;
          is_premium?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          discipline_id?: string;
          title?: string;
          description?: string | null;
          order_index?: number;
          is_premium?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      learning_steps: {
        Row: {
          id: string;
          section_id: string;
          discipline_id: string;
          title: string;
          description: string | null;
          order_index: number;
          type: 'quiz' | 'review' | 'challenge';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_id: string;
          discipline_id: string;
          title: string;
          description?: string | null;
          order_index: number;
          type?: 'quiz' | 'review' | 'challenge';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section_id?: string;
          discipline_id?: string;
          title?: string;
          description?: string | null;
          order_index?: number;
          type?: 'quiz' | 'review' | 'challenge';
          created_at?: string;
          updated_at?: string;
        };
      };
      learning_questions: {
        Row: {
          id: string;
          step_id: string;
          question_text: string;
          options: string[];
          correct_answer: string;
          explanation: string | null;
          type: 'multiple_choice' | 'boolean';
          created_at: string;
        };
        Insert: {
          id?: string;
          step_id: string;
          question_text: string;
          options: string[];
          correct_answer: string;
          explanation?: string | null;
          type?: 'multiple_choice' | 'boolean';
          created_at?: string;
        };
        Update: {
          id?: string;
          step_id?: string;
          question_text?: string;
          options?: string[];
          correct_answer?: string;
          explanation?: string | null;
          type?: 'multiple_choice' | 'boolean';
          created_at?: string;
        };
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          step_id: string;
          section_id: string;
          discipline_id: string;
          completed: boolean;
          score: number | null;
          streak: number;
          last_active: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          step_id: string;
          section_id: string;
          discipline_id: string;
          completed?: boolean;
          score?: number | null;
          streak?: number;
          last_active?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          step_id?: string;
          section_id?: string;
          discipline_id?: string;
          completed?: boolean;
          score?: number | null;
          streak?: number;
          last_active?: string;
          created_at?: string;
        };
      };
      study_groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          discipline_id: string | null;
          discipline_name: string | null;
          created_by: string | null;
          max_members: number;
          is_private: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          discipline_id?: string | null;
          discipline_name?: string | null;
          created_by?: string | null;
          max_members?: number;
          is_private?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          discipline_id?: string | null;
          discipline_name?: string | null;
          created_by?: string | null;
          max_members?: number;
          is_private?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_milestones: {
        Row: {
          user_id: string;
          milestone_id: string;
          earned_at: string;
        };
        Insert: {
          user_id: string;
          milestone_id: string;
          earned_at?: string;
        };
        Update: {
          user_id?: string;
          milestone_id?: string;
          earned_at?: string;
        };
      };
    };
  };
}
