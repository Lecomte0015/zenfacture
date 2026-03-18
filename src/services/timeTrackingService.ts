import { supabase } from '../lib/supabaseClient';

export interface Projet {
  id: string;
  organisation_id: string;
  client_id: string | null;
  nom: string;
  description: string | null;
  tarif_horaire: number;
  budget_heures: number | null;
  devise: string;
  statut: 'actif' | 'pause' | 'termine' | 'archive';
  date_debut: string | null;
  date_fin: string | null;
  couleur: string;
  cree_le: string;
  mis_a_jour_le: string;
  // Stats calculées
  total_heures?: number;
  heures_facturables?: number;
  ca_potentiel?: number;
}

export interface SessionTemps {
  id: string;
  projet_id: string;
  user_id: string | null;
  description: string | null;
  debut_at: string | null;
  fin_at: string | null;
  duree_minutes: number | null;
  facturable: boolean;
  facture: boolean;
  facture_id: string | null;
  cree_le: string;
}

export interface Tache {
  id: string;
  projet_id: string;
  titre: string;
  description: string | null;
  statut: 'a_faire' | 'en_cours' | 'termine';
  heures_estimees: number | null;
  heures_reelles: number;
  assignee_id: string | null;
  priorite: 'basse' | 'normale' | 'haute' | 'urgente';
  date_echeance: string | null;
  cree_le: string;
}

export interface ProjetStats {
  total_heures: number;
  heures_facturables: number;
  heures_facturees: number;
  ca_potentiel: number;
  ca_facture: number;
  nb_sessions: number;
  nb_taches_terminees: number;
  nb_taches_total: number;
}

export const calculerDureeMinutes = (debut: string, fin: string): number => {
  const debutDate = new Date(debut);
  const finDate = new Date(fin);
  const diffMs = finDate.getTime() - debutDate.getTime();
  return Math.round(diffMs / 60000);
};

// ─── Projets ────────────────────────────────────────────────────────────────

export const getProjets = async (organisationId: string): Promise<Projet[]> => {
  const { data, error } = await supabase
    .from('projets')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('cree_le', { ascending: false });

  if (error) {
    console.error('Erreur récupération projets:', error);
    throw error;
  }

  const projets = data || [];

  // Calculer les stats pour chaque projet
  const projetsAvecStats = await Promise.all(
    projets.map(async (projet) => {
      try {
        const stats = await getProjetStats(projet.id);
        return {
          ...projet,
          total_heures: stats.total_heures,
          heures_facturables: stats.heures_facturables,
          ca_potentiel: stats.ca_potentiel,
        };
      } catch {
        return {
          ...projet,
          total_heures: 0,
          heures_facturables: 0,
          ca_potentiel: 0,
        };
      }
    })
  );

  return projetsAvecStats;
};

export const createProjet = async (
  data: Omit<Projet, 'id' | 'cree_le' | 'mis_a_jour_le' | 'total_heures' | 'heures_facturables' | 'ca_potentiel'>
): Promise<Projet> => {
  const { data: result, error } = await supabase
    .from('projets')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Erreur création projet:', error);
    throw error;
  }

  return result;
};

export const updateProjet = async (id: string, updates: Partial<Projet>): Promise<Projet> => {
  const { id: _, cree_le, mis_a_jour_le, total_heures, heures_facturables, ca_potentiel, ...safeUpdates } = updates;

  const { data, error } = await supabase
    .from('projets')
    .update({ ...safeUpdates, mis_a_jour_le: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour projet:', error);
    throw error;
  }

  return data;
};

export const deleteProjet = async (id: string): Promise<void> => {
  const { error } = await supabase.from('projets').delete().eq('id', id);

  if (error) {
    console.error('Erreur suppression projet:', error);
    throw error;
  }
};

// ─── Sessions de temps ───────────────────────────────────────────────────────

export const getSessions = async (projetId: string): Promise<SessionTemps[]> => {
  const { data, error } = await supabase
    .from('sessions_temps')
    .select('*')
    .eq('projet_id', projetId)
    .order('debut_at', { ascending: false });

  if (error) {
    console.error('Erreur récupération sessions:', error);
    throw error;
  }

  return data || [];
};

export const createSession = async (
  data: Omit<SessionTemps, 'id' | 'cree_le'>
): Promise<SessionTemps> => {
  const { data: result, error } = await supabase
    .from('sessions_temps')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Erreur création session:', error);
    throw error;
  }

  return result;
};

export const updateSession = async (id: string, updates: Partial<SessionTemps>): Promise<SessionTemps> => {
  const { id: _, cree_le, ...safeUpdates } = updates;

  const { data, error } = await supabase
    .from('sessions_temps')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour session:', error);
    throw error;
  }

  return data;
};

export const deleteSession = async (id: string): Promise<void> => {
  const { error } = await supabase.from('sessions_temps').delete().eq('id', id);

  if (error) {
    console.error('Erreur suppression session:', error);
    throw error;
  }
};

