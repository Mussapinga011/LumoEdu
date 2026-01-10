/**
 * Utility to translate Firebase and application errors into user-friendly Portuguese messages
 */

export const getErrorMessage = (error: any): string => {
  // If error is already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // Extract error code from Firebase errors
  const errorCode = error?.code || error?.message || '';

  // Firebase Authentication Errors
  const authErrors: Record<string, string> = {
    'auth/invalid-credential': 'Email ou senha incorretos. Por favor, verifique seus dados.',
    'auth/user-not-found': 'Usuário não encontrado. Verifique o email digitado.',
    'auth/wrong-password': 'Senha incorreta. Tente novamente.',
    'auth/email-already-in-use': 'Este email já está em uso. Tente fazer login ou use outro email.',
    'auth/weak-password': 'A senha é muito fraca. Use pelo menos 6 caracteres.',
    'auth/invalid-email': 'Email inválido. Verifique o formato do email.',
    'auth/user-disabled': 'Esta conta foi desativada. Entre em contato com o suporte.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet e tente novamente.',
    'auth/requires-recent-login': 'Por segurança, faça login novamente para continuar.',
    'auth/invalid-verification-code': 'Código de verificação inválido.',
    'auth/invalid-verification-id': 'ID de verificação inválido.',
    'auth/missing-verification-code': 'Código de verificação não fornecido.',
    'auth/missing-verification-id': 'ID de verificação não fornecido.',
    'auth/credential-already-in-use': 'Esta credencial já está em uso por outra conta.',
    'auth/operation-not-allowed': 'Operação não permitida. Entre em contato com o suporte.',
    'auth/account-exists-with-different-credential': 'Já existe uma conta com este email usando outro método de login.',
  };

  // Firestore Errors
  const firestoreErrors: Record<string, string> = {
    'permission-denied': 'Você não tem permissão para realizar esta ação.',
    'not-found': 'Documento não encontrado.',
    'already-exists': 'Este documento já existe.',
    'resource-exhausted': 'Limite de requisições excedido. Tente novamente mais tarde.',
    'failed-precondition': 'Operação não pode ser realizada. Verifique os dados.',
    'aborted': 'Operação cancelada. Tente novamente.',
    'out-of-range': 'Valor fora do intervalo permitido.',
    'unimplemented': 'Funcionalidade não implementada.',
    'internal': 'Erro interno do servidor. Tente novamente mais tarde.',
    'unavailable': 'Serviço temporariamente indisponível. Tente novamente.',
    'data-loss': 'Perda de dados detectada.',
    'unauthenticated': 'Você precisa fazer login para continuar.',
  };

  // Application-specific errors
  const appErrors: Record<string, string> = {
    'name-already-exists': 'Este nome já está em uso. Por favor, escolha outro nome.',
    'username-already-exists': 'Este nome de usuário já está em uso.',
    'invalid-name': 'Nome inválido. Use pelo menos 3 caracteres.',
    'invalid-email': 'Email inválido.',
    'invalid-password': 'Senha inválida. Use pelo menos 6 caracteres.',
    'network-error': 'Erro de conexão. Verifique sua internet.',
    'unknown-error': 'Ocorreu um erro inesperado. Tente novamente.',
  };

  // Check for Firebase auth errors
  if (errorCode.startsWith('auth/')) {
    return authErrors[errorCode] || 'Erro de autenticação. Tente novamente.';
  }

  // Check for Firestore errors
  if (firestoreErrors[errorCode]) {
    return firestoreErrors[errorCode];
  }

  // Check for application errors
  if (appErrors[errorCode]) {
    return appErrors[errorCode];
  }

  // Check if error message contains known patterns
  const errorMessage = error?.message?.toLowerCase() || '';
  
  if (errorMessage.includes('name') && errorMessage.includes('already')) {
    return 'Este nome já está em uso. Por favor, escolha outro nome.';
  }
  
  if (errorMessage.includes('network')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  if (errorMessage.includes('permission')) {
    return 'Você não tem permissão para realizar esta ação.';
  }

  if (errorMessage.includes('email rate limit exceeded')) {
    return 'Limite de envios de email excedido. Aguarde alguns minutos antes de tentar novamente.';
  }

  if (errorMessage.includes('invalid login credentials')) {
    return 'Email ou senha incorretos. Por favor, verifique seus dados.';
  }

  if (errorMessage.includes('user already registered')) {
    return 'Este email já está em uso. Tente fazer login ou use outro email.';
  }

  // Default error message
  return error?.message || 'Ocorreu um erro inesperado. Por favor, tente novamente.';
};
