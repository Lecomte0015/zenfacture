/**
 * Service d'estimation fiscale suisse
 * Calcule une estimation de la charge fiscale pour les indépendants et PME
 */

// ─── TAUX LÉGAUX 2024/2025 ────────────────────────────────────────────────────

export const TAUX_TVA = {
  NORMAL: 8.1,
  REDUIT: 2.6,
  HEBERGEMENT: 3.8,
};

export const TAUX_AVS_AI_APG = {
  INDEPENDANT: 10.1,      // AVS 8.7% + AI 1.4% = 10.1%
  EMPLOYE_PART: 5.3,      // AVS 4.35% + AI 0.70% + APG 0.25%
  EMPLOYEUR_PART: 5.3,
};

export const TAUX_AC = {
  EMPLOYE: 1.10,
  EMPLOYEUR: 1.10,
  PLAFOND: 148200,        // Plafond annuel 2025
};

// Tranches IS Genève (exemple) — chaque canton a ses propres taux
export const TRANCHES_IMPOT_REVENU_GE = [
  { jusqu_a: 17000, taux: 0 },
  { jusqu_a: 21000, taux: 0.5 },
  { jusqu_a: 30000, taux: 5 },
  { jusqu_a: 40000, taux: 9 },
  { jusqu_a: 65000, taux: 12 },
  { jusqu_a: 110000, taux: 15 },
  { jusqu_a: 200000, taux: 17.5 },
  { jusqu_a: Infinity, taux: 19.5 },
];

// Impôt fédéral direct (personnes physiques, barème ordinaire 2024)
export const TRANCHES_IFD = [
  { jusqu_a: 17800, taux: 0 },
  { jusqu_a: 31600, taux: 0.77 },
  { jusqu_a: 41400, taux: 0.88 },
  { jusqu_a: 55200, taux: 2.64 },
  { jusqu_a: 72500, taux: 2.97 },
  { jusqu_a: 78100, taux: 5.94 },
  { jusqu_a: 103600, taux: 6.60 },
  { jusqu_a: 134600, taux: 8.80 },
  { jusqu_a: 176000, taux: 11.00 },
  { jusqu_a: 755200, taux: 13.20 },
  { jusqu_a: Infinity, taux: 11.50 },
];

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type StatutFiscal = 'independant' | 'sa' | 'sarl' | 'individuel';
export type Canton = 'GE' | 'VD' | 'ZH' | 'BE' | 'VS' | 'FR' | 'NE' | 'JU' | 'autre';

export interface InputFiscal {
  chiffre_affaires_ht: number;
  charges_deductibles: number;
  salaires_bruts: number;
  loyer_annuel: number;
  autres_charges: number;
  statut: StatutFiscal;
  canton: Canton;
  assujetti_tva: boolean;
  taux_tva_moyen: number;
  annee: number;
}

export interface LigneFiscale {
  libelle: string;
  montant: number;
  taux?: number;
  type: 'charge' | 'impot' | 'cotisation' | 'positif';
  info?: string;
}

