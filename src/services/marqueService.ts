import { supabase } from '../lib/supabaseClient';

export interface Marque {
  id: string;
  organisation_id: string;
  nom: string;
  slug: string;
  description?: string;
  logo_url?: string;
  couleur_primaire: string;
  couleur_secondaire?: string;
  police?: string;
  adresse?: string;
  email?: string;
  telephone?: string;
  site_web?: string;
  mentions_legales?: string;
  conditions_paiement?: string;
  pied_facture?: string;
  actif: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type MarqueInput = Omit<Marque, 'id' | 'created_at' | 'updated_at'>;

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getMarques(organisationId: string): Promise<Marque[]> {
  const { data, error } = await supabase
    .from('marques')
    .select('*')
    .eq('organisation_id', organisationId)
    .eq('actif', true)
    .order('is_default', { ascending: false })
    .order('nom');
  if (error) throw error;
  return data || [];
}

export async function createMarque(input: MarqueInput): Promise<Marque> {
  // Si c'est la première marque ou is_default, désactiver les autres default
  if (input.is_default) {
    await supabase
      .from('marques')
      .update({ is_default: false })
      .eq('organisation_id', input.organisation_id);
  }

  const { data, error } = await supabase
    .from('marques')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMarque(id: string, updates: Partial<MarqueInput>): Promise<Marque> {
  if (updates.is_default && updates.organisation_id) {
    await supabase
      .from('marques')
      .update({ is_default: false })
      .eq('organisation_id', updates.organisation_id)
      .neq('id', id);
  }

  const { data, error } = await supabase
    .from('marques')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMarque(id: string): Promise<void> {
  const { error } = await supabase
    .from('marques')
    .update({ actif: false })
    .eq('id', id);
  if (error) throw error;
}

export async function setMarqueDefault(id: string, organisationId: string): Promise<void> {
  await supabase
    .from('marques')
    .update({ is_default: false })
    .eq('organisation_id', organisationId);
  await supabase
    .from('marques')
    .update({ is_default: true })
    .eq('id', id);
}

/**
 * Génère un slug à partir d'un nom
 */
export function generateSlug(nom: string): string {
  return nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

/**
 * Récupère les statistiques d'utilisation des marques
 */
export async function getMarqueStats(organisationId: string): Promise<
  { marque_id: string; nom: string; count: number }[]
> {
  const { data: marques } = await supabase
    .from('marques')
    .select('id, nom')
    .eq('organisation_id', organisationId)
    .eq('actif', true);

  if (!marques || marques.length === 0) return [];

  const stats = await Promise.all(
    marques.map(async m => {
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('marque_id', m.id);
      return { marque_id: m.id, nom: m.nom, count: count || 0 };
    })
  );

  return stats;
}
