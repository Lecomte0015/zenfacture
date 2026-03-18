import { supabase } from '@/lib/supabaseClient';

export type ReminderStatus = 'todo' | 'in_progress' | 'done';

export interface AdminReminder {
  id?: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string; // ISO date string
  status: ReminderStatus;
  category: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Récupère tous les rappels administratifs de l'utilisateur connecté
 */
export const getAdminReminders = async (): Promise<AdminReminder[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Utilisateur non connecté');
  }

  const { data, error } = await supabase
    .from('rappels')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des rappels :', error);
    throw error;
  }

  return data || [];
};

/**
 * Crée un nouveau rappel administratif
 */
export const createAdminReminder = async (reminder: Omit<AdminReminder, 'id' | 'created_at' | 'updated_at'>): Promise<AdminReminder> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Utilisateur non connecté');
  }

  const { data, error } = await supabase
    .from('rappels')
    .insert([{ ...reminder, user_id: user.id }])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création du rappel :', error);
    throw error;
  }

  return data;
};

/**
 * Met à jour un rappel existant
 */
export const updateAdminReminder = async (id: string, updates: Partial<AdminReminder>): Promise<AdminReminder> => {
  const { data, error } = await supabase
    .from('rappels')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour du rappel :', error);
    throw error;
  }

  return data;
};

/**
 * Supprime un rappel
 */
export const deleteAdminReminder = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('rappels')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur lors de la suppression du rappel :', error);
    throw error;
  }
};

/**
 * Récupère les rappels à venir (dans les 7 prochains jours)
 */
export const getUpcomingAdminReminders = async (daysAhead: number = 7): Promise<AdminReminder[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Utilisateur non connecté');
  }

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('rappels')
    .select('*')
    .eq('user_id', user.id)
    .gte('due_date', now.toISOString())
    .lte('due_date', futureDate.toISOString())
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des rappels à venir :', error);
    throw error;
  }

  return data || [];
};
