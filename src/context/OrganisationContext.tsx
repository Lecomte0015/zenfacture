import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import type { ProfilMetier } from '../config/businessProfiles';

interface OrganisationContextType {
  organisationId: string | null;
  profilMetier: ProfilMetier | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfilMetier: (profil: ProfilMetier) => Promise<void>;
}

const OrganisationContext = createContext<OrganisationContextType>({
  organisationId: null,
  profilMetier: null,
  loading: true,
  error: null,
  refresh: async () => {},
  updateProfilMetier: async () => {},
});

export const useOrganisation = () => useContext(OrganisationContext);

/**
 * Crée automatiquement une organisation pour un utilisateur qui n'en a pas.
 * Utilise la fonction RPC SECURITY DEFINER pour bypasser RLS.
 */
async function createDefaultOrganisation(userName?: string): Promise<string | null> {
  try {
    const orgName = userName ? `Organisation de ${userName}` : 'Mon entreprise';
    const { data, error } = await supabase.rpc('creer_organisation', {
      nom_organisation: orgName,
    });
    if (error) {
      console.error('Erreur création organisation par défaut:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Erreur lors de la création de l\'organisation par défaut:', err);
    return null;
  }
}

export const OrganisationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [profilMetier, setProfilMetier] = useState<ProfilMetier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const fetchOrganisation = useCallback(async () => {
    if (!user?.id) {
      setOrganisationId(null);
      setProfilMetier(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      let orgId: string | null = null;

      // Try RPC function first (bypasses RLS via SECURITY DEFINER)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_organisation_id');
        if (!rpcError && rpcData) {
          orgId = rpcData;
        }
      } catch {
        // RPC function might not exist yet
      }

      // Fallback: direct query
      if (!orgId) {
        const { data, error: queryError } = await supabase
          .from('utilisateurs_organisations')
          .select('organisation_id')
          .eq('utilisateur_id', user.id)
          .maybeSingle();

        if (!queryError && data?.organisation_id) {
          orgId = data.organisation_id;
        }
      }

      // Si aucune organisation trouvée, en créer une automatiquement
      if (!orgId) {
        const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0];
        orgId = await createDefaultOrganisation(userName as string | undefined);
      }

      if (orgId) {
        setOrganisationId(orgId);

        // Récupérer le profil_metier (résistant si la colonne n'existe pas encore)
        try {
          const { data: orgData, error: orgError } = await supabase
            .from('organisations')
            .select('profil_metier')
            .eq('id', orgId)
            .maybeSingle();
          if (!orgError) {
            setProfilMetier((orgData?.profil_metier as ProfilMetier) ?? null);
          } else {
            // Colonne absente (migration non lancée) → null
            setProfilMetier(null);
          }
        } catch {
          setProfilMetier(null);
        }
      } else {
        setError('Impossible de créer votre organisation. Veuillez vous reconnecter.');
        setOrganisationId(null);
        setProfilMetier(null);
      }
    } catch (err) {
      console.error('Erreur récupération organisation:', err);
      setError('Erreur de connexion');
      setOrganisationId(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.user_metadata, user?.email]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchOrganisation();
    } else {
      setOrganisationId(null);
      setProfilMetier(null);
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, fetchOrganisation]);

  /** Met à jour le profil_metier en BDD et dans l'état local */
  const updateProfilMetier = useCallback(async (profil: ProfilMetier) => {
    if (!organisationId) return;
    try {
      const { error } = await supabase
        .from('organisations')
        .update({ profil_metier: profil })
        .eq('id', organisationId);

      if (error) {
        console.error('Erreur mise à jour profil_metier:', error);
        throw error;
      }
      setProfilMetier(profil);
    } catch (err) {
      console.error('Erreur updateProfilMetier:', err);
      throw err;
    }
  }, [organisationId]);

  return (
    <OrganisationContext.Provider value={{
      organisationId,
      profilMetier,
      loading,
      error,
      refresh: fetchOrganisation,
      updateProfilMetier,
    }}>
      {children}
    </OrganisationContext.Provider>
  );
};
