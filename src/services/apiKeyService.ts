import { supabase } from '../lib/supabaseClient';

export interface CleApi {
  id: string;
  organisation_id: string;
  cle: string;
  nom: string;
  cree_le: string;
  derniere_utilisation: string | null;
  cree_par: string | null;
}

export const apiKeyService = {
  // Générer une nouvelle clé API
  async genererCleApi(organisationId: string, nom: string): Promise<CleApi> {
    const { data, error } = await supabase
      .from('cles_api')
      .insert([
        { 
          organisation_id: organisationId, 
          cle: await this.genererCleUnique(),
          nom,
          cree_par: (await supabase.auth.getUser()).data.user?.id
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Obtenir toutes les clés API d'une organisation
  async obtenirClesApi(organisationId: string): Promise<CleApi[]> {
    const { data, error } = await supabase
      .from('cles_api')
      .select('*')
      .eq('organisation_id', organisationId)
      .order('cree_le', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Supprimer une clé API
  async supprimerCleApi(cleId: string, organisationId: string): Promise<void> {
    const { error } = await supabase
      .from('cles_api')
      .delete()
      .eq('id', cleId)
      .eq('organisation_id', organisationId);
    
    if (error) throw error;
  },

  // Vérifier si une clé API est valide
  async verifierCleApi(cle: string): Promise<{ valide: boolean; organisationId?: string }> {
    const { data, error } = await supabase
      .from('cles_api')
      .select('organisation_id')
      .eq('cle', cle)
      .single();
    
    if (error || !data) return { valide: false };
    
    // Mettre à jour la date de dernière utilisation
    await supabase
      .from('cles_api')
      .update({ derniere_utilisation: new Date().toISOString() })
      .eq('cle', cle);
    
    return { valide: true, organisationId: data.organisation_id };
  },

  // Générer une clé unique
  private async genererCleUnique(): Promise<string> {
    const { data, error } = await supabase.rpc('generer_cle_api');
    if (error) throw error;
    return data;
  }
};

export default apiKeyService;
