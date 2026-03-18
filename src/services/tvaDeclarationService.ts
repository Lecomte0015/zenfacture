import { supabase } from '@/lib/supabaseClient';
import { getOrganisationId } from '@/lib/getOrganisationId';
import type {
  TvaCalculation,
  TvaDeclaration,
  TvaDeclarationData,
  TvaMethode,
} from '@/types/tva';

/**
 * Calcule la TVA pour une période donnée
 */
export async function calculateTva(
  organisationId: string,
  periodeDebut: string,
  periodeFin: string,
  methode: TvaMethode
): Promise<TvaCalculation> {
  try {
    // Récupérer les factures payées ou envoyées dans la période
    const { data: factures, error: facturesError } = await supabase
      .from('factures')
      .select('*')
      .eq('organisation_id', organisationId)
      .in('status', ['paid', 'sent', 'overdue'])
      .gte('issue_date', periodeDebut)
      .lte('issue_date', periodeFin);

    if (facturesError) throw facturesError;

    // Récupérer les dépenses dans la période
    const { data: depenses, error: depensesError } = await supabase
      .from('depenses')
      .select('*')
      .eq('organisation_id', organisationId)
      .gte('created_at', periodeDebut)
      .lte('created_at', periodeFin);

    if (depensesError) throw depensesError;

    // Initialiser les totaux
    let chiffreAffairesNormal = 0;
    let chiffreAffairesReduit = 0;
    let chiffreAffairesHebergement = 0;
    let chiffreAffairesExonere = 0;

    // Calculer le CA et la TVA collectée par taux
    factures?.forEach((facture) => {
      const items = facture.items || [];

      // Si items est un tableau vide ou si on n'a pas d'items, utiliser le montant total
      if (items.length === 0) {
        const total = facture.total || facture.subtotal || 0;
        const taxRate = facture.tax_rate || 8.1;

        if (taxRate === 8.1) {
          chiffreAffairesNormal += total;
        } else if (taxRate === 2.6) {
          chiffreAffairesReduit += total;
        } else if (taxRate === 3.8) {
          chiffreAffairesHebergement += total;
        } else {
          chiffreAffairesExonere += total;
        }
      } else {
        items.forEach((item: any) => {
          const amount = item.total || item.amount || (item.quantity || 1) * (item.unit_price || 0);
          const taxRate = item.vat_rate || item.tax_rate || facture.tax_rate || 8.1;

          if (taxRate === 8.1) {
            chiffreAffairesNormal += amount;
          } else if (taxRate === 2.6) {
            chiffreAffairesReduit += amount;
          } else if (taxRate === 3.8) {
            chiffreAffairesHebergement += amount;
          } else {
            chiffreAffairesExonere += amount;
          }
        });
      }
    });

    // Calculer la TVA collectée
    const tvaCollecteeNormale = chiffreAffairesNormal * 0.081;
    const tvaCollecteeReduite = chiffreAffairesReduit * 0.026;
    const tvaCollecteeHebergement = chiffreAffairesHebergement * 0.038;
    const tvaTotaleDue =
      tvaCollecteeNormale + tvaCollecteeReduite + tvaCollecteeHebergement;

    // Calculer la TVA déductible (impôt préalable)
    let tvaPrealable = 0;
    depenses?.forEach((depense) => {
      // Supposer que le montant de la dépense inclut la TVA
      // On extrait la TVA selon le taux (par défaut 8.1%)
      const montantTTC = depense.amount;
      const tva = montantTTC * (8.1 / 108.1); // TVA incluse dans le montant
      tvaPrealable += tva;
    });

    // Méthode forfaitaire: réduction de la TVA préalable
    if (methode === 'forfaitaire') {
      tvaPrealable = tvaTotaleDue * 0.5; // Exemple: 50% de déduction forfaitaire
    }

    const tvaNette = tvaTotaleDue - tvaPrealable;

    // Chiffres AFC
    const chiffre200 =
      chiffreAffairesNormal +
      chiffreAffairesReduit +
      chiffreAffairesHebergement +
      chiffreAffairesExonere;
    const chiffre220 = chiffreAffairesExonere;
    const chiffre230 = 0; // À implémenter: prestations à l'étranger
    const chiffre289 = chiffre220 + chiffre230;
    const chiffre299 = chiffre200 - chiffre289;
    const chiffre300 = tvaCollecteeNormale;
    const chiffre310 = tvaCollecteeReduite;
    const chiffre340 = tvaCollecteeHebergement;
    const chiffre399 = tvaTotaleDue;
    const chiffre400 = tvaPrealable;
    const chiffre405 = 0; // Corrections
    const chiffre410 = chiffre400 + chiffre405;
    const chiffre420 = tvaNette;

    return {
      // Métadonnées de période
      periode_debut: periodeDebut,
      periode_fin: periodeFin,
      methode,
      // Chiffres d'affaires
      chiffreAffairesNormal,
      chiffreAffairesReduit,
      chiffreAffairesHebergement,
      chiffreAffairesExonere,
      tvaCollecteeNormale,
      tvaCollecteeReduite,
      tvaCollecteeHebergement,
      tvaTotaleDue,
      tvaPrealable,
      tvaNette,
      chiffre200,
      chiffre220,
      chiffre230,
      chiffre289,
      chiffre299,
      chiffre300,
      chiffre310,
      chiffre340,
      chiffre399,
      chiffre400,
      chiffre405,
      chiffre410,
      chiffre420,
    };
  } catch (error) {
    console.error('Erreur lors du calcul de la TVA:', error);
    throw error;
  }
}

