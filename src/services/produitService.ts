import { supabase } from '../lib/supabaseClient';

export interface ProduitData {
  id: string;
  organisation_id: string;
  nom: string;
  description: string | null;
  prix_unitaire: number;
  taux_tva: number;
  unite: string;
  categorie: string | null;
  actif: boolean;
  cree_le: string;
  mis_a_jour_le: string;
}

interface GetProduitsOptions {
  organisationId: string;
  page?: number;
  limit?: number;
  search?: string;
  categorie?: string;
  actifOnly?: boolean;
}

interface GetProduitsResult {
  data: ProduitData[];
  hasMore: boolean;
  total: number;
}

export const getProduits = async ({
  organisationId,
  page = 1,
  limit = 20,
  search,
  categorie,
  actifOnly = false,
}: GetProduitsOptions): Promise<GetProduitsResult> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('produits')
    .select('*', { count: 'exact' })
    .eq('organisation_id', organisationId)
    .order('nom', { ascending: true })
    .range(from, to);

  if (search) {
    query = query.or(`nom.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (categorie) {
    query = query.eq('categorie', categorie);
  }

  if (actifOnly) {
    query = query.eq('actif', true);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching produits:', error);
    throw error;
  }

  return {
    data: data || [],
    hasMore: count ? from + (data?.length || 0) < count : false,
    total: count || 0,
  };
};

export const getProduit = async (id: string): Promise<ProduitData | null> => {
  const { data, error } = await supabase
    .from('produits')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
};

export const createProduit = async (
  produitData: Omit<ProduitData, 'id' | 'cree_le' | 'mis_a_jour_le'>
): Promise<ProduitData> => {
  const { data, error } = await supabase
    .from('produits')
    .insert([{
      ...produitData,
      description: produitData.description || null,
      categorie: produitData.categorie || null,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating produit:', error);
    throw error;
  }

  return data;
};

export const updateProduit = async (id: string, updates: Partial<ProduitData>): Promise<ProduitData> => {
  const { id: _, cree_le, mis_a_jour_le, ...safeUpdates } = updates;

  const { data, error } = await supabase
    .from('produits')
    .update({
      ...safeUpdates,
      mis_a_jour_le: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating produit:', error);
    throw error;
  }

  return data;
};

export const deleteProduit = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('produits')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting produit:', error);
    throw error;
  }
};

export const getCategories = async (organisationId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('produits')
    .select('categorie')
    .eq('organisation_id', organisationId)
    .not('categorie', 'is', null);

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  const categories = [...new Set((data || []).map(d => d.categorie).filter(Boolean))];
  return categories as string[];
};

export const exportProduitsCSV = (produits: ProduitData[]): string => {
  const headers = ['Nom', 'Description', 'Prix unitaire', 'Taux TVA', 'Unité', 'Catégorie', 'Actif'];
  const rows = produits.map(p => [
    p.nom,
    p.description || '',
    p.prix_unitaire.toString(),
    p.taux_tva.toString(),
    p.unite,
    p.categorie || '',
    p.actif ? 'Oui' : 'Non',
  ]);

  return [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(';'))
  ].join('\n');
};
