import { useState, useEffect, useCallback } from 'react';
import {
  EbillConfig,
  EbillEnvoi,
  EbillStats,
  EbillEnvoiStatut,
  getConfig,
  saveConfig as saveConfigService,
  activateEbill as activateEbillService,
  deactivateEbill as deactivateEbillService,
  sendEbill as sendEbillService,
  getEnvois as getEnvoisService,
  getEbillStats,
} from '../services/ebillService';
import { useOrganisation } from '../context/OrganisationContext';

interface UseEbillReturn {
  config: EbillConfig | null;
  envois: EbillEnvoi[];
  stats: EbillStats | null;
  loading: boolean;
  error: string | null;
  saveConfig: (participantId: string) => Promise<void>;
  activateEbill: () => Promise<void>;
  deactivateEbill: () => Promise<void>;
  sendEbill: (factureId: string, participantDestinataire: string) => Promise<void>;
  refreshEnvois: (statut?: EbillEnvoiStatut) => Promise<void>;
  refreshConfig: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useEbill = (): UseEbillReturn => {
  const { organisationId } = useOrganisation();
  const [config, setConfig] = useState<EbillConfig | null>(null);
  const [envois, setEnvois] = useState<EbillEnvoi[]>([]);
  const [stats, setStats] = useState<EbillStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger la configuration
  const fetchConfig = useCallback(async (orgId?: string) => {
    try {
      const id = orgId || organisationId;
      if (!id) return;

      const configData = await getConfig(id);
      setConfig(configData);
    } catch (err) {
      console.error('Erreur lors du chargement de la configuration eBill:', err);
      setError('Impossible de charger la configuration eBill');
    }
  }, [organisationId]);

  // Charger les envois
  const fetchEnvois = useCallback(async (statut?: EbillEnvoiStatut, orgId?: string) => {
    try {
      const id = orgId || organisationId;
      if (!id) return;

      const envoisData = await getEnvoisService(id, statut);
      setEnvois(envoisData);
    } catch (err) {
      console.error('Erreur lors du chargement des envois eBill:', err);
      setError('Impossible de charger les envois eBill');
    }
  }, [organisationId]);

  // Charger les statistiques
  const fetchStats = useCallback(async (orgId?: string) => {
    try {
      const id = orgId || organisationId;
      if (!id) return;

      const statsData = await getEbillStats(id);
      setStats(statsData);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques eBill:', err);
      setError('Impossible de charger les statistiques eBill');
    }
  }, [organisationId]);

  // Sauvegarder la configuration
  const saveConfigHandler = useCallback(async (participantId: string) => {
    try {
      setLoading(true);
      setError(null);

      const savedConfig = await saveConfigService(participantId, organisationId || undefined);
      setConfig(savedConfig);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de la configuration:', err);
      setError('Impossible de sauvegarder la configuration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  // Activer eBill
  const activateEbillHandler = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const activatedConfig = await activateEbillService(organisationId || undefined);
      setConfig(activatedConfig);
    } catch (err) {
      console.error('Erreur lors de l\'activation d\'eBill:', err);
      setError('Impossible d\'activer eBill');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  // Désactiver eBill
  const deactivateEbillHandler = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const deactivatedConfig = await deactivateEbillService(organisationId || undefined);
      setConfig(deactivatedConfig);
    } catch (err) {
      console.error('Erreur lors de la désactivation d\'eBill:', err);
      setError('Impossible de désactiver eBill');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  // Envoyer une facture via eBill
  const sendEbillHandler = useCallback(async (
    factureId: string,
    participantDestinataire: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      await sendEbillService(factureId, '', participantDestinataire, organisationId || undefined);

      // Rafraîchir les envois et les stats
      await fetchEnvois(undefined, organisationId || undefined);
      await fetchStats(organisationId || undefined);
    } catch (err) {
      console.error('Erreur lors de l\'envoi eBill:', err);
      setError('Impossible d\'envoyer la facture via eBill');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [organisationId, fetchEnvois, fetchStats]);

  // Rafraîchir les envois
  const refreshEnvois = useCallback(async (statut?: EbillEnvoiStatut) => {
    await fetchEnvois(statut);
  }, [fetchEnvois]);

  // Rafraîchir la configuration
  const refreshConfig = useCallback(async () => {
    await fetchConfig();
  }, [fetchConfig]);

  // Rafraîchir les statistiques
  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  // Charger les données initiales
  useEffect(() => {
    if (!organisationId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        await Promise.all([
          fetchConfig(organisationId),
          fetchEnvois(undefined, organisationId),
          fetchStats(organisationId),
        ]);
      } catch (err) {
        console.error('Erreur lors du chargement des données eBill:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organisationId]);

  return {
    config,
    envois,
    stats,
    loading,
    error,
    saveConfig: saveConfigHandler,
    activateEbill: activateEbillHandler,
    deactivateEbill: deactivateEbillHandler,
    sendEbill: sendEbillHandler,
    refreshEnvois,
    refreshConfig,
    refreshStats,
  };
};
