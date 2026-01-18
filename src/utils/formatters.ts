/**
 * Traduz os IDs das disciplinas para nomes legíveis em Português
 */
export const translateDiscipline = (id: string): string => {
  const mapping: Record<string, string> = {
    'math': 'Matemática',
    'portuguese': 'Português',
    'physics': 'Física',
    'chemistry': 'Química',
    'biology': 'Biologia',
    'history': 'História',
    'geography': 'Geografia',
    'drawing': 'Desenho',
    'geometry': 'Geometria',
    'english': 'Inglês'
  };

  return mapping[id.toLowerCase()] || id.toUpperCase();
};
