import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  Timestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
  runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StudyGroup, GroupMessage, GroupMember } from '../types/group';
import { UserProfile } from '../types/user';

const GROUPS_COLLECTION = 'groups';
const MESSAGES_COLLECTION = 'messages';
const MEMBERS_COLLECTION = 'members';

/**
 * Criar um novo grupo de estudo (Apenas Premium, máx 2 grupos)
 */
export const createGroup = async (
  user: UserProfile,
  data: { name: string; description: string; disciplineId: string; disciplineName: string; isPrivate: boolean }
): Promise<string> => {
  // Regra 1: Free não pode criar grupos
  if (!user.isPremium && user.role !== 'admin') {
    throw new Error('Apenas usuários Premium podem criar grupos. Faça upgrade agora!');
  }

  // Regra 2: Premium pode criar no máximo 1 grupo (Admin ilimitado)
  if (user.isPremium && user.role !== 'admin') {
    const userCreatedGroups = await getUserCreatedGroups(user.uid);
    if (userCreatedGroups.length >= 1) {
      throw new Error('Você já criou 1 grupo. Exclua o grupo existente para criar outro.');
    }
  }

  try {
    const groupData: Omit<StudyGroup, 'id'> = {
      ...data,
      createdBy: user.uid,
      createdAt: Timestamp.now(),
      membersCount: 1,
      maxMembers: 20, // Limite inicial para economizar leituras
      members: [user.uid]
    };

    const docRef = await addDoc(collection(db, GROUPS_COLLECTION), groupData);

    // Adicionar criador como membro admin
    await addMemberToGroup(docRef.id, user, 'admin');

    return docRef.id;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

/**
 * Entrar em um grupo
 */
export const joinGroup = async (groupId: string, user: UserProfile): Promise<void> => {
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);

    await runTransaction(db, async (transaction) => {
      const groupDoc = await transaction.get(groupRef);
      if (!groupDoc.exists()) throw new Error('Grupo não encontrado');

      const groupData = groupDoc.data() as StudyGroup;

      if (groupData.membersCount >= groupData.maxMembers) {
        throw new Error('Este grupo está cheio.');
      }

      if (groupData.members?.includes(user.uid)) {
        throw new Error('Você já está neste grupo.');
      }

      // 1. Adicionar membro na subcoleção
      const memberRef = doc(db, GROUPS_COLLECTION, groupId, MEMBERS_COLLECTION, user.uid);
      const memberData: GroupMember = {
        userId: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL || null,
        role: 'member',
        joinedAt: Timestamp.now()
      };
      transaction.set(memberRef, memberData);

      // 2. Atualizar grupo (add member ID to array and increment count)
      transaction.update(groupRef, {
        membersCount: increment(1),
        members: arrayUnion(user.uid)
      });

      // 3. Adicionar mensagem do sistema
      const messageRef = doc(collection(db, GROUPS_COLLECTION, groupId, MESSAGES_COLLECTION));
      transaction.set(messageRef, {
        groupId,
        userId: 'system',
        userName: 'Sistema',
        text: `${user.displayName} entrou no grupo.`,
        createdAt: Timestamp.now(),
        isSystemMessage: true
      });
    });

  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
};

/**
 * Sair de um grupo
 */
export const leaveGroup = async (groupId: string, userId: string, userName: string): Promise<void> => {
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    
    // Remover da subcoleção de membros
    // Nota: Firestore não deleta subcoleções automaticamente, mas vamos deletar o doc do membro
    // Precisaríamos saber o ID do doc do membro, mas como usamos userId como parte da chave ou query...
    // Vamos simplificar e apenas atualizar o grupo principal por enquanto e remover permissão
    
    // Na verdade, a melhor estrutura para membros é uma subcoleção 'members' dentro do grupo
    // Onde o ID do documento é o userId
    await setDoc(doc(db, GROUPS_COLLECTION, groupId, MEMBERS_COLLECTION, userId), {
        active: false,
        leftAt: serverTimestamp()
    }, { merge: true }); // Soft delete ou hard delete

    // Atualizar grupo
    await updateDoc(groupRef, {
      membersCount: increment(-1),
      members: arrayRemove(userId)
    });

    await sendSystemMessage(groupId, `${userName} saiu do grupo.`);

  } catch (error) {
    console.error('Error leaving group:', error);
    throw error;
  }
};

/**
 * Enviar mensagem
 */
export const sendMessage = async (
  groupId: string,
  user: UserProfile,
  text: string
): Promise<void> => {
  try {
    const messageData: Omit<GroupMessage, 'id'> = {
      groupId,
      userId: user.uid,
      userName: user.displayName,
      userPhotoURL: user.photoURL || null,
      text: text.trim(),
      createdAt: Timestamp.now()
    };

    await addDoc(collection(db, GROUPS_COLLECTION, groupId, MESSAGES_COLLECTION), messageData);
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Buscar grupos disponíveis
 */
export const getAvailableGroups = async (): Promise<StudyGroup[]> => {
  try {
    const q = query(
      collection(db, GROUPS_COLLECTION),
      where('isPrivate', '==', false),
      limit(20)
    );

    const snapshot = await getDocs(q);
    // Ordenar manualmente no JavaScript
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyGroup));
    return groups.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  } catch (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
};

/**
 * Buscar grupos do usuário
 */
export const getUserGroups = async (userId: string): Promise<StudyGroup[]> => {
  try {
    const q = query(
      collection(db, GROUPS_COLLECTION),
      where('members', 'array-contains', userId)
    );

    const snapshot = await getDocs(q);
    // Ordenar manualmente no JavaScript
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyGroup));
    return groups.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }
};

/**
 * Buscar grupos criados pelo usuário
 */
export const getUserCreatedGroups = async (userId: string): Promise<StudyGroup[]> => {
  try {
    const q = query(
      collection(db, GROUPS_COLLECTION),
      where('createdBy', '==', userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyGroup));
  } catch (error) {
    console.error('Error fetching user created groups:', error);
    return [];
  }
};

/**
 * Deletar grupo (apenas Admin ou criador)
 */
export const deleteGroup = async (groupId: string, userId: string, userRole: string): Promise<void> => {
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) throw new Error('Grupo não encontrado');

    const groupData = groupDoc.data() as StudyGroup;

    // Apenas admin ou criador pode deletar
    if (userRole !== 'admin' && groupData.createdBy !== userId) {
      throw new Error('Você não tem permissão para deletar este grupo.');
    }

    // Deletar grupo
    await deleteDoc(groupRef);
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

// Helpers

const addMemberToGroup = async (groupId: string, user: UserProfile, role: 'admin' | 'member') => {
  const memberData: GroupMember = {
    userId: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL || null,
    role,
    joinedAt: Timestamp.now()
  };

  await setDoc(doc(db, GROUPS_COLLECTION, groupId, MEMBERS_COLLECTION, user.uid), memberData);
};

const sendSystemMessage = async (groupId: string, text: string) => {
  await addDoc(collection(db, GROUPS_COLLECTION, groupId, MESSAGES_COLLECTION), {
    groupId,
    userId: 'system',
    userName: 'Sistema',
    text,
    createdAt: Timestamp.now(),
    isSystemMessage: true
  });
};

/**
 * Inscrever-se para receber mensagens em tempo real
 */
export const subscribeToMessages = (groupId: string, callback: (messages: GroupMessage[]) => void) => {
  const q = query(
    collection(db, GROUPS_COLLECTION, groupId, MESSAGES_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(30) // Limite de segurança para leituras
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as GroupMessage)).reverse(); // Inverter para mostrar mais antigas no topo
    callback(messages);
  });
};
