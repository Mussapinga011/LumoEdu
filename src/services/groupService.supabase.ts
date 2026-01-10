import { supabase } from '../lib/supabase';

/**
 * Buscar todos os grupos públicos
 */
export const getAllGroups = async () => {
  try {
    const { data, error } = await supabase
      .from('study_groups')
      .select('*, group_members!left(count)')
      .eq('is_private', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((g: any) => ({
      ...g,
      memberCount: g.group_members?.[0]?.count || 0,
      disciplineId: g.discipline_id,
      disciplineName: g.discipline_name,
      createdBy: g.created_by,
      isPrivate: g.is_private
    }));
  } catch (error) {
    console.error('Error in getAllGroups:', error);
    throw error;
  }
};

/**
 * Buscar grupo por ID
 */
export const getGroupById = async (groupId: string) => {
  try {
    const { data, error } = await supabase
      .from('study_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) throw error;
    return {
      ...data,
      disciplineId: data.discipline_id,
      disciplineName: data.discipline_name,
      createdBy: data.created_by,
      isPrivate: data.is_private
    };
  } catch (error) {
    console.error('Error in getGroupById:', error);
    throw error;
  }
};

/**
 * Criar novo grupo
 */
export const createGroup = async (userId: string, groupData: any) => {
  try {
    const { data, error } = await supabase
      .from('study_groups')
      .insert({
        name: groupData.name,
        description: groupData.description,
        discipline_id: groupData.discipline_id || groupData.disciplineId,
        discipline_name: groupData.discipline_name || groupData.disciplineName,
        created_by: userId,
        max_members: groupData.maxMembers || 50,
        is_private: groupData.is_private ?? groupData.isPrivate ?? false
      })
      .select()
      .single();

    if (error) throw error;

    // Adicionar criador como primeiro membro
    await joinGroup(data.id, userId);

    return data;
  } catch (error) {
    console.error('Error in createGroup:', error);
    throw error;
  }
};

/**
 * Entrar em um grupo
 */
export const joinGroup = async (groupId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('group_members')
      .upsert({
        group_id: groupId,
        user_id: userId
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error in joinGroup:', error);
    throw error;
  }
};

/**
 * Sair de um grupo
 */
export const leaveGroup = async (groupId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error in leaveGroup:', error);
    throw error;
  }
};

/**
 * Buscar mensagens de um grupo
 */
export const getGroupMessages = async (groupId: string) => {
  try {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data.map((msg: any) => ({
      id: msg.id,
      groupId: msg.group_id,
      userId: msg.user_id,
      userName: msg.user_name,
      userPhoto: msg.user_photo,
      userPhotoURL: msg.user_photo,
      content: msg.message,
      text: msg.message,
      timestamp: msg.created_at,
      createdAt: msg.created_at,
      type: msg.type || 'text',
      isSystemMessage: msg.type === 'system'
    }));
  } catch (error) {
    console.error('Error in getGroupMessages:', error);
    throw error;
  }
};

/**
 * Enviar mensagem
 */
export const sendMessage = async (messageData: any) => {
  try {
    const { error } = await supabase
      .from('group_messages')
      .insert({
        group_id: messageData.groupId,
        user_id: messageData.userId,
        user_name: messageData.userName,
        user_photo: messageData.userPhoto || messageData.userPhotoURL,
        message: messageData.text || messageData.content,
        type: messageData.type || 'text'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};

/**
 * Listener em tempo real para novas mensagens
 */
export const subscribeToMessages = (groupId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`group-${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`
      },
      (payload) => callback({
        id: payload.new.id,
        groupId: payload.new.group_id,
        userId: payload.new.user_id,
        userName: payload.new.user_name,
        userPhoto: payload.new.user_photo,
        userPhotoURL: payload.new.user_photo,
        content: payload.new.message,
        text: payload.new.message,
        timestamp: payload.new.created_at,
        createdAt: payload.new.created_at,
        type: payload.new.type || 'text',
        isSystemMessage: payload.new.type === 'system'
      })
    )
    .subscribe();
};

/**
 * Buscar grupos que o usuário participa (com detalhes)
 */
export const getUserGroups = async (userId: string) => {
  try {
    const { data: memberGroups, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (memberError) throw memberError;
    if (memberGroups.length === 0) return [];

    const groupIds = memberGroups.map(mg => mg.group_id);

    const { data, error } = await supabase
      .from('study_groups')
      .select('*, group_members(count)')
      .in('id', groupIds);

    if (error) throw error;
    return data.map((g: any) => ({
      ...g,
      memberCount: g.group_members?.[0]?.count || 0,
      disciplineId: g.discipline_id,
      disciplineName: g.discipline_name,
      createdBy: g.created_by,
      isPrivate: g.is_private
    }));
  } catch (error) {
    console.error('Error in getUserGroups:', error);
    return [];
  }
};

/**
 * Deletar um grupo
 */
export const deleteGroup = async (groupId: string, userId?: string, userRole?: string) => {
  try {
    if (userId && userRole) {
      const { data: group } = await supabase
        .from('study_groups')
        .select('created_by')
        .eq('id', groupId)
        .single();

      if (userRole !== 'admin' && group?.created_by !== userId) {
        throw new Error('Você não tem permissão para deletar este grupo.');
      }
    }

    const { error } = await supabase
      .from('study_groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
  } catch (error) {
    console.error('Error in deleteGroup:', error);
    throw error;
  }
};

export const updateGroup = async (groupId: string, updates: any) => {
  try {
    const { error } = await supabase
      .from('study_groups')
      .update(updates)
      .eq('id', groupId);

    if (error) throw error;
  } catch (error) {
    console.error('Error in updateGroup:', error);
    throw error;
  }
};