export interface ResultatFiscal {
  chiffre_affaires_ht: number;
  tva_collectee: number;
  total_charges: number;
  benefice_avant_impots: number;
  cotisations_sociales: number;
  impot_revenu_federal: number;
  impot_revenu_cantonal: number;
  impot_fortune?: number;
  impot_benefice?: number; // SA/Sàrl
  total_impots: number;
  revenu_net: number;
  taux_charge_global: number;
  lignes: LigneFiscale[];
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function calculerImpotProgressif(
  revenu: number,
  tranches: { jusqu_a: number; taux: number }[]
): number {
  let impot = 0;
  let prev = 0;
  for (const tranche of tranches) {
    if (revenu <= prev) break;
    const base = Math.min(revenu, tranche.jusqu_a) - prev;
    impot += base * (tranche.taux / 100);
    prev = tranche.jusqu_a;
  }
  return impot;
}

// Multiplicateurs cantonaux (facteur par rapport au taux GE = 1)
const MULTIPLICATEURS_CANTONAUX: Record<Canton, number> = {
  GE: 1.0,
  VD: 0.85,
  ZH: 0.88,
  BE: 0.95,
  VS: 0.75,
  FR: 0.82,
  NE: 0.90,
  JU: 0.92,
  autre: 0.88,
};

// ─── CALCUL PRINCIPAL ─────────────────────────────────────────────────────────

export function calculerEstimationFiscale(input: InputFiscal): ResultatFiscal {
  const lignes: LigneFiscale[] = [];

  // 1. Chiffre d'affaires
  const tva_collectee = input.assujetti_tva
    ? input.chiffre_affaires_ht * (input.taux_tva_moyen / 100)
    : 0;

  lignes.push({
    libelle: 'Chiffre d\'affaires HT',
    montant: input.chiffre_affaires_ht,
    type: 'positif',
  });

  if (input.assujetti_tva) {
    lignes.push({
      libelle: `TVA collectée (${input.taux_tva_moyen}%)`,
      montant: tva_collectee,
      taux: input.taux_tva_moyen,
      type: 'charge',
      info: 'À reverser à l\'AFC — non incluse dans votre revenu',
    });
  }

  // 2. Charges déductibles
  const total_charges = input.charges_deductibles + input.salaires_bruts + input.loyer_annuel + input.autres_charges;

  lignes.push({
    libelle: 'Charges déductibles',
    montant: -(input.charges_deductibles),
    type: 'charge',
  });
  if (input.salaires_bruts > 0) {
    lignes.push({ libelle: 'Salaires bruts', montant: -(input.salaires_bruts), type: 'charge' });
  }
  if (input.loyer_annuel > 0) {
    lignes.push({ libelle: 'Loyer annuel', montant: -(input.loyer_annuel), type: 'charge' });
  }
  if (input.autres_charges > 0) {
    lignes.push({ libelle: 'Autres charges', montant: -(input.autres_charges), type: 'charge' });
  }

  const benefice_avant_impots = Math.max(0, input.chiffre_affaires_ht - total_charges);

  lignes.push({
    libelle: 'Bénéfice avant cotisations et impôts',
    montant: benefice_avant_impots,
    type: 'positif',
    info: 'CA HT - toutes charges professionnelles',
  });

  // 3. Cotisations sociales
  let cotisations_sociales = 0;
  let impot_benefice = 0;

  if (input.statut === 'independant' || input.statut === 'individuel') {
    // AVS/AI/APG indépendant — taux dégressif pour les revenus modestes
    let taux_avs = TAUX_AVS_AI_APG.INDEPENDANT;
    if (benefice_avant_impots < 57400) taux_avs = 8.1; // Taux réduit

    cotisations_sociales = benefice_avant_impots * (taux_avs / 100);

    // AC: indépendants non soumis
    lignes.push({
      libelle: `Cotisations AVS/AI/APG (${taux_avs}%)`,
      montant: -(cotisations_sociales),
      taux: taux_avs,
      type: 'cotisation',
      info: 'Cotisations sociales obligatoires pour les indépendants',
    });

    // Déduction des cotisations pour calcul IS
    const revenu_imposable = Math.max(0, benefice_avant_impots - cotisations_sociales);

    const impot_federal = calculerImpotProgressif(revenu_imposable, TRANCHES_IFD);
    const mult = MULTIPLICATEURS_CANTONAUX[input.canton] || 0.88;
    const impot_cantonal = calculerImpotProgressif(revenu_imposable, TRANCHES_IMPOT_REVENU_GE) * mult;

    lignes.push({
      libelle: 'Impôt fédéral direct (IFD)',
      montant: -(impot_federal),
      type: 'impot',
      info: 'Barème ordinaire personnes physiques',
    });
    lignes.push({
      libelle: `Impôt cantonal et communal (${input.canton})`,
      montant: -(impot_cantonal),
      type: 'impot',
      info: 'Estimation basée sur le canton sélectionné',
    });

    const revenu_net = revenu_imposable - impot_federal - impot_cantonal;
    const total_impots = impot_federal + impot_cantonal;
    const taux_charge = input.chiffre_affaires_ht > 0
      ? ((cotisations_sociales + total_impots) / input.chiffre_affaires_ht) * 100
      : 0;

    lignes.push({
      libelle: 'Revenu net estimé',
      montant: revenu_net,
      type: 'positif',
    });

    return {
      chiffre_affaires_ht: input.chiffre_affaires_ht,
      tva_collectee,
      total_charges,
      benefice_avant_impots,
      cotisations_sociales,
      impot_revenu_federal: impot_federal,
      impot_revenu_cantonal: impot_cantonal,
      total_impots,
      revenu_net,
      taux_charge_global: taux_charge,
      lignes,
    };
  } else {
    // SA / Sàrl — Impôt sur le bénéfice
    // Taux IS fédéral: 8.5% du bénéfice net
    const taux_is_federal = 8.5;
    const is_federal = benefice_avant_impots * (taux_is_federal / 100);

    // Taux cantonal approximatif
    const taux_is_cantonal: Record<Canton, number> = {
      GE: 14.0, VD: 13.79, ZH: 12.32, BE: 13.94,
      VS: 14.0, FR: 13.72, NE: 15.61, JU: 14.75, autre: 14.0,
    };
    const is_cantonal = benefice_avant_impots * ((taux_is_cantonal[input.canton] || 14) / 100);
    impot_benefice = is_federal + is_cantonal;

    lignes.push({
      libelle: `Impôt sur le bénéfice fédéral (${taux_is_federal}%)`,
      montant: -(is_federal),
      taux: taux_is_federal,
      type: 'impot',
    });
    lignes.push({
      libelle: `Impôt sur le bénéfice cantonal (${input.canton}) ~${taux_is_cantonal[input.canton] || 14}%`,
      montant: -(is_cantonal),
      type: 'impot',
    });

    // Capital social — impôt sur le capital (simplifié)
    // Cotisations sociales des employés si salaires
    if (input.salaires_bruts > 0) {
      const charges_patronales = Math.min(input.salaires_bruts, TAUX_AC.PLAFOND) * (TAUX_AVS_AI_APG.EMPLOYEUR_PART / 100);
      cotisations_sociales = charges_patronales;
      lignes.push({
        libelle: `Charges patronales estimées (~${TAUX_AVS_AI_APG.EMPLOYEUR_PART}%)`,
        montant: -(charges_patronales),
        type: 'cotisation',
        info: 'Charges patronales sur les salaires (déjà incluses dans les charges si comptabilisées)',
      });
    }

    const revenu_net = benefice_avant_impots - impot_benefice;
    const total_impots = impot_benefice;
    const taux_charge = input.chiffre_affaires_ht > 0
      ? ((impot_benefice) / input.chiffre_affaires_ht) * 100
      : 0;

    lignes.push({
      libelle: 'Bénéfice net après impôt',
      montant: revenu_net,
      type: 'positif',
    });

    return {
      chiffre_affaires_ht: input.chiffre_affaires_ht,
      tva_collectee,
      total_charges,
      benefice_avant_impots,
      cotisations_sociales,
      impot_revenu_federal: 0,
      impot_revenu_cantonal: 0,
      impot_benefice,
      total_impots,
      revenu_net,
      taux_charge_global: taux_charge,
      lignes,
    };
  }
}

// ─── SCÉNARIOS ───────────────────────────────────────────────────────────────

export function genererScenarios(base: InputFiscal): {
  pessimiste: ResultatFiscal;
  realiste: ResultatFiscal;
  optimiste: ResultatFiscal;
} {
  const pessimiste = calculerEstimationFiscale({
    ...base,
    chiffre_affaires_ht: base.chiffre_affaires_ht * 0.8,
    charges_deductibles: base.charges_deductibles * 1.1,
  });
  const realiste = calculerEstimationFiscale(base);
  const optimiste = calculerEstimationFiscale({
    ...base,
    chiffre_affaires_ht: base.chiffre_affaires_ht * 1.2,
    charges_deductibles: base.charges_deductibles * 0.95,
  });
  return { pessimiste, realiste, optimiste };
}

// ─── SEUILS TVA ──────────────────────────────────────────────────────────────

export function verifierSeuilTVA(ca: number): {
  assujetti: boolean;
  seuil: number;
  marge: number;
  message: string;
} {
  const SEUIL = 100000;
  const assujetti = ca >= SEUIL;
  return {
    assujetti,
    seuil: SEUIL,
    marge: SEUIL - ca,
    message: assujetti
      ? `⚠️ Votre CA dépasse CHF 100'000. L'assujettissement à la TVA est obligatoire.`
      : `✅ Votre CA est inférieur au seuil de CHF 100'000. Vous n'êtes pas encore obligé de vous soumettre à la TVA.`,
  };
}
