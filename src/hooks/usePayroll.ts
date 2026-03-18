import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrganisation } from '../context/OrganisationContext';
import {
  Employe,
  FicheSalaire,
  getEmployes,
  createEmploye,
  updateEmploye,
  deleteEmploye,
  getFichesSalaire,
  createFicheSalaire,
  updateFicheSalaire,
  deleteFicheSalaire,
  genererFichesMois,
} from '../services/payrollService';

const getPeriodeActuelle = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

export const usePayroll = () => {
  const { isAuthenticated } = useAuth();
  const { organisationId } = useOrganisation();

  const [employes, setEmployes] = useState<Employe[]>([]);
  const [fiches, setFiches] = useState<FicheSalaire[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [periodeSelectionnee, setPeriodeSelectionnee] = useState<string>(getPeriodeActuelle());

  // ─── Chargement ───────────────────────────────

  const fetchEmployes = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await getEmployes(organisationId);
      setEmployes(data);
    } catch (err) {
      console.error('Erreur chargement employés:', err);
      setError('Impossible de charger les employés.');
    }
  }, [organisationId]);

  const fetchFiches = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await getFichesSalaire(organisationId, periodeSelectionnee);
      setFiches(data);
    } catch (err) {
      console.error('Erreur chargement fiches:', err);
      setError('Impossible de charger les fiches de salaire.');
    }
  }, [organisationId, periodeSelectionnee]);

  const refreshAll = useCallback(async () => {
    if (!isAuthenticated || !organisationId) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchEmployes(), fetchFiches()]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, organisationId, fetchEmployes, fetchFiches]);

  useEffect(() => {
    if (isAuthenticated && organisationId) {
      refreshAll();
    } else {
      setEmployes([]);
      setFiches([]);
      setLoading(false);
    }
  }, [isAuthenticated, organisationId]);

  // Recharger les fiches quand la période change
  useEffect(() => {
    if (isAuthenticated && organisationId) {
      setLoading(true);
      fetchFiches().finally(() => setLoading(false));
    }
  }, [periodeSelectionnee]);

  // ─── Employés ─────────────────────────────────

  const addEmploye = async (
    employeData: Omit<Employe, 'id' | 'cree_le' | 'mis_a_jour_le'>
  ): Promise<Employe> => {
    if (!organisationId) throw new Error('Organisation non trouvée');
    try {
      const nouvelEmploye = await createEmploye({ ...employeData, organisation_id: organisationId });
      setEmployes(prev => [...prev, nouvelEmploye].sort((a, b) => a.nom.localeCompare(b.nom)));
      return nouvelEmploye;
    } catch (err) {
      console.error('Erreur ajout employé:', err);
      setError('Erreur lors de la création de l\'employé.');
      throw err;
    }
  };

  const editEmploye = async (id: string, updates: Partial<Employe>): Promise<Employe> => {
    try {
      const employe = await updateEmploye(id, updates);
      setEmployes(prev => prev.map(e => (e.id === id ? employe : e)));
      return employe;
    } catch (err) {
      console.error('Erreur modification employé:', err);
      setError('Erreur lors de la modification de l\'employé.');
      throw err;
    }
  };

  const removeEmploye = async (id: string): Promise<void> => {
    try {
      await deleteEmploye(id);
      setEmployes(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Erreur suppression employé:', err);
      setError('Erreur lors de la suppression de l\'employé.');
      throw err;
    }
  };

  // ─── Fiches de salaire ────────────────────────

  const addFiche = async (
    ficheData: Omit<FicheSalaire, 'id' | 'cree_le'>
  ): Promise<FicheSalaire> => {
    if (!organisationId) throw new Error('Organisation non trouvée');
    try {
      const nouvelleFiche = await createFicheSalaire({ ...ficheData, organisation_id: organisationId });
      setFiches(prev => [nouvelleFiche, ...prev]);
      return nouvelleFiche;
    } catch (err) {
      console.error('Erreur ajout fiche:', err);
      setError('Erreur lors de la création de la fiche.');
      throw err;
    }
  };

  const editFiche = async (id: string, updates: Partial<FicheSalaire>): Promise<FicheSalaire> => {
    try {
      const fiche = await updateFicheSalaire(id, updates);
      setFiches(prev => prev.map(f => (f.id === id ? fiche : f)));
      return fiche;
    } catch (err) {
      console.error('Erreur modification fiche:', err);
      setError('Erreur lors de la modification de la fiche.');
      throw err;
    }
  };

  const removeFiche = async (id: string): Promise<void> => {
    try {
      await deleteFicheSalaire(id);
      setFiches(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Erreur suppression fiche:', err);
      setError('Erreur lors de la suppression de la fiche.');
      throw err;
    }
  };

  const genererFichesDuMois = async (periode: string): Promise<FicheSalaire[]> => {
    if (!organisationId) throw new Error('Organisation non trouvée');
    try {
      setLoading(true);
      const fichesGenerees = await genererFichesMois(organisationId, periode, employes);
      setFiches(fichesGenerees);
      return fichesGenerees;
    } catch (err) {
      console.error('Erreur génération fiches:', err);
      setError('Erreur lors de la génération des fiches.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ─── Stats résumé ─────────────────────────────

  const stats = {
    totalMasseSalariale: fiches.reduce((sum, f) => sum + f.salaire_brut, 0),
    totalChargesPatronales: fiches.reduce((sum, f) => sum + f.total_charges_patronales, 0),
    totalCoutEmployeur: fiches.reduce((sum, f) => sum + f.cout_total_employeur, 0),
    nombreEmployesActifs: employes.filter(e => e.actif).length,
    nombreFiches: fiches.length,
  };

  return {
    employes,
    fiches,
    loading,
    error,
    periodeSelectionnee,
    setPeriodeSelectionnee,
    addEmploye,
    editEmploye,
    removeEmploye,
    addFiche,
    editFiche,
    removeFiche,
    genererFichesMois: genererFichesDuMois,
    refreshAll,
    stats,
  };
};
