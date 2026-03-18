import { useState, useEffect, useCallback } from 'react';
import {
  CompteComptable,
  ExerciceComptable,
  EcritureAvecComptes,
  Bilan,
  CompteResultat,
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getExercices,
  createExercice,
  closeExercice,
  getEcritures,
  createEcriture,
  updateEcriture,
  deleteEcriture,
  getGrandLivre,
  getBilan,
  getCompteResultat,
  GetEcrituresFilters,
  LigneGrandLivre,
} from '@/services/comptabiliteService';
import { useOrganisation } from '@/context/OrganisationContext';

export const useComptabilite = () => {
  const { organisationId } = useOrganisation();
  const [planComptable, setPlanComptable] = useState<CompteComptable[]>([]);
  const [ecritures, setEcritures] = useState<EcritureAvecComptes[]>([]);
  const [exercices, setExercices] = useState<ExerciceComptable[]>([]);

  const [loadingComptes, setLoadingComptes] = useState(true);
  const [loadingEcritures, setLoadingEcritures] = useState(true);
  const [loadingExercices, setLoadingExercices] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger le plan comptable
  const fetchPlanComptable = useCallback(async () => {
    if (!organisationId) return;

    try {
      setLoadingComptes(true);
      setError(null);
      const comptes = await getAccounts(organisationId);
      setPlanComptable(comptes);
    } catch (err) {
      console.error('Erreur lors du chargement du plan comptable:', err);
      setError('Impossible de charger le plan comptable');
    } finally {
      setLoadingComptes(false);
    }
  }, [organisationId]);

  // Charger les exercices
  const fetchExercices = useCallback(async () => {
    if (!organisationId) return;

    try {
      setLoadingExercices(true);
      setError(null);
      const exos = await getExercices(organisationId);
      setExercices(exos);
    } catch (err) {
      console.error('Erreur lors du chargement des exercices:', err);
      setError('Impossible de charger les exercices');
    } finally {
      setLoadingExercices(false);
    }
  }, [organisationId]);

  // Charger les écritures
  const fetchEcritures = useCallback(async (filters?: GetEcrituresFilters) => {
    if (!organisationId) return;

    try {
      setLoadingEcritures(true);
      setError(null);
      const ecr = await getEcritures(filters, organisationId);
      setEcritures(ecr);
    } catch (err) {
      console.error('Erreur lors du chargement des écritures:', err);
      setError('Impossible de charger les écritures');
    } finally {
      setLoadingEcritures(false);
    }
  }, [organisationId]);

  // Charger les données initiales
  useEffect(() => {
    if (organisationId) {
      fetchPlanComptable();
      fetchExercices();
      fetchEcritures();
    }
  }, [organisationId, fetchPlanComptable, fetchExercices, fetchEcritures]);

  // ===== CRUD PLAN COMPTABLE =====

  const addCompte = async (compte: Omit<CompteComptable, 'id' | 'organisation_id' | 'cree_le'>) => {
    try {
      setError(null);
      const newCompte = await createAccount(compte);
      setPlanComptable((prev) => [...prev, newCompte].sort((a, b) => a.numero.localeCompare(b.numero)));
      return newCompte;
    } catch (err: any) {
      console.error('Erreur lors de la création du compte:', err);
      setError(err.message || 'Erreur lors de la création du compte');
      throw err;
    }
  };

  const editCompte = async (id: string, updates: Partial<CompteComptable>) => {
    try {
      setError(null);
      const updatedCompte = await updateAccount(id, updates);
      setPlanComptable((prev) =>
        prev.map((c) => (c.id === id ? updatedCompte : c)).sort((a, b) => a.numero.localeCompare(b.numero))
      );
      return updatedCompte;
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du compte:', err);
      setError(err.message || 'Erreur lors de la mise à jour du compte');
      throw err;
    }
  };

  const removeCompte = async (id: string) => {
    try {
      setError(null);
      await deleteAccount(id);
      setPlanComptable((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      console.error('Erreur lors de la suppression du compte:', err);
      setError(err.message || 'Erreur lors de la suppression du compte');
      throw err;
    }
  };

  // ===== CRUD EXERCICES =====

  const addExercice = async (exercice: Omit<ExerciceComptable, 'id' | 'organisation_id' | 'cree_le'>) => {
    try {
      setError(null);
      const newExercice = await createExercice(exercice);
      setExercices((prev) => [newExercice, ...prev]);
      return newExercice;
    } catch (err: any) {
      console.error('Erreur lors de la création de l\'exercice:', err);
      setError(err.message || 'Erreur lors de la création de l\'exercice');
      throw err;
    }
  };

  const cloreExercice = async (id: string) => {
    try {
      setError(null);
      const closedExercice = await closeExercice(id);
      setExercices((prev) => prev.map((e) => (e.id === id ? closedExercice : e)));
      return closedExercice;
    } catch (err: any) {
      console.error('Erreur lors de la clôture de l\'exercice:', err);
      setError(err.message || 'Erreur lors de la clôture de l\'exercice');
      throw err;
    }
  };

  // ===== CRUD ÉCRITURES =====

  const addEcriture = async (ecriture: any) => {
    try {
      setError(null);
      const newEcriture = await createEcriture(ecriture);
      setEcritures((prev) => [newEcriture as any, ...prev]);
      return newEcriture;
    } catch (err: any) {
      console.error('Erreur lors de la création de l\'écriture:', err);
      setError(err.message || 'Erreur lors de la création de l\'écriture');
      throw err;
    }
  };

  const editEcriture = async (id: string, updates: any) => {
    try {
      setError(null);
      const updatedEcriture = await updateEcriture(id, updates);
      setEcritures((prev) => prev.map((e) => (e.id === id ? updatedEcriture as any : e)));
      return updatedEcriture;
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour de l\'écriture:', err);
      setError(err.message || 'Erreur lors de la mise à jour de l\'écriture');
      throw err;
    }
  };

  const removeEcriture = async (id: string) => {
    try {
      setError(null);
      await deleteEcriture(id);
      setEcritures((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      console.error('Erreur lors de la suppression de l\'écriture:', err);
      setError(err.message || 'Erreur lors de la suppression de l\'écriture');
      throw err;
    }
  };

  // ===== RAPPORTS =====

  const fetchGrandLivre = async (
    compteId: string,
    dateDebut: string,
    dateFin: string
  ): Promise<LigneGrandLivre[]> => {
    if (!organisationId) {
      throw new Error('Organisation non trouvée');
    }

    try {
      setError(null);
      return await getGrandLivre(organisationId, compteId, dateDebut, dateFin);
    } catch (err: any) {
      console.error('Erreur lors du chargement du grand livre:', err);
      setError(err.message || 'Erreur lors du chargement du grand livre');
      throw err;
    }
  };

  const fetchBilan = async (dateFin: string): Promise<Bilan> => {
    if (!organisationId) {
      throw new Error('Organisation non trouvée');
    }

    try {
      setError(null);
      return await getBilan(organisationId, dateFin);
    } catch (err: any) {
      console.error('Erreur lors du chargement du bilan:', err);
      setError(err.message || 'Erreur lors du chargement du bilan');
      throw err;
    }
  };

  const fetchCompteResultat = async (dateDebut: string, dateFin: string): Promise<CompteResultat> => {
    if (!organisationId) {
      throw new Error('Organisation non trouvée');
    }

    try {
      setError(null);
      return await getCompteResultat(organisationId, dateDebut, dateFin);
    } catch (err: any) {
      console.error('Erreur lors du chargement du compte de résultat:', err);
      setError(err.message || 'Erreur lors du chargement du compte de résultat');
      throw err;
    }
  };

  return {
    // État
    planComptable,
    ecritures,
    exercices,
    organisationId,

    // États de chargement
    loadingComptes,
    loadingEcritures,
    loadingExercices,
    loading: loadingComptes || loadingEcritures || loadingExercices,
    error,

    // Fonctions de rafraîchissement
    refreshPlanComptable: fetchPlanComptable,
    refreshEcritures: fetchEcritures,
    refreshExercices: fetchExercices,

    // CRUD Plan comptable
    addCompte,
    editCompte,
    removeCompte,

    // CRUD Exercices
    addExercice,
    cloreExercice,

    // CRUD Écritures
    addEcriture,
    editEcriture,
    removeEcriture,

    // Rapports
    fetchGrandLivre,
    fetchBilan,
    fetchCompteResultat,
  };
};
