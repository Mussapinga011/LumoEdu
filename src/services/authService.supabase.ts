import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Registrar novo usuário
 */
export const signUp = async ({ email, password, displayName }: SignUpData) => {
  try {
    // 1. Criar usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });

    if (error) throw error;

    // O trigger handle_new_user() cria automaticamente o perfil
    // Aguardar um pouco para garantir que o trigger executou
    await new Promise(resolve => setTimeout(resolve, 1000));

    return data;
  } catch (error) {
    console.error('Error in signUp:', error);
    throw error;
  }
};

/**
 * Login de usuário
 */
export const signIn = async ({ email, password }: SignInData) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error in signIn:', error);
    throw error;
  }
};

/**
 * Logout
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error in signOut:', error);
    throw error;
  }
};

/**
 * Login com Google
 */
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in signInWithGoogle:', error);
    throw error;
  }
};

/**
 * Resetar senha
 */
export const resetPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in resetPassword:', error);
    throw error;
  }
};

/**
 * Atualizar senha
 */
export const updatePassword = async (newPassword: string) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in updatePassword:', error);
    throw error;
  }
};

/**
 * Obter sessão atual
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error in getSession:', error);
    return null;
  }
};

/**
 * Obter usuário atual
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

/**
 * Obter perfil completo do usuário
 */
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // Usar maybeSingle para não dar erro se não encontrar

    if (error) {
      console.error('Supabase error in getUserProfile:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Full catch error in getUserProfile:', error);
    throw error;
  }
};

/**
 * Atualizar perfil do usuário
 */
export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
};

/**
 * Verificar se email já existe
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    // Tenta fazer login com senha aleatória
    // Se o erro for "Invalid login credentials", o email existe
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'random_password_check_12345'
    });

    if (error) {
      // Se o erro for de credenciais inválidas, o email existe
      if (error.message.includes('Invalid login credentials')) {
        return true;
      }
      // Outros erros (email não existe, etc)
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Listener para mudanças de autenticação
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      callback(session?.user ?? null);
    }
  );

  return subscription;
};
