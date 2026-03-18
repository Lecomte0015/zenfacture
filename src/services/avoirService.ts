import { supabase } from '../lib/supabaseClient';

export interface AvoirArticle {
  id: string;
  description: string;
  quantite: number;
  prix_unitaire: number;
  taux_tva: number;
  montant: number;
}

export interface AvoirData {
  id: string;
  organisation_id: string;
  client_id: string | null;
  facture_id: string | null;
  numero_avoir: string;
  date_avoir: string;
  statut: string;
  articles: AvoirArticle[] | any;
  sous_total: number;
  total_tva: number;
  total: number;
  devise: string;
  motif: string | null;
  notes: string | null;
  cree_le: string;
}

interface GetAvoirsOptions {
  organisationId: string;
  page?: number;
  limit?: number;
  search?: string;
}

export const getAvoirs = async ({
  organisationId,
  page = 1,
  limit = 20,
  search,
}: GetAvoirsOptions) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('avoirs')
    .select('*', { count: 'exact' })
    .eq('organisation_id', organisationId)
    .order('cree_le', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`numero_avoir.ilike.%${search}%,motif.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data || [],
    hasMore: count ? from + (data?.length || 0) < count : false,
    total: count || 0,
  };
};

export const createAvoir = async (avoirData: Omit<AvoirData, 'id' | 'cree_le'>): Promise<AvoirData> => {
  const { data, error } = await supabase
    .from('avoirs')
    .insert([avoirData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAvoir = async (id: string, updates: Partial<AvoirData>): Promise<AvoirData> => {
  const { id: _, cree_le, ...safeUpdates } = updates;
  const { data, error } = await supabase
    .from('avoirs')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteAvoir = async (id: string): Promise<void> => {
  const { error } = await supabase.from('avoirs').delete().eq('id', id);
  if (error) throw error;
};

export const generateAvoirNumber = async (organisationId: string): Promise<string> => {
  const { data } = await supabase
    .from('avoirs')
    .select('numero_avoir')
    .eq('organisation_id', organisationId)
    .order('cree_le', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastNumber = data?.numero_avoir || '';
  const match = lastNumber.match(/(\d+)$/);
  const nextNumber = match ? parseInt(match[1], 10) + 1 : 1;

  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  return `AVOIR-${dateStr}-${String(nextNumber).padStart(4, '0')}`;
};

// Créer un avoir depuis une facture existante
export const createAvoirFromInvoice = async (factureId: string, organisationId: string): Promise<AvoirData> => {
  const { data: facture, error: fetchError } = await supabase
    .from('factures')
    .select('*')
    .eq('id', factureId)
    .single();

  if (fetchError || !facture) throw new Error('Facture non trouvée');

  const numero = await generateAvoirNumber(organisationId);

  return createAvoir({
    organisation_id: organisationId,
    client_id: facture.client_id || null,
    facture_id: factureId,
    numero_avoir: numero,
    date_avoir: new Date().toISOString().split('T')[0],
    statut: 'brouillon',
    articles: facture.items || [],
    sous_total: facture.subtotal || 0,
    total_tva: facture.tax || 0,
    total: facture.total || 0,
    devise: facture.devise || 'CHF',
    motif: '',
    notes: '',
  });
};
