import { supabase } from '../lib/supabaseClient';

export interface RappelData {
  id: string;
  facture_id: string;
  organisation_id: string;
  type_rappel: string;
  niveau: number;
  date_envoi: string | null;
  contenu: string | null;
  statut: string;
  cree_le: string;
}

export const getRappels = async (organisationId: string): Promise<RappelData[]> => {
  const { data, error } = await supabase
    .from('rappels')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('cree_le', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createRappel = async (rappelData: Omit<RappelData, 'id' | 'cree_le'>): Promise<RappelData> => {
  const { data, error } = await supabase
    .from('rappels')
    .insert([rappelData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateRappel = async (id: string, updates: Partial<RappelData>): Promise<RappelData> => {
  const { id: _, cree_le, ...safeUpdates } = updates;
  const { data, error } = await supabase
    .from('rappels')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteRappel = async (id: string): Promise<void> => {
  const { error } = await supabase.from('rappels').delete().eq('id', id);
  if (error) throw error;
};

// Détecte les factures en retard et non encore rappelées
export const getFacturesEnRetard = async (organisationId: string) => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('factures')
    .select('*')
    .in('status', ['sent', 'overdue'])
    .lt('due_date', today);

  if (error) throw error;
  return data || [];
};

// Marquer une facture comme en retard
export const marquerEnRetard = async (factureId: string): Promise<void> => {
  const { error } = await supabase
    .from('factures')
    .update({ status: 'overdue' })
    .eq('id', factureId);
  if (error) throw error;
};
