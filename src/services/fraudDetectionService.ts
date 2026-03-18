/**
 * Service de détection de fraude IA
 * Analyse les factures entrantes (dépenses) pour détecter des anomalies
 */

import { supabase } from '../lib/supabaseClient';

export interface RisqueFraude {
  score: number; // 0-100
  niveau: 'faible' | 'moyen' | 'eleve' | 'critique';
  alertes: AlerteFraude[];
  recommandation: string;
}

export interface AlerteFraude {
  type: TypeAlerteF;
  message: string;
  gravite: 'info' | 'warning' | 'danger';
  details?: string;
}

export type TypeAlerteF =
  | 'montant_atypique'
  | 'doublon_suspect'
  | 'iban_modifie'
  | 'fournisseur_inconnu'
  | 'frequence_inhabituelle'
  | 'montant_rond_suspect'
  | 'hors_horaires'
  | 'sequence_inhabituelle';

export interface InvoiceForAnalysis {
  id: string;
  montant: number;
  date: string;
  client_id?: string;
  client_nom?: string;
  iban?: string;
  description?: string;
}

// ─── ANALYSE ─────────────────────────────────────────────────────────────────

/**
 * Calcule un score de risque pour une facture/dépense donnée
 */
export async function analyserRisqueFraude(
  organisationId: string,
  invoice: InvoiceForAnalysis,
  historique?: InvoiceForAnalysis[]
): Promise<RisqueFraude> {
  const alertes: AlerteFraude[] = [];
  let score = 0;

  // Charger l'historique si non fourni
  if (!historique) {
    const { data } = await supabase
      .from('invoices')
      .select('id, total_ttc, date, client_id, client_nom')
      .eq('organisation_id', organisationId)
      .neq('id', invoice.id)
      .order('date', { ascending: false })
      .limit(200);
    historique = (data || []).map(d => ({
      id: d.id,
      montant: d.total_ttc || 0,
      date: d.date,
      client_id: d.client_id,
      client_nom: d.client_nom,
    }));
  }

  // 1. Montant atypique (>3x la moyenne du client ou globale)
  const historiqueClient = historique.filter(h => h.client_id === invoice.client_id && h.client_id);
  if (historiqueClient.length >= 3) {
    const moyenne = historiqueClient.reduce((sum, h) => sum + h.montant, 0) / historiqueClient.length;
    const ratio = invoice.montant / moyenne;
    if (ratio > 5) {
      score += 35;
      alertes.push({
        type: 'montant_atypique',
        message: `Montant ${ratio.toFixed(1)}x supérieur à la moyenne client`,
        gravite: 'danger',
        details: `Moyenne habituelle: CHF ${moyenne.toFixed(2)}, Montant actuel: CHF ${invoice.montant.toFixed(2)}`,
      });
    } else if (ratio > 3) {
      score += 20;
      alertes.push({
        type: 'montant_atypique',
        message: `Montant ${ratio.toFixed(1)}x supérieur à la moyenne client`,
        gravite: 'warning',
        details: `Moyenne habituelle: CHF ${moyenne.toFixed(2)}`,
      });
    }
  } else if (historique.length >= 5) {
    // Moyenne globale si pas assez d'historique client
    const moyenneGlobal = historique.reduce((sum, h) => sum + h.montant, 0) / historique.length;
    if (invoice.montant > moyenneGlobal * 4) {
      score += 15;
      alertes.push({
        type: 'montant_atypique',
        message: 'Montant nettement supérieur à la moyenne globale',
        gravite: 'warning',
      });
    }
  }

  // 2. Détection de doublons (même montant + même client + période proche)
  const debutPeriode = new Date(invoice.date);
  debutPeriode.setDate(debutPeriode.getDate() - 30);
  const doublons = historique.filter(h => {
    const diff = Math.abs(h.montant - invoice.montant);
    const dateH = new Date(h.date);
    const dansPeriode = dateH >= debutPeriode;
    const memeClient = h.client_id === invoice.client_id && h.client_id;
    return memeClient && dansPeriode && diff / invoice.montant < 0.01; // <1% de différence
  });

  if (doublons.length > 0) {
    score += 40;
    alertes.push({
      type: 'doublon_suspect',
      message: `${doublons.length} facture(s) similaire(s) trouvée(s) dans les 30 derniers jours`,
      gravite: 'danger',
      details: `Même montant (±1%) pour le même client`,
    });
  }

  // 3. Montant rond suspect (ex: 5000, 10000, 50000)
  const montantRond = invoice.montant % 1000 === 0 && invoice.montant >= 5000;
  if (montantRond) {
    score += 8;
    alertes.push({
      type: 'montant_rond_suspect',
      message: 'Montant rond élevé (CHF multiple de 1000)',
      gravite: 'info',
      details: 'Les montants ronds élevés peuvent signaler une facturation non détaillée',
    });
  }

  // 4. Fournisseur/client inconnu (première occurrence)
  const clientConnu = historique.some(h => h.client_id === invoice.client_id && h.client_id);
  if (!clientConnu && invoice.client_id && invoice.montant > 2000) {
    score += 15;
    alertes.push({
      type: 'fournisseur_inconnu',
      message: 'Premier document pour ce client avec un montant important',
      gravite: 'warning',
      details: 'Vérifiez l\'identité et les coordonnées bancaires du client',
    });
  }

  // 5. Fréquence inhabituelle (trop de factures en peu de temps)
  const derniers7jours = historique.filter(h => {
    const dateH = new Date(h.date);
    const debut = new Date(invoice.date);
    debut.setDate(debut.getDate() - 7);
    return dateH >= debut && h.client_id === invoice.client_id;
  });

  if (derniers7jours.length >= 5) {
    score += 20;
    alertes.push({
      type: 'frequence_inhabituelle',
      message: `${derniers7jours.length} factures créées en 7 jours pour ce client`,
      gravite: 'warning',
    });
  }

  // Calcul niveau de risque
  const scoreClamp = Math.min(100, score);
  let niveau: RisqueFraude['niveau'];
  let recommandation: string;

  if (scoreClamp >= 70) {
    niveau = 'critique';
    recommandation = '⛔ Vérification manuelle obligatoire avant tout paiement. Contactez le client pour confirmer.';
  } else if (scoreClamp >= 45) {
    niveau = 'eleve';
    recommandation = '⚠️ Vérification recommandée. Contactez le client ou votre responsable financier.';
  } else if (scoreClamp >= 20) {
    niveau = 'moyen';
    recommandation = '🔍 Risque modéré. Vérifiez les détails avant validation.';
  } else {
    niveau = 'faible';
    recommandation = '✅ Aucune anomalie détectée. Document conforme aux habitudes.';
  }

  if (alertes.length === 0) {
    alertes.push({
      type: 'montant_atypique',
      message: 'Aucune anomalie détectée',
      gravite: 'info',
    });
  }

  return { score: scoreClamp, niveau, alertes, recommandation };
}

