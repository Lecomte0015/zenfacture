/**
 * Service CRM Pipeline — ZenFacture (Phase 8.2)
 *
 * Pipeline commercial Kanban avec 6 stades :
 * prospect → contact → devis_envoye → negociation → gagne | perdu
 *
 * Fonctionnalités :
 * - CRUD opportunités
 * - Déplacement entre stades
 * - Log d'activités par opportunité
 * - Conversion en devis
 * - KPI (CA potentiel, CA gagné, taux conversion, durée moyenne)
 */

import { supabase } from '../lib/supabaseClient';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type StadeCRM = 'prospect' | 'contact' | 'devis_envoye' | 'negociation' | 'gagne' | 'perdu';

export interface CRMOpportunite {
  id: string;
  organisation_id: string;
  nom: string;
  client_id?: string;
  client_nom?: string;
  client_email?: string;
  valeur: number;
  devise: string;
  stade: StadeCRM;
  probabilite: number;
  date_fermeture?: string;
  description?: string;
  raison_perte?: string;
  devis_id?: string;
  ordre: number;
  created_at: string;
  updated_at: string;
}

export interface CRMActivite {
  id: string;
  opportunite_id: string;
  type: 'appel' | 'email' | 'reunion' | 'note' | 'devis' | 'relance' | 'autre';
  titre: string;
  description?: string;
  date_activite: string;
  created_at: string;
}

export interface CRMStats {
  ca_total_potentiel: number;
  ca_gagne: number;
  ca_perdu: number;
  taux_conversion: number;
  nb_opportunites: number;
  nb_gagnees: number;
  nb_perdues: number;
  duree_moyenne_jours: number;
}

// ─── CONFIG PIPELINE ──────────────────────────────────────────────────────────

export const STADES_CONFIG: Record<StadeCRM, {
  label: string;
  couleur: string;
  bg: string;
  border: string;
  probabilite_defaut: number;
  emoji: string;
}> = {
  prospect: {
    label: 'Prospect',
    couleur: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    probabilite_defaut: 10,
    emoji: '👋',
  },
  contact: {
    label: 'Contact établi',
    couleur: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    probabilite_defaut: 25,
    emoji: '📞',
  },
  devis_envoye: {
    label: 'Devis envoyé',
    couleur: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    probabilite_defaut: 50,
    emoji: '📄',
  },
  negociation: {
    label: 'Négociation',
    couleur: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    probabilite_defaut: 75,
    emoji: '🤝',
  },
  gagne: {
    label: 'Gagné',
    couleur: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    probabilite_defaut: 100,
    emoji: '🏆',
  },
  perdu: {
    label: 'Perdu',
    couleur: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    probabilite_defaut: 0,
    emoji: '❌',
  },
};

export const STADES_ORDRE: StadeCRM[] = ['prospect', 'contact', 'devis_envoye', 'negociation', 'gagne', 'perdu'];

// ─── CRUD OPPORTUNITÉS ────────────────────────────────────────────────────────