export const startTimer = async (
  projetId: string,
  userId: string,
  description?: string
): Promise<SessionTemps> => {
  const { data: result, error } = await supabase
    .from('sessions_temps')
    .insert([
      {
        projet_id: projetId,
        user_id: userId,
        description: description || null,
        debut_at: new Date().toISOString(),
        fin_at: null,
        duree_minutes: null,
        facturable: true,
        facture: false,
        facture_id: null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Erreur démarrage timer:', error);
    throw error;
  }

  return result;
};

export const stopTimer = async (sessionId: string): Promise<SessionTemps> => {
  // Récupérer la session en cours
  const { data: session, error: fetchError } = await supabase
    .from('sessions_temps')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (fetchError || !session) {
    throw new Error('Session non trouvée');
  }

  const finAt = new Date().toISOString();
  const dureeMinutes = session.debut_at
    ? calculerDureeMinutes(session.debut_at, finAt)
    : 0;

  const { data, error } = await supabase
    .from('sessions_temps')
    .update({
      fin_at: finAt,
      duree_minutes: dureeMinutes,
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('Erreur arrêt timer:', error);
    throw error;
  }

  return data;
};

export const getActiveTimer = async (organisationId: string): Promise<SessionTemps | null> => {
  // Récupérer les projets de l'organisation
  const { data: projets, error: projetsError } = await supabase
    .from('projets')
    .select('id')
    .eq('organisation_id', organisationId);

  if (projetsError || !projets || projets.length === 0) return null;

  const projetIds = projets.map((p) => p.id);

  const { data, error } = await supabase
    .from('sessions_temps')
    .select('*')
    .in('projet_id', projetIds)
    .is('fin_at', null)
    .not('debut_at', 'is', null)
    .order('debut_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Erreur récupération timer actif:', error);
    return null;
  }

  return data;
};

// ─── Tâches ──────────────────────────────────────────────────────────────────

export const getTaches = async (projetId: string): Promise<Tache[]> => {
  const { data, error } = await supabase
    .from('taches')
    .select('*')
    .eq('projet_id', projetId)
    .order('cree_le', { ascending: true });

  if (error) {
    console.error('Erreur récupération tâches:', error);
    throw error;
  }

  return data || [];
};

export const createTache = async (
  data: Omit<Tache, 'id' | 'cree_le'>
): Promise<Tache> => {
  const { data: result, error } = await supabase
    .from('taches')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Erreur création tâche:', error);
    throw error;
  }

  return result;
};

export const updateTache = async (id: string, updates: Partial<Tache>): Promise<Tache> => {
  const { id: _, cree_le, ...safeUpdates } = updates;

  const { data, error } = await supabase
    .from('taches')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour tâche:', error);
    throw error;
  }

  return data;
};

export const deleteTache = async (id: string): Promise<void> => {
  const { error } = await supabase.from('taches').delete().eq('id', id);

  if (error) {
    console.error('Erreur suppression tâche:', error);
    throw error;
  }
};

// ─── Stats projet ─────────────────────────────────────────────────────────────

export const getProjetStats = async (projetId: string): Promise<ProjetStats> => {
  const [sessionsRes, tachesRes, projetRes] = await Promise.all([
    supabase.from('sessions_temps').select('*').eq('projet_id', projetId),
    supabase.from('taches').select('*').eq('projet_id', projetId),
    supabase.from('projets').select('tarif_horaire').eq('id', projetId).single(),
  ]);

  const sessions: SessionTemps[] = sessionsRes.data || [];
  const taches: Tache[] = tachesRes.data || [];
  const tarifHoraire: number = projetRes.data?.tarif_horaire || 0;

  const sessionTerminees = sessions.filter((s) => s.duree_minutes != null && s.fin_at != null);

  const totalMinutes = sessionTerminees.reduce((acc, s) => acc + (s.duree_minutes || 0), 0);
  const minutesFacturables = sessionTerminees
    .filter((s) => s.facturable)
    .reduce((acc, s) => acc + (s.duree_minutes || 0), 0);
  const minutesFacturees = sessionTerminees
    .filter((s) => s.facture)
    .reduce((acc, s) => acc + (s.duree_minutes || 0), 0);

  const totalHeures = totalMinutes / 60;
  const heuresFacturables = minutesFacturables / 60;
  const heuresFacturees = minutesFacturees / 60;

  return {
    total_heures: Math.round(totalHeures * 100) / 100,
    heures_facturables: Math.round(heuresFacturables * 100) / 100,
    heures_facturees: Math.round(heuresFacturees * 100) / 100,
    ca_potentiel: Math.round(heuresFacturables * tarifHoraire * 100) / 100,
    ca_facture: Math.round(heuresFacturees * tarifHoraire * 100) / 100,
    nb_sessions: sessions.length,
    nb_taches_terminees: taches.filter((t) => t.statut === 'termine').length,
    nb_taches_total: taches.length,
  };
};
