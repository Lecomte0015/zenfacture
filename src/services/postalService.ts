/**
 * Service d'envoi postal via Swiss Post / ePost
 * Intégration simulée — prête pour connexion API Swiss Post IncaMail / ePost
 *
 * API Swiss Post:
 * - ePost: https://api.epost.ch (nécessite compte professionnel Swiss Post)
 * - IncaMail: https://incamail.com (envoi recommandé électronique)
 *
 * Pour activer en production :
 * 1. Créer un compte Swiss Post Business
 * 2. Obtenir les credentials API IncaMail/ePost
 * 3. Configurer VITE_SWISS_POST_API_KEY dans .env
 * 4. Activer l'Edge Function `send-postal`
 */

import { supabase } from '../lib/supabaseClient';

export type PostalStatut = 'en_preparation' | 'envoye' | 'en_transit' | 'distribue' | 'echec';
export type PostalType = 'lettre_a' | 'lettre_b' | 'recommande' | 'epost';

export interface AdressePostale {
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  pays: string;
}

export interface EnvoiPostal {
  id: string;
  organisation_id: string;
  invoice_id?: string;
  type: PostalType;
  statut: PostalStatut;
  destinataire: AdressePostale;
  expediteur: AdressePostale;
  nombre_pages: number;
  couleur: boolean;
  tracking_number?: string;
  prix_centimes: number;
  reference_externe?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface TarifPostal {
  type: PostalType;
  label: string;
  description: string;
  prix_base_centimes: number;
  delai: string;
  tracking: boolean;
}

// ─── TARIFS (Swiss Post 2025) ──────────────────────────────────────────────────

export const TARIFS_POSTAUX: TarifPostal[] = [
  {
    type: 'epost',
    label: 'ePost (électronique)',
    description: 'Envoi électronique sécurisé via portail ePost Swiss Post',
    prix_base_centimes: 65,
    delai: 'Immédiat',
    tracking: true,
  },
  {
    type: 'lettre_b',
    label: 'Lettre B',
    description: 'Distribution en 2-5 jours ouvrables',
    prix_base_centimes: 140,
    delai: '2-5 jours',
    tracking: false,
  },
  {
    type: 'lettre_a',
    label: 'Lettre A',
    description: 'Distribution le lendemain',
    prix_base_centimes: 180,
    delai: '1 jour',
    tracking: false,
  },
  {
    type: 'recommande',
    label: 'Recommandé',
    description: 'Signature requise à réception, suivi complet',
    prix_base_centimes: 490,
    delai: '1 jour',
    tracking: true,
  },
];

/**
 * Calcule le prix d'un envoi postal selon le type et le nombre de pages
 */
export function calculerPrixPostal(type: PostalType, nombrePages: number, couleur: boolean): number {
  const tarif = TARIFS_POSTAUX.find(t => t.type === type);
  if (!tarif) return 0;

  let prix = tarif.prix_base_centimes;

  // Pages supplémentaires
  if (nombrePages > 1) {
    prix += (nombrePages - 1) * 15; // CHF 0.15 par page supplémentaire
  }

  // Surcharge couleur
  if (couleur) {
    prix += nombrePages * 20; // CHF 0.20 par page couleur
  }

  return prix;
}

// ─── SIMULATION API ───────────────────────────────────────────────────────────

/**
 * Simule l'envoi d'un document par voie postale
 * En production, cette fonction appellerait l'API Swiss Post
 */
export async function envoyerDocumentPostal(
  organisationId: string,
  params: {
    invoice_id?: string;
    type: PostalType;
    destinataire: AdressePostale;
    expediteur: AdressePostale;
    nombre_pages: number;
    couleur: boolean;
    pdf_content?: string; // Base64 PDF
  }
): Promise<EnvoiPostal> {
  const prix = calculerPrixPostal(params.type, params.nombre_pages, params.couleur);

  // En production: appeler l'API Swiss Post / IncaMail ici
  // const response = await fetch('https://api.swisspost.ch/v1/letters', { ... });

  // Simulation : créer l'enregistrement avec tracking simulé
  const trackingNumber = params.type === 'recommande' || params.type === 'epost'
    ? `REP${Date.now().toString().slice(-8).toUpperCase()}`
    : undefined;

  const { data, error } = await supabase
    .from('envois_postaux')
    .insert({
      organisation_id: organisationId,
      invoice_id: params.invoice_id,
      type: params.type,
      statut: 'envoye' as PostalStatut,
      destinataire: params.destinataire,
      expediteur: params.expediteur,
      nombre_pages: params.nombre_pages,
      couleur: params.couleur,
      tracking_number: trackingNumber,
      prix_centimes: prix,
      reference_externe: `SIM-${Date.now()}`,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Récupère l'historique des envois postaux
 */
export async function getEnvoisPostaux(
  organisationId: string,
  invoiceId?: string
): Promise<EnvoiPostal[]> {
  let query = supabase
    .from('envois_postaux')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false });

  if (invoiceId) {
    query = query.eq('invoice_id', invoiceId);
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;
  return data || [];
}

/**
 * Suivi d'un envoi par numéro de tracking
 * En production, appelle l'API Track & Trace Swiss Post
 */
export async function suivreEnvoi(trackingNumber: string): Promise<{
  statut: PostalStatut;
  localisation?: string;
  date_evenement?: string;
}> {
  // Simulation du suivi
  return {
    statut: 'en_transit',
    localisation: 'Centre de tri Zurich',
    date_evenement: new Date().toISOString(),
  };
}

/**
 * Statistiques des envois postaux
 */
export async function getStatsPostaux(organisationId: string): Promise<{
  total: number;
  ce_mois: number;
  cout_total_chf: number;
  par_type: Record<PostalType, number>;
}> {
  const { data, error } = await supabase
    .from('envois_postaux')
    .select('type, prix_centimes, created_at')
    .eq('organisation_id', organisationId);

  if (error) throw error;

  const envois = data || [];
  const maintenant = new Date();
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);

  const ceMois = envois.filter(e => new Date(e.created_at) >= debutMois).length;
  const coutTotal = envois.reduce((sum, e) => sum + e.prix_centimes, 0) / 100;

  const parType = envois.reduce((acc, e) => {
    acc[e.type as PostalType] = (acc[e.type as PostalType] || 0) + 1;
    return acc;
  }, {} as Record<PostalType, number>);

  return {
    total: envois.length,
    ce_mois: ceMois,
    cout_total_chf: coutTotal,
    par_type: parType,
  };
}