export async function getOpportunites(organisationId: string): Promise<CRMOpportunite[]> {
  const { data, error } = await supabase
    .from('crm_opportunites')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('ordre', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function creerOpportunite(
  organisationId: string,
  payload: {
    nom: string;
    client_nom?: string;
    client_email?: string;
    valeur?: number;
    devise?: string;
    stade?: StadeCRM;
    probabilite?: number;
    date_fermeture?: string;
    description?: string;
  }
): Promise<CRMOpportunite> {
  const stade = payload.stade || 'prospect';
  const { data, error } = await supabase
    .from('crm_opportunites')
    .insert({
      organisation_id: organisationId,
      nom: payload.nom,
      client_nom: payload.client_nom,
      client_email: payload.client_email,
      valeur: payload.valeur ?? 0,
      devise: payload.devise ?? 'CHF',
      stade,
      probabilite: payload.probabilite ?? STADES_CONFIG[stade].probabilite_defaut,
      date_fermeture: payload.date_fermeture,
      description: payload.description,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function mettreAJourOpportunite(
  id: string,
  updates: Partial<CRMOpportunite>
): Promise<CRMOpportunite> {
  const { data, error } = await supabase
    .from('crm_opportunites')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function changerStade(
  id: string,
  nouveauStade: StadeCRM,
  raison_perte?: string
): Promise<CRMOpportunite> {
  const cfg = STADES_CONFIG[nouveauStade];
  const updates: Partial<CRMOpportunite> = {
    stade: nouveauStade,
    probabilite: cfg.probabilite_defaut,
  };
  if (nouveauStade === 'perdu' && raison_perte) {
    updates.raison_perte = raison_perte;
  }
  return mettreAJourOpportunite(id, updates);
}

export async function supprimerOpportunite(id: string): Promise<void> {
  const { error } = await supabase.from('crm_opportunites').delete().eq('id', id);
  if (error) throw error;
}

// ─── CONVERSION EN DEVIS ──────────────────────────────────────────────────────

export async function convertirEnDevis(
  organisationId: string,
  opportunite: CRMOpportunite
): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  const { data: devis, error } = await supabase
    .from('devis')
    .insert({
      organisation_id: organisationId,
      numero: `DEV-CRM-${Date.now().toString().slice(-6)}`,
      client_nom: opportunite.client_nom || opportunite.nom,
      client_email: opportunite.client_email,
      date: today,
      date_validite: expiry.toISOString().split('T')[0],
      statut: 'brouillon',
      total_ht: opportunite.valeur,
      total_tva: 0,
      total_ttc: opportunite.valeur,
      notes: `Issu de l'opportunité CRM : ${opportunite.nom}`,
    })
    .select('id')
    .single();

  if (error) throw error;

  // Lier le devis à l'opportunité et changer le stade
  await supabase
    .from('crm_opportunites')
    .update({ devis_id: devis.id, stade: 'devis_envoye', probabilite: 50 })
    .eq('id', opportunite.id);

  // Log d'activité
  await ajouterActivite(opportunite.id, {
    type: 'devis',
    titre: 'Devis créé depuis l\'opportunité',
    description: `Devis N° DEV-CRM-${Date.now().toString().slice(-6)} créé automatiquement`,
  });

  return devis.id;
}

// ─── ACTIVITÉS ────────────────────────────────────────────────────────────────

export async function getActivites(opportuniteId: string): Promise<CRMActivite[]> {
  const { data, error } = await supabase
    .from('crm_activites')
    .select('*')
    .eq('opportunite_id', opportuniteId)
    .order('date_activite', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function ajouterActivite(
  opportuniteId: string,
  payload: { type: CRMActivite['type']; titre: string; description?: string }
): Promise<CRMActivite> {
  const { data, error } = await supabase
    .from('crm_activites')
    .insert({
      opportunite_id: opportuniteId,
      type: payload.type,
      titre: payload.titre,
      description: payload.description,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── STATS ────────────────────────────────────────────────────────────────────

export async function getStatsCRM(organisationId: string): Promise<CRMStats> {
  const { data: opps } = await supabase
    .from('crm_opportunites')
    .select('valeur, stade, created_at, updated_at')
    .eq('organisation_id', organisationId);

  const all = opps || [];
  const actives = all.filter(o => !['gagne', 'perdu'].includes(o.stade));
  const gagnees = all.filter(o => o.stade === 'gagne');
  const perdues = all.filter(o => o.stade === 'perdu');

  const ca_potentiel = actives.reduce((s, o) => s + (o.valeur || 0), 0);
  const ca_gagne = gagnees.reduce((s, o) => s + (o.valeur || 0), 0);
  const ca_perdu = perdues.reduce((s, o) => s + (o.valeur || 0), 0);

  const closes = gagnees.length + perdues.length;
  const taux = closes > 0 ? Math.round((gagnees.length / closes) * 100) : 0;

  // Durée moyenne de closing
  const durees = gagnees.map(o => {
    const debut = new Date(o.created_at).getTime();
    const fin = new Date(o.updated_at).getTime();
    return (fin - debut) / (1000 * 60 * 60 * 24);
  });
  const duree_moy = durees.length > 0
    ? Math.round(durees.reduce((s, d) => s + d, 0) / durees.length)
    : 0;

  return {
    ca_total_potentiel: ca_potentiel,
    ca_gagne,
    ca_perdu,
    taux_conversion: taux,
    nb_opportunites: all.length,
    nb_gagnees: gagnees.length,
    nb_perdues: perdues.length,
    duree_moyenne_jours: duree_moy,
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function getOpportunitesByStade(
  opportunites: CRMOpportunite[]
): Record<StadeCRM, CRMOpportunite[]> {
  const result = {} as Record<StadeCRM, CRMOpportunite[]>;
  for (const stade of STADES_ORDRE) {
    result[stade] = opportunites.filter(o => o.stade === stade);
  }
  return result;
}

export const TYPES_ACTIVITE: Record<CRMActivite['type'], { label: string; emoji: string }> = {
  appel:   { label: 'Appel téléphonique', emoji: '📞' },
  email:   { label: 'Email envoyé', emoji: '✉️' },
  reunion: { label: 'Réunion', emoji: '🤝' },
  note:    { label: 'Note interne', emoji: '📝' },
  devis:   { label: 'Devis', emoji: '📄' },
  relance: { label: 'Relance', emoji: '🔔' },
  autre:   { label: 'Autre', emoji: '•' },
};
