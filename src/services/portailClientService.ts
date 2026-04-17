/**
 * Service Portail Client — ZenFacture (Phase 8.1)
 *
 * Permet de générer des liens sécurisés (token 64 chars) pour que le client
 * puisse consulter, télécharger et payer ses documents sans créer de compte.
 *
 * Fonctionnalités :
 * - Génération de lien portail par client (email)
 * - Consultation publique des factures/devis/avoirs liés à l'email
 * - Marquage d'accès (dernier_acces, nb_acces)
 * - Expiration configurable (défaut 90 jours)
 */

import { supabase } from '../lib/supabaseClient';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface PortailLien {
  id: string;
  organisation_id: string;
  client_email: string;
  client_nom?: string;
  token: string;
  expires_at: string;
  dernier_acces?: string;
  nb_acces: number;
  actif: boolean;
  message_accueil?: string;
  created_at: string;
}

export interface PortailDocument {
  id: string;
  type: 'facture' | 'devis' | 'avoir';
  numero: string;
  date: string;
  date_echeance?: string;
  statut: string;
  total: number;
  devise: string;
  client_nom: string;
  lien_paiement?: string;
}

export interface PortailData {
  lien: PortailLien;
  organisation: {
    nom: string;
    logo_url?: string;
    adresse?: string;
    email?: string;
    telephone?: string;
    couleur_principale?: string;
  };
  documents: PortailDocument[];
  stats: {
    total_du: number;
    total_paye: number;
    factures_en_attente: number;
  };
}

// ─── GESTION DES LIENS (ADMIN) ────────────────────────────────────────────────

