import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrganisation } from '../context/OrganisationContext';
import {
  Projet,
  SessionTemps,
  Tache,
  getProjets,
  createProjet,
  updateProjet,
  deleteProjet,
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  startTimer as startTimerService,
  stopTimer as stopTimerService,
  getActiveTimer,
  getTaches,
  createTache,
  updateTache,
  deleteTache,
} from '../services/timeTrackingService';

export const useTimeTracking = () => {
  const { isAuthenticated, user } = useAuth();
  const { organisationId } = useOrganisation();

  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTimer, setActiveTimer] = useState<SessionTemps | null>(null);
  const [timerDuration, setTimerDuration] = useState<number>(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mettre à jour la durée du timer chaque seconde
  useEffect(() => {
    if (activeTimer && activeTimer.debut_at) {
      const updateDuration = () => {
        const debutDate = new Date(activeTimer.debut_at!);
        const now = new Date();
        const diffSeconds = Math.floor((now.getTime() - debutDate.getTime()) / 1000);
        setTimerDuration(diffSeconds > 0 ? diffSeconds : 0);
      };

      updateDuration();
      intervalRef.current = setInterval(updateDuration, 1000);
    } else {
      setTimerDuration(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeTimer]);

  const fetchProjets = useCallback(async () => {
    if (!isAuthenticated || !organisationId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getProjets(organisationId);
      setProjets(data);
    } catch (err) {
      console.error('Erreur chargement projets:', err);
      setError('Impossible de charger les projets.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, organisationId]);

  const fetchActiveTimer = useCallback(async () => {
    if (!isAuthenticated || !organisationId) return;

    try {
      const timer = await getActiveTimer(organisationId);
      setActiveTimer(timer);
    } catch (err) {
      console.error('Erreur récupération timer actif:', err);
    }
  }, [isAuthenticated, organisationId]);

  useEffect(() => {
    if (isAuthenticated && organisationId) {
      fetchProjets();
      fetchActiveTimer();
    } else {
      setProjets([]);
      setActiveTimer(null);
      setLoading(false);
    }
  }, [isAuthenticated, organisationId]);

  // ─── Projets ─────────────────────────────────────────────────────────────

  const addProjet = async (
    data: Omit<Projet, 'id' | 'cree_le' | 'mis_a_jour_le' | 'total_heures' | 'heures_facturables' | 'ca_potentiel'>
  ) => {
    if (!organisationId) throw new Error('Organisation non trouvée');

    try {
      const nouveau = await createProjet({ ...data, organisation_id: organisationId });
      setProjets((prev) => [{ ...nouveau, total_heures: 0, heures_facturables: 0, ca_potentiel: 0 }, ...prev]);
      return nouveau;
    } catch (err) {
      console.error('Erreur création projet:', err);
      setError('Erreur lors de la création du projet');
      throw err;
    }
  };

  const editProjet = async (id: string, updates: Partial<Projet>) => {
    try {
      const updated = await updateProjet(id, updates);
      setProjets((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      return updated;
    } catch (err) {
      console.error('Erreur mise à jour projet:', err);
      setError('Erreur lors de la mise à jour du projet');
      throw err;
    }
  };

  const removeProjet = async (id: string) => {
    try {
      await deleteProjet(id);
      setProjets((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Erreur suppression projet:', err);
      setError('Erreur lors de la suppression du projet');
      throw err;
    }
  };

  // ─── Timer ────────────────────────────────────────────────────────────────

  const startTimer = async (projetId: string, description?: string) => {
    if (!user?.id) throw new Error('Utilisateur non connecté');

    // Arrêter le timer actif s'il existe
    if (activeTimer) {
      await stopTimerService(activeTimer.id);
    }

    try {
      const session = await startTimerService(projetId, user.id, description);
      setActiveTimer(session);
      return session;
    } catch (err) {
      console.error('Erreur démarrage timer:', err);
      setError('Erreur lors du démarrage du timer');
      throw err;
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;

    try {
      const session = await stopTimerService(activeTimer.id);
      setActiveTimer(null);
      setTimerDuration(0);
      return session;
    } catch (err) {
      console.error('Erreur arrêt timer:', err);
      setError('Erreur lors de l\'arrêt du timer');
      throw err;
    }
  };

  // ─── Sessions ─────────────────────────────────────────────────────────────

  const getSessionsForProjet = async (projetId: string): Promise<SessionTemps[]> => {
    try {
      return await getSessions(projetId);
    } catch (err) {
      console.error('Erreur récupération sessions:', err);
      throw err;
    }
  };

  const addSession = async (data: Omit<SessionTemps, 'id' | 'cree_le'>) => {
    try {
      return await createSession(data);
    } catch (err) {
      console.error('Erreur création session:', err);
      throw err;
    }
  };

  const editSession = async (id: string, updates: Partial<SessionTemps>) => {
    try {
      return await updateSession(id, updates);
    } catch (err) {
      console.error('Erreur mise à jour session:', err);
      throw err;
    }
  };

  const removeSession = async (id: string) => {
    try {
      await deleteSession(id);
    } catch (err) {
      console.error('Erreur suppression session:', err);
      throw err;
    }
  };

  // ─── Tâches ───────────────────────────────────────────────────────────────

  const getTachesForProjet = async (projetId: string): Promise<Tache[]> => {
    try {
      return await getTaches(projetId);
    } catch (err) {
      console.error('Erreur récupération tâches:', err);
      throw err;
    }
  };

  const addTache = async (data: Omit<Tache, 'id' | 'cree_le'>) => {
    try {
      return await createTache(data);
    } catch (err) {
      console.error('Erreur création tâche:', err);
      throw err;
    }
  };

  const editTache = async (id: string, updates: Partial<Tache>) => {
    try {
      return await updateTache(id, updates);
    } catch (err) {
      console.error('Erreur mise à jour tâche:', err);
      throw err;
    }
  };

  const removeTache = async (id: string) => {
    try {
      await deleteTache(id);
    } catch (err) {
      console.error('Erreur suppression tâche:', err);
      throw err;
    }
  };

  return {
    projets,
    loading,
    error,
    activeTimer,
    timerDuration,
    addProjet,
    editProjet,
    removeProjet,
    startTimer,
    stopTimer,
    getSessions: getSessionsForProjet,
    addSession,
    editSession,
    removeSession,
    getTaches: getTachesForProjet,
    addTache,
    editTache,
    removeTache,
    refreshProjets: fetchProjets,
  };
};
