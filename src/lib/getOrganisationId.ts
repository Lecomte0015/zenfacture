import { supabase } from './supabaseClient';

/**
 * Récupère l'organisation_id de l'utilisateur connecté.
 * Utilise la fonction RPC SECURITY DEFINER pour éviter les problèmes RLS.
 * Si aucune organisation n'existe, en crée une automatiquement.
 */
export async function getOrganisationId(): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('Utilisateur non authentifié');
  }

  // Try RPC function first (bypasses RLS)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_organisation_id');
    if (!rpcError && rpcData) {
      return rpcData;
    }
  } catch {
    // RPC function might not exist yet, try fallback
  }

  // Fallback: direct query
  const { data, error } = await supabase
    .from('utilisateurs_organisations')
    .select('organisation_id')
    .eq('utilisateur_id', userData.user.id)
    .maybeSingle();

  if (!error && data?.organisation_id) {
    return data.organisation_id;
  }

  // Aucune organisation trouvée - en créer une via RPC SECURITY DEFINER
  const userName = userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'Utilisateur';
  const { data: newOrgId, error: createError } = await supabase.rpc('creer_organisation', {
    nom_organisation: `Organisation de ${userName}`,
  });

  if (createError || !newOrgId) {
    throw new Error('Organisation non trouvée et impossible d\'en créer une');
  }

  return newOrgId;
}
