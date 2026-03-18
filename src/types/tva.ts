export type TvaRate = 0 | 2.6 | 3.8 | 8.1;
export type TvaMethode = 'effective' | 'forfaitaire';
export type DeclarationStatus = 'brouillon' | 'valide' | 'soumis';

export interface TvaCalculation {
  // Métadonnées de la période
  periode_debut?: string;
  periode_fin?: string;
  methode?: TvaMethode;

  // Chiffres d'affaires par taux
  chiffreAffairesNormal: number; // 8.1%
  chiffreAffairesReduit: number; // 2.6%
  chiffreAffairesHebergement: number; // 3.8%
  chiffreAffairesExonere: number; // 0%

  // TVA collectée
  tvaCollecteeNormale: number;
  tvaCollecteeReduite: number;
  tvaCollecteeHebergement: number;

  // Totaux
  tvaTotaleDue: number;
  tvaPrealable: number; // TVA déductible
  tvaNette: number; // Montant à payer ou à récupérer

  // Chiffres AFC
  chiffre200: number; // Total des contre-prestations
  chiffre220: number; // Prestations exonérées
  chiffre230: number; // Prestations à l'étranger
  chiffre289: number; // Total des déductions
  chiffre299: number; // Chiffre d'affaires imposable
  chiffre300: number; // TVA 8.1%
  chiffre310: number; // TVA 2.6%
  chiffre340: number; // TVA 3.8%
  chiffre399: number; // Total TVA due
  chiffre400: number; // Impôt préalable
  chiffre405: number; // Corrections
  chiffre410: number; // Total impôt préalable
  chiffre420: number; // Montant à payer (+) ou en faveur (-)
}

export interface TvaDeclarationData {
  organisation_id: string;
  periode_debut: string;
  periode_fin: string;
  methode: TvaMethode;
  statut: DeclarationStatus;

  // Données calculées ou saisies
  chiffre200?: number;
  chiffre220?: number;
  chiffre230?: number;
  chiffre289?: number;
  chiffre299?: number;
  chiffre300?: number;
  chiffre310?: number;
  chiffre340?: number;
  chiffre399?: number;
  chiffre400?: number;
  chiffre405?: number;
  chiffre410?: number;
  chiffre420?: number;

  // Métadonnées
  notes?: string;
  fichier_xml?: string;
  date_validation?: string;
  date_soumission?: string;
}

export interface TvaDeclaration extends TvaDeclarationData {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface TvaPeriod {
  label: string;
  debut: string;
  fin: string;
  type: 'trimestre' | 'semestre' | 'annuel';
}