/**
 * Crée une nouvelle déclaration TVA
 */
export async function createDeclaration(
  organisationId: string,
  data: Omit<TvaDeclarationData, 'organisation_id'>
): Promise<TvaDeclaration> {
  try {
    const { data: declaration, error } = await supabase
      .from('declarations_tva')
      .insert([
        {
          ...data,
          organisation_id: organisationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return declaration;
  } catch (error) {
    console.error('Erreur lors de la création de la déclaration:', error);
    throw error;
  }
}

/**
 * Récupère toutes les déclarations d'une organisation
 */
export async function getDeclarations(
  organisationId: string
): Promise<TvaDeclaration[]> {
  try {
    const { data, error } = await supabase
      .from('declarations_tva')
      .select('*')
      .eq('organisation_id', organisationId)
      .order('periode_debut', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des déclarations:', error);
    throw error;
  }
}

/**
 * Récupère une déclaration par son ID
 */
export async function getDeclaration(
  id: string
): Promise<TvaDeclaration | null> {
  try {
    const { data, error } = await supabase
      .from('declarations_tva')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération de la déclaration:', error);
    throw error;
  }
}

/**
 * Met à jour une déclaration
 */
export async function updateDeclaration(
  id: string,
  data: Partial<TvaDeclarationData>
): Promise<TvaDeclaration> {
  try {
    const { data: declaration, error } = await supabase
      .from('declarations_tva')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return declaration;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la déclaration:', error);
    throw error;
  }
}

/**
 * Valide une déclaration (change le statut à 'valide')
 */
export async function validateDeclaration(
  id: string
): Promise<TvaDeclaration> {
  try {
    const { data: declaration, error } = await supabase
      .from('declarations_tva')
      .update({
        statut: 'valide',
        date_validation: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return declaration;
  } catch (error) {
    console.error('Erreur lors de la validation de la déclaration:', error);
    throw error;
  }
}

/**
 * Génère le fichier XML au format AFC/ESTV pour une déclaration
 */
export function generateXml(declaration: TvaDeclaration): string {
  const now = new Date().toISOString();

  // Format XML simplifié pour l'AFC suisse
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<MwStAbrechnung xmlns="http://www.estv.admin.ch/xmlns/MwStAbrechnung/1">
  <Header>
    <Version>1.0</Version>
    <CreationDate>${now}</CreationDate>
    <Period>
      <From>${declaration.periode_debut}</From>
      <To>${declaration.periode_fin}</To>
    </Period>
  </Header>
  <Body>
    <TaxCalculation>
      <Chiffre200>${declaration.chiffre200?.toFixed(2) || '0.00'}</Chiffre200>
      <Chiffre220>${declaration.chiffre220?.toFixed(2) || '0.00'}</Chiffre220>
      <Chiffre230>${declaration.chiffre230?.toFixed(2) || '0.00'}</Chiffre230>
      <Chiffre289>${declaration.chiffre289?.toFixed(2) || '0.00'}</Chiffre289>
      <Chiffre299>${declaration.chiffre299?.toFixed(2) || '0.00'}</Chiffre299>
      <Chiffre300>${declaration.chiffre300?.toFixed(2) || '0.00'}</Chiffre300>
      <Chiffre310>${declaration.chiffre310?.toFixed(2) || '0.00'}</Chiffre310>
      <Chiffre340>${declaration.chiffre340?.toFixed(2) || '0.00'}</Chiffre340>
      <Chiffre399>${declaration.chiffre399?.toFixed(2) || '0.00'}</Chiffre399>
      <Chiffre400>${declaration.chiffre400?.toFixed(2) || '0.00'}</Chiffre400>
      <Chiffre405>${declaration.chiffre405?.toFixed(2) || '0.00'}</Chiffre405>
      <Chiffre410>${declaration.chiffre410?.toFixed(2) || '0.00'}</Chiffre410>
      <Chiffre420>${declaration.chiffre420?.toFixed(2) || '0.00'}</Chiffre420>
    </TaxCalculation>
  </Body>
</MwStAbrechnung>`;

  return xml;
}

/**
 * Supprime une déclaration
 */
export async function deleteDeclaration(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('declarations_tva')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression de la déclaration:', error);
    throw error;
  }
}

// getOrganisationId is imported from @/lib/getOrganisationId
export { getOrganisationId } from '@/lib/getOrganisationId';
