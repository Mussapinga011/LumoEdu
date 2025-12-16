import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

/**
 * Chama a Cloud Function para deletar um usuário completamente
 * (Firestore + Authentication)
 */
export const deleteUserCompletely = async (uid: string): Promise<void> => {
  const deleteUserFunction = httpsCallable(functions, 'deleteUser');
  
  try {
    const result = await deleteUserFunction({ uid });
    console.log('Usuário deletado:', result.data);
  } catch (error: any) {
    console.error('Erro ao deletar usuário:', error);
    throw new Error(error.message || 'Erro ao deletar usuário');
  }
};
