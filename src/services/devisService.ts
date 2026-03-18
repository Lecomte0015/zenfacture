import { supabase } from '../lib/supabaseClient';

export interface DevisArticle {
  id: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
  taux_tva: number;
  montant: number;
}

export interface DevisData {
  id: string;
  organisation_id: string;
  client_id: string | null;
  numero_devis: string;
  date_devis: string;
  date_validite: string | null;
  statut: string;
  articles: DevisArticle[] | any;
  sous_total: number;
  total_tva: number;
  total: number;
  devise: string;
  notes: string | null;
  conditions: string | null;
  facture_id: string | null;
  cree_le: string;
  mis_a_jour_le: string;
}

interface GetDevisOptions {
  organisationId: string;
  page?: number;
  limit?: number;
  statut?: string;
  search?: string;
}

interface GetDevisResult {
  data: DevisData[];
  hasMore: boolean;
  total: number;
}

export const getDevisList = async ({
  organisationId,
  page = 1,
  limit = 20,
  statut,
  search,
}: GetDevisOptions): Promise<GetDevisResult> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('devis')
    .select('*', { count: 'exact' })
    .eq('organisation_id', organisationId)
    .order('cree_le', { ascending: false })
    .range(from, to);

  if (statut && statut !== 'all') {
    query = query.eq('statut', statut);
  }

  if (search) {
    query = query.or(`numero_devis.ilike.%${search}%,notes.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching devis:', error);
    throw error;
  }

  return {
    data: data || [],
    hasMore: count ? from + (data?.length || 0) < count : false,
    total: count || 0,
  };
};

export const getDevis = async (id: string): Promise<DevisData | null> => {
  const { data, error } = await supabase
    .from('devis')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
};

export const createDevis = async (
  devisData: Omit<DevisData, 'id' | 'cree_le' | 'mis_a_jour_le'>
): Promise<DevisData> => {
  const { data, error } = await supabase
    .from('devis')
    .insert([devisData])
    .select()
    .single();

  if (error) {
    console.error('Error creating devis:', error);
    throw error;
  }

  return data;
};

export const updateDevis = async (id: string, updates: Partial<DevisData>): Promise<DevisData> => {
  const { id: _, cree_le, mis_a_jour_le, ...safeUpdates } = updates;

  const { data, error } = await supabase
    .from('devis')
    .update({ ...safeUpdates, mis_a_jour_le: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating devis:', error);
    throw error;
  }

  return data;
};

export const deleteDevis = async (id: string): Promise<void> => {
  const { error } = await supabase.from('devis').delete().eq('id', id);
  if (error) throw error;
};

export const generateDevisNumber = async (organisationId: string): Promise<string> => {
  const { data } = await supabase
    .from('devis')
    .select('numero_devis')
    .eq('organisation_id', organisationId)
    .order('cree_le', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastNumber = data?.numero_devis || '';
  const match = lastNumber.match(/(\d+)$/);
  const nextNumber = match ? parseInt(match[1], 10) + 1 : 1;

  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  return `DEV-${dateStr}-${String(nextNumber).padStart(4, '0')}`;
};

// Convertir un devis en facture
export const convertirEnFacture = async (devisId: string): Promise<string> => {
  const devis = await getDevis(devisId);
  if (!devis) throw new Error('Devis non trouvé');

  // Créer la facture depuis le devis
  const userId = (await supabase.auth.getUser()).data.user?.id || '';
  const { data: facture, error } = await supabase
    .from('factures')
    .insert([{
      user_id: userId,
      invoice_number: '',
      client_name: '',
      client_email: '',
      date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      items: devis.articles as any,
      subtotal: devis.sous_total,
      tax: devis.total_tva,
      total: devis.total,
      notes: devis.notes || null,
      devise: devis.devise,
      client_id: devis.client_id || null,
    }])
    .select('id')
    .single();

  if (error) throw error;

  // Mettre à jour le devis
  await updateDevis(devisId, {
    statut: 'converti',
    facture_id: facture.id,
  });

  return facture.id;
};
