import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

interface OrganisationContextType {
  organisationId: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const OrganisationContext = createContext<OrganisationContextType>({
  organisationId: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

export const useOrganisation = () => useContext(OrganisationContext);

/**
 * Crée automatiquement une organisation pour un utilisateur qui n'en a pas.
 * Utilise la fonction RPC SECURITY DEFINER pour bypasser RLS.
 */
async function createDefaultOrganisation(userName?: string): Promise<string | null> {
  try {
    const orgName = userName ? `Organisation de ${userName}` : 'Mon entreprise';

    // Utiliser la fonction RPC SECURITY DEFINER qui crée l'org + le lien utilisateur
    const { data, error } = await supabase.rpc('creer_organisation', {
      nom_organisation: orgName,
    });

    if (error) {
      console.error('Erreur création organisation par défaut:', error);
      return null;
    }

    return data; // Retourne l'UUID de la nouvelle organisation
  } catch (err) {
    console.error('Erreur lors de la création de l\'organisation par défaut:', err);
    return null;
  }
}

export const OrganisationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const fetchOrganisationId = useCallback(async () => {
    if (!user?.id) {
      setOrganisationId(null);
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
        orgId = await createDefaultOrganisation(userName);
      }

      if (orgId) {
        setOrganisationId(orgId);
      } else {
        setError('Impossible de créer votre organisation. Veuillez vous reconnecter.');
        setOrganisationId(null);
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
      fetchOrganisationId();
    } else {
      setOrganisationId(null);
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, fetchOrganisationId]);

  return (
    <OrganisationContext.Provider value={{ organisationId, loading, error, refresh: fetchOrganisationId }}>
      {children}
    </OrganisationContext.Provider>
  );
};
