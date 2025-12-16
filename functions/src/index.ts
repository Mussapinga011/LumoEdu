import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Cloud Function para deletar usuário completamente
 * Deleta tanto o documento do Firestore quanto a conta do Authentication
 */
export const deleteUser = functions.https.onCall(async (data, context) => {
  // Verificar se o usuário que está chamando é admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário não autenticado'
    );
  }

  // Buscar o perfil do usuário que está chamando
  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  const callerData = callerDoc.data();

  if (!callerData || callerData.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Apenas administradores podem deletar usuários'
    );
  }

  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'UID do usuário é obrigatório'
    );
  }

  try {
    // 1. Deletar o documento do Firestore
    await admin.firestore().collection('users').doc(uid).delete();

    // 2. Deletar a conta do Authentication
    await admin.auth().deleteUser(uid);

    return {
      success: true,
      message: 'Usuário deletado com sucesso do Firestore e Authentication'
    };
  } catch (error: any) {
    console.error('Erro ao deletar usuário:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Erro ao deletar usuário: ${error.message}`
    );
  }
});
