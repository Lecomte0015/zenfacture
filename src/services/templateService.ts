import { supabase } from '../lib/supabaseClient';

export interface TemplateConfig {
  couleur_primaire: string;
  couleur_secondaire: string;
  police: string;
  mise_en_page: string;
  logo_url?: string;
}

export interface TemplateData {
  id: string;
  organisation_id: string | null;
  nom: string;
  description: string | null;
  config: TemplateConfig | any;
  est_defaut: boolean;
  est_systeme: boolean;
  cree_le: string;
}

export const getTemplates = async (organisationId: string): Promise<TemplateData[]> => {
  const { data, error } = await supabase
    .from('templates_facture')
    .select('*')
    .or(`est_systeme.eq.true,organisation_id.eq.${organisationId}`)
    .order('est_systeme', { ascending: false })
    .order('nom', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createTemplate = async (
  templateData: Omit<TemplateData, 'id' | 'cree_le'>
): Promise<TemplateData> => {
  const { data, error } = await supabase
    .from('templates_facture')
    .insert([templateData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateTemplate = async (id: string, updates: Partial<TemplateData>): Promise<TemplateData> => {
  const { id: _, cree_le, ...safeUpdates } = updates;
  const { data, error } = await supabase
    .from('templates_facture')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  const { error } = await supabase.from('templates_facture').delete().eq('id', id);
  if (error) throw error;
};

export const setDefaultTemplate = async (id: string, organisationId: string): Promise<void> => {
  // Retirer le défaut de tous les templates de l'org
  await supabase
    .from('templates_facture')
    .update({ est_defaut: false })
    .eq('organisation_id', organisationId);

  // Définir le nouveau défaut
  await supabase
    .from('templates_facture')
    .update({ est_defaut: true })
    .eq('id', id);
};
