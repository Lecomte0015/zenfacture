import { supabase } from '../lib/supabaseClient';
import { getOrganisationId } from '../lib/getOrganisationId';

// Types pour la configuration eBill
export interface EbillConfig {
  id: string;
  organisation_id: string;
  participant_id: string;
  statut: 'inactif' | 'en_cours' | 'actif';
  actif: boolean;
  cree_le: string;
}

// Types pour les envois eBill
export type EbillEnvoiStatut = 'en_attente' | 'envoye' | 'accepte' | 'refuse' | 'erreur';

export interface EbillEnvoi {
  id: string;
  organisation_id: string;
  facture_id: string;
  participant_destinataire: string;
  statut: EbillEnvoiStatut;
  date_envoi: string;
  date_acceptation?: string;
  reference_ebill?: string;
  cree_le: string;
}

// Statistiques eBill
export interface EbillStats {
  total: number;
  en_attente: number;
  envoye: number;
  accepte: number;
  refuse: number;
  erreur: number;
}

// === Configuration eBill ===

export const getConfig = async (organisationId?: string): Promise<EbillConfig | null> => {
  const orgId = organisationId || await getOrganisationId();

  const { data, error } = await supabase
    .from('ebill_config')
    .select('*')
    .eq('organisation_id', orgId)
    .maybeSingle();

  if (error) {
    console.error('Erreur lors de la récupération de la configuration eBill:', error);
    throw error;
  }

  return data;
};

export const saveConfig = async (
  participantId: string,
  organisationId?: string
): Promise<EbillConfig> => {
  const orgId = organisationId || await getOrganisationId();

  // Vérifier si une configuration existe déjà
  const existing = await getConfig(orgId);

  if (existing) {
    // Mise à jour
    const { data, error } = await supabase
      .from('ebill_config')
      .update({
        participant_id: participantId,
      })
      .eq('organisation_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de la configuration eBill:', error);
      throw error;
    }

    return data;
  } else {
    // Création
    const { data, error } = await supabase
      .from('ebill_config')
      .insert([{
        organisation_id: orgId,
        participant_id: participantId,
        statut: 'inactif',
        actif: false,
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la configuration eBill:', error);
      throw error;
    }

    return data;
  }
};

export const activateEbill = async (organisationId?: string): Promise<EbillConfig> => {
  const orgId = organisationId || await getOrganisationId();

  const { data, error } = await supabase
    .from('ebill_config')
    .update({
      actif: true,
      statut: 'actif',
    })
    .eq('organisation_id', orgId)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de l\'activation d\'eBill:', error);
    throw error;
  }

  return data;
};

export const deactivateEbill = async (organisationId?: string): Promise<EbillConfig> => {
  const orgId = organisationId || await getOrganisationId();

  const { data, error } = await supabase
    .from('ebill_config')
    .update({
      actif: false,
      statut: 'inactif',
    })
    .eq('organisation_id', orgId)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la désactivation d\'eBill:', error);
    throw error;
  }

  return data;
};

// === Envois eBill ===

export const sendEbill = async (
  factureId: string,
  _factureNumero: string,
  destinataire: string,
  organisationId?: string
): Promise<EbillEnvoi> => {
  const orgId = organisationId || await getOrganisationId();

  // Note: L'intégration réelle avec l'API SIX sera implémentée ultérieurement
  // Pour l'instant, on crée simplement un enregistrement avec le statut "en_attente"

  const { data, error } = await supabase
    .from('ebill_envois')
    .insert([{
      organisation_id: orgId,
      facture_id: factureId,
      participant_destinataire: destinataire,
      statut: 'en_attente',
      date_envoi: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de l\'envoi eBill:', error);
    throw error;
  }

  return data;
};

export const getEnvois = async (
  organisationId?: string,
  statut?: EbillEnvoiStatut
): Promise<EbillEnvoi[]> => {
  const orgId = organisationId || await getOrganisationId();

  let query = supabase
    .from('ebill_envois')
    .select('*')
    .eq('organisation_id', orgId)
    .order('date_envoi', { ascending: false });

  if (statut) {
    query = query.eq('statut', statut);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erreur lors de la récupération des envois eBill:', error);
    throw error;
  }

  return data || [];
};

export const updateEnvoiStatus = async (
  envoiId: string,
  statut: EbillEnvoiStatut,
  _messageErreur?: string
): Promise<EbillEnvoi> => {
  const updateData: any = {
    statut,
  };

  if (statut === 'accepte') {
    updateData.date_acceptation = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('ebill_envois')
    .update(updateData)
    .eq('id', envoiId)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour du statut d\'envoi eBill:', error);
    throw error;
  }

  return data;
};

// === Statistiques ===

export const getEbillStats = async (organisationId: string): Promise<EbillStats> => {
  const { data, error } = await supabase
    .from('ebill_envois')
    .select('statut')
    .eq('organisation_id', organisationId);

  if (error) {
    console.error('Erreur lors de la récupération des statistiques eBill:', error);
    throw error;
  }

  const stats: EbillStats = {
    total: data.length,
    en_attente: 0,
    envoye: 0,
    accepte: 0,
    refuse: 0,
    erreur: 0,
  };

  data.forEach((envoi) => {
    if (envoi.statut in stats) {
      stats[envoi.statut as keyof Omit<EbillStats, 'total'>]++;
    }
  });

  return stats;
};
