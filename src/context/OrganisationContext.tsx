import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import type { ProfilMetier } from '../config/businessProfiles';

// ─── Clé localStorage pour persister le profil entre les refreshs ────────────
const PROFIL_CACHE_KEY = 'zf_profil_metier';

function getCachedProfil(userId: string): ProfilMetier | null {
  try {
    const raw = localStorage.getItem(`${PROFIL_CACHE_KEY}_${userId}`);
    return raw ? (raw as ProfilMetier) : null;
  } catch { return null; }
}

function setCachedProfil(userId: string, profil: ProfilMetier) {
  try {
    localStorage.setItem(`${PROFIL_CACHE_KEY}_${userId}`, profil);
  } catch { /* ignore */ }
}

function clearCachedProfil(userId: string) {
  try {
    localStorage.removeItem(`${PROFIL_CACHE_KEY}_${userId}`);
  } catch { /* ignore */ }
}

// ─── Context ─────────────────────────────────────────────────────────────────

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

async function createDefaultOrganisation(userName?: string): Promise<string | null> {
  try {
    const orgName = userName ? `Organisation de ${userName}` : 'Mon entreprise';
    const { data, error } = await supabase.rpc('creer_organisation', {
      nom_organisation: orgName,
    });
    if (error) { console.error('Erreur création organisation:', error); return null; }
    return data;
  } catch { return null; }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export const OrganisationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [profilMetier, setProfilMetierState] = useState<ProfilMetier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  /** Wrapper : met à jour état React + localStorage en même temps */
  const setProfilMetier = useCallback((profil: ProfilMetier | null) => {
    setProfilMetierState(profil);
    if (user?.id) {
      if (profil) setCachedProfil(user.id, profil);
      else clearCachedProfil(user.id);
    }
  }, [user?.id]);

  const fetchOrganisation = useCallback(async () => {
    if (!user?.id) {
      setOrganisationId(null);
      setProfilMetierState(null);
      setLoading(false);
      return;
    }

    // ── Affichage immédiat depuis le cache localStorage (évite le flash de modal) ──
    const cached = getCachedProfil(user.id);
    if (cached) setProfilMetierState(cached);

    try {
      setError(null);
      let orgId: string | null = null;

      // 1. RPC get_my_organisation_id (SECURITY DEFINER)
      try {
        const { data, error: e } = await supabase.rpc('get_my_organisation_id');
        if (!e && data) orgId = data;
      } catch { /* ignore */ }

      // 2. Fallback: direct query
      if (!orgId) {
        const { data } = await supabase
          .from('utilisateurs_organisations')
          .select('organisation_id')
          .eq('utilisateur_id', user.id)
          .maybeSingle();
        if (data?.organisation_id) orgId = data.organisation_id;
      }

      // 3. Créer org si inexistante
      if (!orgId) {
        const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0];
        orgId = await createDefaultOrganisation(userName as string | undefined);
      }

      if (orgId) {
        setOrganisationId(orgId);

        // ── Lire profil_metier via RPC SECURITY DEFINER (bypass RLS) ──
        let profil: ProfilMetier | null = null;
        try {
          const { data: rpcProfil, error: rpcErr } = await supabase.rpc('get_my_profil_metier');
          if (!rpcErr && rpcProfil) {
            profil = rpcProfil as ProfilMetier;
          }
        } catch { /* RPC pas encore déployée */ }

        // ── Fallback: SELECT direct (si RLS le permet) ──
        if (profil === null) {
          try {
            const { data: orgData, error: orgErr } = await supabase
              .from('organisations')
              .select('profil_metier')
              .eq('id', orgId)
              .maybeSingle();
            if (!orgErr && orgData?.profil_metier) {
              profil = orgData.profil_metier as ProfilMetier;
            }
          } catch { /* ignore */ }
        }

        // ── Appliquer : DB a priorité sur le cache ──
        if (profil !== null) {
          setProfilMetier(profil);   // met à jour état + cache
        } else if (!cached) {
          // Aucune source → null (modal d'onboarding)
          setProfilMetierState(null);
        }
        // Si profil DB = null mais cache existe → le cache reste affiché

      } else {
        setError('Impossible de créer votre organisation. Veuillez vous reconnecter.');
        setOrganisationId(null);
        setProfilMetierState(null);
      }
    } catch (err) {
      console.error('Erreur récupération organisation:', err);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.user_metadata, user?.email, setProfilMetier]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchOrganisation();
    } else {
      setOrganisationId(null);
      setProfilMetierState(null);
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, fetchOrganisation]);

  /** Sauvegarde en DB (RPC) + état local + cache */
  const updateProfilMetier = useCallback(async (profil: ProfilMetier) => {
    if (!organisationId) return;
    try {
      // RPC SECURITY DEFINER (bypass RLS)
      const { error: rpcError } = await supabase.rpc('set_profil_metier', {
        p_organisation_id: organisationId,
        p_profil: profil,
      });

      if (rpcError) {
        // Fallback UPDATE direct
        const { error: updateError } = await supabase
          .from('organisations')
          .update({ profil_metier: profil })
          .eq('id', organisationId);
        if (updateError) throw updateError;
      }

      // Mettre à jour état + cache immédiatement
      setProfilMetier(profil);
    } catch (err) {
      console.error('Erreur updateProfilMetier:', err);
      throw err;
    }
  }, [organisationId, setProfilMetier]);

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