export async function getLiensPortail(organisationId: string): Promise<PortailLien[]> {
  const { data, error } = await supabase
    .from('portail_client_liens')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function creerLienPortail(
  organisationId: string,
  opts: { client_email: string; client_nom?: string; message_accueil?: string; expires_days?: number }
): Promise<PortailLien> {
  // Vérifier s'il existe déjà un lien actif pour cet email
  const { data: existant } = await supabase
    .from('portail_client_liens')
    .select('*')
    .eq('organisation_id', organisationId)
    .eq('client_email', opts.client_email.toLowerCase())
    .eq('actif', true)
    .single();

  if (existant) return existant;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (opts.expires_days ?? 90));

  const { data, error } = await supabase
    .from('portail_client_liens')
    .insert({
      organisation_id: organisationId,
      client_email: opts.client_email.toLowerCase(),
      client_nom: opts.client_nom,
      message_accueil: opts.message_accueil,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function desactiverLien(id: string): Promise<void> {
  const { error } = await supabase
    .from('portail_client_liens')
    .update({ actif: false })
    .eq('id', id);
  if (error) throw error;
}

export async function regenererToken(id: string): Promise<PortailLien> {
  // On désactive l'ancien et on recrée
  const { data: ancien, error: e1 } = await supabase
    .from('portail_client_liens')
    .select('*')
    .eq('id', id)
    .single();
  if (e1 || !ancien) throw new Error('Lien introuvable');

  await desactiverLien(id);
  return creerLienPortail(ancien.organisation_id, {
    client_email: ancien.client_email,
    client_nom: ancien.client_nom,
    message_accueil: ancien.message_accueil,
  });
}

// ─── ACCÈS PUBLIC (TOKEN) ─────────────────────────────────────────────────────

/**
 * Charge toutes les données du portail pour un token donné.
 * Appelé depuis la page publique /portail/:token (sans authentification).
 */
export async function getPortailParToken(token: string): Promise<PortailData | null> {
  // 1. Récupérer le lien
  const { data: lien, error: lienErr } = await supabase
    .from('portail_client_liens')
    .select('*')
    .eq('token', token)
    .eq('actif', true)
    .single();

  if (lienErr || !lien) return null;
  if (new Date(lien.expires_at) < new Date()) return null;

  // 2. Enregistrer l'accès
  await supabase
    .from('portail_client_liens')
    .update({
      dernier_acces: new Date().toISOString(),
      nb_acces: lien.nb_acces + 1,
    })
    .eq('id', lien.id);

  // 3. Récupérer les informations de l'organisation
  const { data: orgMembers } = await supabase
    .from('organization_users')
    .select('organisation_id')
    .eq('organisation_id', lien.organisation_id)
    .limit(1);

  const orgId = orgMembers?.[0]?.organisation_id || lien.organisation_id;

  const { data: org } = await supabase
    .from('organizations')
    .select('name, logo_url, address, email, phone, primary_color')
    .eq('id', orgId)
    .single();

  // 4. Récupérer les factures du client (par email)
  const { data: factures } = await supabase
    .from('invoices')
    .select('id, invoice_number, date, due_date, status, total, devise, client_name, client_email')
    .eq('organisation_id', lien.organisation_id)
    .ilike('client_email', lien.client_email)
    .order('date', { ascending: false });

  // 5. Récupérer les devis du client
  const { data: devis } = await supabase
    .from('devis')
    .select('id, numero, date, date_validite, statut, total_ttc, devise, client_nom, client_email')
    .eq('organisation_id', lien.organisation_id)
    .ilike('client_email', lien.client_email)
    .order('date', { ascending: false });

  // 6. Récupérer les avoirs du client
  const { data: avoirs } = await supabase
    .from('avoirs')
    .select('id, numero, date, statut, total_ttc, devise, client_nom, client_email')
    .eq('organisation_id', lien.organisation_id)
    .ilike('client_email', lien.client_email)
    .order('date', { ascending: false });

  // 7. Construire la liste de documents
  const documents: PortailDocument[] = [
    ...(factures || []).map(f => ({
      id: f.id,
      type: 'facture' as const,
      numero: f.invoice_number || `FAC-${f.id.slice(0, 8)}`,
      date: f.date,
      date_echeance: f.due_date,
      statut: f.status,
      total: f.total || 0,
      devise: f.devise || 'CHF',
      client_nom: f.client_name || lien.client_nom || lien.client_email,
    })),
    ...(devis || []).map(d => ({
      id: d.id,
      type: 'devis' as const,
      numero: d.numero || `DEV-${d.id.slice(0, 8)}`,
      date: d.date,
      date_echeance: d.date_validite,
      statut: d.statut,
      total: d.total_ttc || 0,
      devise: d.devise || 'CHF',
      client_nom: d.client_nom || lien.client_nom || lien.client_email,
    })),
    ...(avoirs || []).map(a => ({
      id: a.id,
      type: 'avoir' as const,
      numero: a.numero || `AVO-${a.id.slice(0, 8)}`,
      date: a.date,
      statut: a.statut,
      total: a.total_ttc || 0,
      devise: a.devise || 'CHF',
      client_nom: a.client_nom || lien.client_nom || lien.client_email,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 8. Calculer les stats
  const facturesData = factures || [];
  const totalDu = facturesData
    .filter(f => ['sent', 'overdue', 'pending'].includes(f.status))
    .reduce((s, f) => s + (f.total || 0), 0);
  const totalPaye = facturesData
    .filter(f => f.status === 'paid')
    .reduce((s, f) => s + (f.total || 0), 0);
  const enAttente = facturesData.filter(f => ['sent', 'overdue', 'pending'].includes(f.status)).length;

  return {
    lien: { ...lien, nb_acces: lien.nb_acces + 1 },
    organisation: {
      nom: org?.name || 'Mon Entreprise',
      logo_url: org?.logo_url,
      adresse: org?.address,
      email: org?.email,
      telephone: org?.phone,
      couleur_principale: org?.primary_color || '#2563EB',
    },
    documents,
    stats: {
      total_du: totalDu,
      total_paye: totalPaye,
      factures_en_attente: enAttente,
    },
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function buildPortailUrl(token: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://zenfacture.ch';
  return `${base}/portail/${token}`;
}

export function getStatutLabel(statut: string, type: 'facture' | 'devis' | 'avoir'): string {
  const labels: Record<string, string> = {
    // Factures
    draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard',
    pending: 'En attente', cancelled: 'Annulée',
    // Devis
    brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté',
    refuse: 'Refusé', expire: 'Expiré',
    // Avoirs
    emis: 'Émis', rembourse: 'Remboursé',
  };
  return labels[statut] || statut;
}

export function getStatutColor(statut: string): string {
  const colors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    sent: 'bg-blue-100 text-blue-700',
    overdue: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    draft: 'bg-gray-100 text-gray-600',
    brouillon: 'bg-gray-100 text-gray-600',
    envoye: 'bg-blue-100 text-blue-700',
    accepte: 'bg-green-100 text-green-700',
    refuse: 'bg-red-100 text-red-700',
    expire: 'bg-orange-100 text-orange-700',
    emis: 'bg-purple-100 text-purple-700',
  };
  return colors[statut] || 'bg-gray-100 text-gray-600';
}
