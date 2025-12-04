import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types/user';

/**
 * Script de migração para adicionar username a usuários existentes
 * 
 * ATENÇÃO: Execute este script apenas UMA VEZ para migrar usuários existentes
 * que não possuem o campo username.
 * 
 * Este script:
 * 1. Busca todos os usuários sem username
 * 2. Gera um username único baseado no email ou displayName
 * 3. Atualiza o perfil do usuário com o novo username
 */

// Função para gerar username a partir do email
const generateUsernameFromEmail = (email: string): string => {
  // Remove o domínio do email e substitui caracteres especiais
  const baseUsername = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  
  return baseUsername;
};

// Função para gerar username a partir do displayName
const generateUsernameFromName = (displayName: string): string => {
  return displayName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 20); // Limita a 20 caracteres
};

// Função para garantir que o username seja único
const ensureUniqueUsername = async (baseUsername: string, existingUsernames: Set<string>): Promise<string> => {
  let username = baseUsername;
  let counter = 1;
  
  // Se o username já existe, adiciona um número ao final
  while (existingUsernames.has(username)) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  existingUsernames.add(username);
  return username;
};

/**
 * Função principal de migração
 */
export const migrateUsersToUsername = async (): Promise<{
  success: number;
  failed: number;
  errors: Array<{ uid: string; error: string }>;
}> => {
  console.log('🚀 Iniciando migração de usernames...');
  
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ uid: string; error: string }>
  };
  
  try {
    // Buscar todos os usuários
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    console.log(`📊 Total de usuários encontrados: ${querySnapshot.size}`);
    
    // Set para rastrear usernames já usados
    const existingUsernames = new Set<string>();
    
    // Primeiro, coletar todos os usernames existentes
    querySnapshot.docs.forEach(doc => {
      const user = doc.data() as UserProfile;
      if (user.username) {
        existingUsernames.add(user.username);
      }
    });
    
    console.log(`✅ Usernames existentes: ${existingUsernames.size}`);
    
    // Processar usuários sem username
    for (const docSnapshot of querySnapshot.docs) {
      const user = docSnapshot.data() as UserProfile;
      
      // Pular se já tem username
      if (user.username) {
        console.log(`⏭️  Usuário ${user.uid} já tem username: ${user.username}`);
        continue;
      }
      
      try {
        // Gerar username base
        let baseUsername: string;
        
        if (user.email) {
          baseUsername = generateUsernameFromEmail(user.email);
        } else if (user.displayName) {
          baseUsername = generateUsernameFromName(user.displayName);
        } else {
          // Fallback: usar parte do UID
          baseUsername = `user_${user.uid.substring(0, 8)}`;
        }
        
        // Garantir que seja único
        const uniqueUsername = await ensureUniqueUsername(baseUsername, existingUsernames);
        
        // Atualizar o documento
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          username: uniqueUsername
        });
        
        console.log(`✅ Usuário ${user.uid} atualizado com username: ${uniqueUsername}`);
        results.success++;
        
      } catch (error: any) {
        console.error(`❌ Erro ao atualizar usuário ${user.uid}:`, error);
        results.failed++;
        results.errors.push({
          uid: user.uid,
          error: error.message
        });
      }
    }
    
    console.log('\n📊 Resumo da migração:');
    console.log(`✅ Sucesso: ${results.success}`);
    console.log(`❌ Falhas: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Erros encontrados:');
      results.errors.forEach(err => {
        console.log(`  - ${err.uid}: ${err.error}`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ Erro fatal durante migração:', error);
    throw error;
  }
  
  return results;
};

/**
 * Função para verificar o status da migração
 */
export const checkMigrationStatus = async (): Promise<{
  total: number;
  withUsername: number;
  withoutUsername: number;
  percentage: number;
}> => {
  const usersRef = collection(db, 'users');
  const querySnapshot = await getDocs(usersRef);
  
  let withUsername = 0;
  let withoutUsername = 0;
  
  querySnapshot.docs.forEach(doc => {
    const user = doc.data() as UserProfile;
    if (user.username) {
      withUsername++;
    } else {
      withoutUsername++;
    }
  });
  
  const total = querySnapshot.size;
  const percentage = total > 0 ? (withUsername / total) * 100 : 0;
  
  return {
    total,
    withUsername,
    withoutUsername,
    percentage: Math.round(percentage * 100) / 100
  };
};

// Exemplo de uso:
// import { migrateUsersToUsername, checkMigrationStatus } from './services/migrationService';
//
// // Verificar status
// const status = await checkMigrationStatus();
// console.log('Status:', status);
//
// // Executar migração
// const results = await migrateUsersToUsername();
// console.log('Resultados:', results);
