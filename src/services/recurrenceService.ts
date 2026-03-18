import { supabase } from '../lib/supabaseClient';

export interface RecurrenceData {
  id: string;
  organisation_id: string;
  client_id: string | null;
  nom: string;
  articles: any;
  sous_total: number;
  total_tva: number;
  total: number;
  devise: string;
  frequence: string;
  jour_emission: number;
  prochaine_emission: string | null;
  derniere_emission: string | null;
  date_debut: string;
  date_fin: string | null;
  actif: boolean;
  notes: string | null;
  cree_le: string;
  mis_a_jour_le: string;
}

interface GetRecurrencesOptions {
  organisationId: string;
  page?: number;
  limit?: number;
}

export const getRecurrences = async ({
  organisationId,
  page = 1,
  limit = 20,
}: GetRecurrencesOptions) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('factures_recurrentes')
    .select('*', { count: 'exact' })
    .eq('organisation_id', organisationId)
    .order('cree_le', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: data || [],
    hasMore: count ? from + (data?.length || 0) < count : false,
    total: count || 0,
  };
};

export const createRecurrence = async (data: Omit<RecurrenceData, 'id' | 'cree_le' | 'mis_a_jour_le'>): Promise<RecurrenceData> => {
  const { data: result, error } = await supabase
    .from('factures_recurrentes')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result;
};

export const updateRecurrence = async (id: string, updates: Partial<RecurrenceData>): Promise<RecurrenceData> => {
  const { id: _, cree_le, mis_a_jour_le, ...safeUpdates } = updates;
  const { data, error } = await supabase
    .from('factures_recurrentes')
    .update({ ...safeUpdates, mis_a_jour_le: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteRecurrence = async (id: string): Promise<void> => {
  const { error } = await supabase.from('factures_recurrentes').delete().eq('id', id);
  if (error) throw error;
};

export const toggleRecurrence = async (id: string, actif: boolean): Promise<RecurrenceData> => {
  return updateRecurrence(id, { actif });
};
