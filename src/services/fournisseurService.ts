/**
 * Service Commandes Fournisseurs — ZenFacture (Phase 8.3)
 *
 * Gestion des achats fournisseurs (Purchase Orders) :
 * - CRUD fournisseurs
 * - Création/envoi de bons de commande
 * - Réception partielle ou totale (→ mise à jour automatique du stock)
 * - Calcul automatique des totaux HT/TVA/TTC
 * - Export PDF du bon de commande
 */

import { supabase } from '../lib/supabaseClient';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface Fournisseur {
  id: string;
  organisation_id: string;
  numero?: string;
  nom: string;
  contact?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  pays: string;
  iban?: string;
  tva_numero?: string;
  delai_paiement: number;
  notes?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface LigneCommande {
  id?: string;
  commande_id?: string;
  article_id?: string;
  reference?: string;
  description: string;
  quantite_commandee: number;
  quantite_recue: number;
  unite: string;
  prix_unitaire: number;
  taux_tva: number;
  remise_pct: number;
  total_ht: number;
  ordre: number;
}

export interface CommandeFournisseur {
  id: string;
  organisation_id: string;
  fournisseur_id: string;
  numero: string;
  statut: 'brouillon' | 'envoye' | 'partiel' | 'recu' | 'annule';
  date_commande: string;
  date_livraison_prevue?: string;
  date_reception?: string;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  devise: string;
  adresse_livraison?: string;
  notes?: string;
  conditions?: string;
  created_at: string;
  updated_at: string;
  // Relations jointes
  fournisseur?: Fournisseur;
  lignes?: LigneCommande[];
}

export interface StatsFournisseurs {
  nb_fournisseurs: number;
  nb_commandes: number;
  ca_achats_mois: number;
  commandes_en_attente: number;
}

// ─── STATUTS ──────────────────────────────────────────────────────────────────

export const STATUTS_COMMANDE: Record<CommandeFournisseur['statut'], {
  label: string;
  couleur: string;
  bg: string;
}> = {
  brouillon: { label: 'Brouillon',          couleur: 'text-gray-600',   bg: 'bg-gray-100' },
  envoye:    { label: 'Envoyée',             couleur: 'text-blue-600',   bg: 'bg-blue-100' },
  partiel:   { label: 'Partiellement reçue', couleur: 'text-orange-600', bg: 'bg-orange-100' },
  recu:      { label: 'Reçue complète',      couleur: 'text-green-600',  bg: 'bg-green-100' },
  annule:    { label: 'Annulée',             couleur: 'text-red-600',    bg: 'bg-red-100' },
};

// ─── FOURNISSEURS ─────────────────────────────────────────────────────────────

export async function getFournisseurs(organisationId: string): Promise<Fournisseur[]> {
  const { data, error } = await supabase
    .from('fournisseurs')
    .select('*')
    .eq('organisation_id', organisationId)
    .eq('actif', true)
    .order('nom');
  if (error) throw error;
  return data || [];
}

export async function creerFournisseur(
  organisationId: string,
  payload: Omit<Fournisseur, 'id' | 'organisation_id' | 'created_at' | 'updated_at'>
): Promise<Fournisseur> {
  // Générer un numéro fournisseur automatique
  const { data: count } = await supabase
    .from('fournisseurs')
    .select('id', { count: 'exact', head: true })
    .eq('organisation_id', organisationId);

  const { data, error } = await supabase
    .from('fournisseurs')
    .insert({
      ...payload,
      organisation_id: organisationId,
      numero: `FOUR-${String((count as unknown as number || 0) + 1).padStart(3, '0')}`,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function mettreAJourFournisseur(id: string, updates: Partial<Fournisseur>): Promise<void> {
  const { error } = await supabase.from('fournisseurs').update(updates).eq('id', id);
  if (error) throw error;
}

export async function supprimerFournisseur(id: string): Promise<void> {
  // Soft delete
  const { error } = await supabase.from('fournisseurs').update({ actif: false }).eq('id', id);
  if (error) throw error;
}

// ─── COMMANDES ────────────────────────────────────────────────────────────────

export async function getCommandesFournisseurs(
  organisationId: string,
  options?: { statut?: CommandeFournisseur['statut']; fournisseur_id?: string }
): Promise<CommandeFournisseur[]> {
  let q = supabase
    .from('commandes_fournisseurs')
    .select(`
      *,
      fournisseur:fournisseurs(id, nom, email, ville),
      lignes:commandes_fournisseurs_lignes(*)
    `)
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false });

  if (options?.statut) q = q.eq('statut', options.statut);
  if (options?.fournisseur_id) q = q.eq('fournisseur_id', options.fournisseur_id);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getCommandeFournisseur(id: string): Promise<CommandeFournisseur | null> {
  const { data, error } = await supabase
    .from('commandes_fournisseurs')
    .select(`
      *,
      fournisseur:fournisseurs(*),
      lignes:commandes_fournisseurs_lignes(*)
    `)
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export function calculerTotaux(lignes: Partial<LigneCommande>[]): {
  total_ht: number; total_tva: number; total_ttc: number;
} {
  let total_ht = 0, total_tva = 0;
  for (const l of lignes) {
    const ht = (l.quantite_commandee || 0) * (l.prix_unitaire || 0) * (1 - (l.remise_pct || 0) / 100);
    const tva = ht * ((l.taux_tva || 7.7) / 100);
    total_ht += ht;
    total_tva += tva;
  }
  return { total_ht, total_tva, total_ttc: total_ht + total_tva };
}

export async function creerCommande(
  organisationId: string,
  payload: {
    fournisseur_id: string;
    lignes: Omit<LigneCommande, 'id' | 'commande_id' | 'quantite_recue'>[];
    date_livraison_prevue?: string;
    adresse_livraison?: string;
    notes?: string;
    conditions?: string;
    devise?: string;
  }
): Promise<CommandeFournisseur> {
  // Générer numéro
  const { count } = await supabase
    .from('commandes_fournisseurs')
    .select('id', { count: 'exact', head: true })
    .eq('organisation_id', organisationId);

  const numero = `BC-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;
  const { total_ht, total_tva, total_ttc } = calculerTotaux(payload.lignes);

  const { data: commande, error } = await supabase
    .from('commandes_fournisseurs')
    .insert({
      organisation_id: organisationId,
      fournisseur_id: payload.fournisseur_id,
      numero,
      statut: 'brouillon',
      date_commande: new Date().toISOString().split('T')[0],
      date_livraison_prevue: payload.date_livraison_prevue,
      total_ht,
      total_tva,
      total_ttc,
      devise: payload.devise ?? 'CHF',
      adresse_livraison: payload.adresse_livraison,
      notes: payload.notes,
      conditions: payload.conditions,
    })
    .select()
    .single();
  if (error) throw error;

  // Insérer les lignes
  if (payload.lignes.length > 0) {
    const lignesInsert = payload.lignes.map((l, i) => ({
      commande_id: commande.id,
      article_id: l.article_id,
      reference: l.reference,
      description: l.description,
      quantite_commandee: l.quantite_commandee,
      quantite_recue: 0,
      unite: l.unite || 'pcs',
      prix_unitaire: l.prix_unitaire,
      taux_tva: l.taux_tva || 7.7,
      remise_pct: l.remise_pct || 0,
      total_ht: l.total_ht,
      ordre: i,
    }));
    await supabase.from('commandes_fournisseurs_lignes').insert(lignesInsert);
  }

  return commande;
}

export async function envoyerCommande(id: string): Promise<void> {
  const { error } = await supabase
    .from('commandes_fournisseurs')
    .update({ statut: 'envoye' })
    .eq('id', id);
  if (error) throw error;
}

export async function annulerCommande(id: string): Promise<void> {
  const { error } = await supabase
    .from('commandes_fournisseurs')
    .update({ statut: 'annule' })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Enregistrer la réception de marchandises (partielle ou totale)
 * Met à jour les quantités reçues et le stock si article_id présent
 */
export async function recevoirMarchandises(
  commandeId: string,
  receptions: { ligne_id: string; quantite: number }[]
): Promise<void> {
  const { data: commande } = await supabase
    .from('commandes_fournisseurs')
    .select('lignes:commandes_fournisseurs_lignes(*), organisation_id')
    .eq('id', commandeId)
    .single();

  if (!commande) throw new Error('Commande introuvable');

  let toutRecu = true;
  let auMoinsUnRecu = false;

  for (const rec of receptions) {
    const ligne = (commande.lignes as LigneCommande[]).find(l => l.id === rec.ligne_id);
    if (!ligne) continue;

    const nouvelleQteRecue = Math.min(
      (ligne.quantite_recue || 0) + rec.quantite,
      ligne.quantite_commandee
    );

    await supabase
      .from('commandes_fournisseurs_lignes')
      .update({ quantite_recue: nouvelleQteRecue })
      .eq('id', rec.ligne_id);

    if (nouvelleQteRecue < ligne.quantite_commandee) toutRecu = false;
    if (rec.quantite > 0) auMoinsUnRecu = true;

    // Mettre à jour le stock si article lié
    if (ligne.article_id && rec.quantite > 0) {
      await supabase.from('stock_mouvements').insert({
        organisation_id: commande.organisation_id,
        article_id: ligne.article_id,
        type: 'entree',
        quantite: rec.quantite,
        reference: `Réception BC ${commandeId.slice(0, 8)}`,
        notes: `Réception commande fournisseur`,
      });

      // Mettre à jour la quantité en stock
      const { data: art } = await supabase
        .from('stock_articles')
        .select('quantite')
        .eq('id', ligne.article_id)
        .single();
      if (art) {
        await supabase
          .from('stock_articles')
          .update({ quantite: (art.quantite || 0) + rec.quantite })
          .eq('id', ligne.article_id);
      }
    }
  }

  // Mettre à jour le statut de la commande
  const nouveauStatut = toutRecu ? 'recu' : auMoinsUnRecu ? 'partiel' : 'envoye';
  await supabase
    .from('commandes_fournisseurs')
    .update({
      statut: nouveauStatut,
      date_reception: toutRecu ? new Date().toISOString().split('T')[0] : undefined,
    })
    .eq('id', commandeId);
}

// ─── STATS ────────────────────────────────────────────────────────────────────

export async function getStatsFournisseurs(organisationId: string): Promise<StatsFournisseurs> {
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const { count: nbFour } = await supabase
    .from('fournisseurs')
    .select('id', { count: 'exact', head: true })
    .eq('organisation_id', organisationId)
    .eq('actif', true);

  const { data: commandes } = await supabase
    .from('commandes_fournisseurs')
    .select('total_ttc, statut, date_commande')
    .eq('organisation_id', organisationId);

  const all = commandes || [];
  const caAchatsMois = all
    .filter(c => c.date_commande >= debutMois && c.statut !== 'annule')
    .reduce((s, c) => s + (c.total_ttc || 0), 0);
  const enAttente = all.filter(c => ['envoye', 'partiel'].includes(c.statut)).length;

  return {
    nb_fournisseurs: nbFour || 0,
    nb_commandes: all.length,
    ca_achats_mois: caAchatsMois,
    commandes_en_attente: enAttente,
  };
}