/**
 * Analyse en lot — retourne les factures à risque élevé
 */
export async function analyserFacturesRisquees(
  organisationId: string,
  limit = 50
): Promise<Array<{ invoice: InvoiceForAnalysis; risque: RisqueFraude }>> {
  const { data, error } = await supabase
    .from('invoices')
    .select('id, total_ttc, date, client_id, client_nom')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  const factures = (data || []).map(d => ({
    id: d.id,
    montant: d.total_ttc || 0,
    date: d.date,
    client_id: d.client_id,
    client_nom: d.client_nom,
  }));

  const resultats: Array<{ invoice: InvoiceForAnalysis; risque: RisqueFraude }> = [];

  for (const facture of factures) {
    const risque = await analyserRisqueFraude(organisationId, facture, factures);
    if (risque.score >= 30) {
      resultats.push({ invoice: facture, risque });
    }
  }

  return resultats.sort((a, b) => b.risque.score - a.risque.score);
}

/**
 * Couleur du badge selon le niveau de risque
 */
export function getRisqueColor(niveau: RisqueFraude['niveau']): {
  bg: string; text: string; border: string;
} {
  switch (niveau) {
    case 'critique': return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
    case 'eleve': return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' };
    case 'moyen': return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' };
    default: return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' };
  }
}
