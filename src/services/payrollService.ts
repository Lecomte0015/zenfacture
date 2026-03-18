import { supabase } from '../lib/supabaseClient';

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface Employe {
  id: string;
  organisation_id: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  date_naissance: string | null;
  date_entree: string;
  date_sortie: string | null;
  numero_avs: string | null;
  type_contrat: 'cdi' | 'cdd' | 'stage' | 'apprenti';
  taux_activite: number;
  salaire_brut_mensuel: number;
  lpp_taux_employe: number;
  ijm_taux: number;
  impot_source: boolean;
  taux_is: number;
  iban: string | null;
  actif: boolean;
  notes: string | null;
  cree_le: string;
  mis_a_jour_le: string;
}

export interface FicheSalaire {
  id: string;
  employe_id: string;
  organisation_id: string;
  periode: string; // YYYY-MM
  salaire_brut: number;
  // Déductions employé
  avs_employe: number;
  ai_employe: number;
  apg_employe: number;
  ac_employe: number;
  lpp_employe: number;
  ijm_employe: number;
  impot_source: number;
  autres_deductions: number;
  total_deductions: number;
  salaire_net: number;
  // Charges patronales
  avs_employeur: number;
  ai_employeur: number;
  apg_employeur: number;
  ac_employeur: number;
  lpp_employeur: number;
  allocations_familiales: number;
  total_charges_patronales: number;
  cout_total_employeur: number;
  // Extras
  primes: number;
  heures_sup: number;
  indemnites: number;
  statut: 'brouillon' | 'valide' | 'paye';
  date_paiement: string | null;
  notes: string | null;
  cree_le: string;
}

// ─────────────────────────────────────────────
// Taux légaux suisses 2026
// ─────────────────────────────────────────────

export const TAUX_LEGAUX = {
  AVS_EMPLOYE: 4.35,        // %
  AVS_EMPLOYEUR: 4.35,      // %
  AI_EMPLOYE: 0.70,
  AI_EMPLOYEUR: 0.70,
  APG_EMPLOYE: 0.25,
  APG_EMPLOYEUR: 0.25,
  AC_EMPLOYE: 1.10,         // Sur salaire jusqu'à 148'200 CHF/an
  AC_EMPLOYEUR: 1.10,
  AC_PLAFOND_ANNUEL: 148200,
};

// ─────────────────────────────────────────────
// Calcul d'une fiche de salaire
// ─────────────────────────────────────────────

export const calculerFicheSalaire = (
  employe: Employe,
  salaireBrut: number,
  extras?: { primes?: number; heuresSup?: number; indemnites?: number }
): Omit<FicheSalaire, 'id' | 'employe_id' | 'organisation_id' | 'periode' | 'cree_le'> => {
  const primes = extras?.primes || 0;
  const heures_sup = extras?.heuresSup || 0;
  const indemnites = extras?.indemnites || 0;
  const salaireBrutTotal = salaireBrut + primes + heures_sup + indemnites;

  // Cotisations AVS / AI / APG (sur salaire total)
  const avs_employe = Math.round(salaireBrutTotal * TAUX_LEGAUX.AVS_EMPLOYE / 100 * 100) / 100;
  const ai_employe = Math.round(salaireBrutTotal * TAUX_LEGAUX.AI_EMPLOYE / 100 * 100) / 100;
  const apg_employe = Math.round(salaireBrutTotal * TAUX_LEGAUX.APG_EMPLOYE / 100 * 100) / 100;

  // AC : plafonné à 148'200 CHF/an → 12'350 CHF/mois
  const plafondMensuelAC = TAUX_LEGAUX.AC_PLAFOND_ANNUEL / 12;
  const baseAC = Math.min(salaireBrutTotal, plafondMensuelAC);
  const ac_employe = Math.round(baseAC * TAUX_LEGAUX.AC_EMPLOYE / 100 * 100) / 100;

  // LPP et IJM selon les taux individuels de l'employé
  const lpp_employe = Math.round(salaireBrutTotal * (employe.lpp_taux_employe ?? 5.0) / 100 * 100) / 100;
  const ijm_employe = Math.round(salaireBrutTotal * (employe.ijm_taux ?? 1.5) / 100 * 100) / 100;

  // Impôt à la source
  const impot_source = employe.impot_source
    ? Math.round(salaireBrutTotal * (employe.taux_is ?? 0) / 100 * 100) / 100
    : 0;

  const autres_deductions = 0;
  const total_deductions =
    avs_employe + ai_employe + apg_employe + ac_employe +
    lpp_employe + ijm_employe + impot_source + autres_deductions;
  const salaire_net = Math.round((salaireBrutTotal - total_deductions) * 100) / 100;

  // Charges patronales
  const avs_employeur = Math.round(salaireBrutTotal * TAUX_LEGAUX.AVS_EMPLOYEUR / 100 * 100) / 100;
  const ai_employeur = Math.round(salaireBrutTotal * TAUX_LEGAUX.AI_EMPLOYEUR / 100 * 100) / 100;
  const apg_employeur = Math.round(salaireBrutTotal * TAUX_LEGAUX.APG_EMPLOYEUR / 100 * 100) / 100;
  const ac_employeur = Math.round(baseAC * TAUX_LEGAUX.AC_EMPLOYEUR / 100 * 100) / 100;
  // Parité LPP employeur = part employé (simplification usuelle)
  const lpp_employeur = lpp_employe;
  const allocations_familiales = 0; // À paramétrer selon canton

  const total_charges_patronales =
    avs_employeur + ai_employeur + apg_employeur + ac_employeur +
    lpp_employeur + allocations_familiales;
  const cout_total_employeur = Math.round((salaireBrutTotal + total_charges_patronales) * 100) / 100;

  return {
    salaire_brut: salaireBrut,
    avs_employe,
    ai_employe,
    apg_employe,
    ac_employe,
    lpp_employe,
    ijm_employe,
    impot_source,
    autres_deductions,
    total_deductions,
    salaire_net,
    avs_employeur,
    ai_employeur,
    apg_employeur,
    ac_employeur,
    lpp_employeur,
    allocations_familiales,
    total_charges_patronales,
    cout_total_employeur,
    primes,
    heures_sup,
    indemnites,
    statut: 'brouillon' as const,
    date_paiement: null,
    notes: null,
  };
};

// ─────────────────────────────────────────────
// CRUD Employés
// ─────────────────────────────────────────────

export const getEmployes = async (organisationId: string): Promise<Employe[]> => {
  const { data, error } = await supabase
    .from('employes')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('nom', { ascending: true });

  if (error) {
    console.error('Erreur chargement employés:', error);
    throw error;
  }
  return data || [];
};

export const createEmploye = async (
  employeData: Omit<Employe, 'id' | 'cree_le' | 'mis_a_jour_le'>
): Promise<Employe> => {
  const { data, error } = await supabase
    .from('employes')
    .insert([{
      ...employeData,
      cree_le: new Date().toISOString(),
      mis_a_jour_le: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    console.error('Erreur création employé:', error);
    throw error;
  }
  return data;
};

export const updateEmploye = async (id: string, updates: Partial<Employe>): Promise<Employe> => {
  const { id: _, cree_le, ...safeUpdates } = updates;

  const { data, error } = await supabase
    .from('employes')
    .update({ ...safeUpdates, mis_a_jour_le: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour employé:', error);
    throw error;
  }
  return data;
};

export const deleteEmploye = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('employes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur suppression employé:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// CRUD Fiches de salaire
// ─────────────────────────────────────────────

export const getFichesSalaire = async (
  organisationId: string,
  periode?: string
): Promise<FicheSalaire[]> => {
  let query = supabase
    .from('fiches_salaire')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('cree_le', { ascending: false });

  if (periode) {
    query = query.eq('periode', periode);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erreur chargement fiches:', error);
    throw error;
  }
  return data || [];
};

export const createFicheSalaire = async (
  ficheData: Omit<FicheSalaire, 'id' | 'cree_le'>
): Promise<FicheSalaire> => {
  const { data, error } = await supabase
    .from('fiches_salaire')
    .insert([{ ...ficheData, cree_le: new Date().toISOString() }])
    .select()
    .single();

  if (error) {
    console.error('Erreur création fiche:', error);
    throw error;
  }
  return data;
};

export const updateFicheSalaire = async (
  id: string,
  updates: Partial<FicheSalaire>
): Promise<FicheSalaire> => {
  const { id: _, cree_le, ...safeUpdates } = updates;

  const { data, error } = await supabase
    .from('fiches_salaire')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour fiche:', error);
    throw error;
  }
  return data;
};

export const deleteFicheSalaire = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('fiches_salaire')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur suppression fiche:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Génération des fiches pour un mois complet
// ─────────────────────────────────────────────

export const genererFichesMois = async (
  organisationId: string,
  periode: string,
  employes: Employe[]
): Promise<FicheSalaire[]> => {
  // Récupérer les fiches existantes pour cette période
  const fichesExistantes = await getFichesSalaire(organisationId, periode);
  const employesDejaTraites = new Set(fichesExistantes.map(f => f.employe_id));

  const employesActifs = employes.filter(e => e.actif && !employesDejaTraites.has(e.id));

  if (employesActifs.length === 0) {
    return fichesExistantes;
  }

  const nouvelleFiches: Omit<FicheSalaire, 'id' | 'cree_le'>[] = employesActifs.map(employe => {
    const calcul = calculerFicheSalaire(employe, employe.salaire_brut_mensuel);
    return {
      ...calcul,
      employe_id: employe.id,
      organisation_id: organisationId,
      periode,
    };
  });

  const { data, error } = await supabase
    .from('fiches_salaire')
    .insert(nouvelleFiches.map(f => ({ ...f, cree_le: new Date().toISOString() })))
    .select();

  if (error) {
    console.error('Erreur génération fiches:', error);
    throw error;
  }

  return [...fichesExistantes, ...(data || [])];
};

// ─────────────────────────────────────────────
// Export CSV
// ─────────────────────────────────────────────

export const exportFichesCSV = (fiches: FicheSalaire[], employes: Employe[]): string => {
  const employeMap = new Map(employes.map(e => [e.id, e]));

  const headers = [
    'Période', 'Prénom', 'Nom', 'Salaire brut', 'AVS employé', 'AI employé',
    'APG employé', 'AC employé', 'LPP employé', 'IJM', 'Impôt source',
    'Total déductions', 'Salaire net', 'AVS employeur', 'AI employeur',
    'APG employeur', 'AC employeur', 'LPP employeur', 'Total charges patronales',
    'Coût total employeur', 'Statut',
  ];

  const rows = fiches.map(f => {
    const emp = employeMap.get(f.employe_id);
    return [
      f.periode,
      emp?.prenom || '',
      emp?.nom || '',
      f.salaire_brut.toFixed(2),
      f.avs_employe.toFixed(2),
      f.ai_employe.toFixed(2),
      f.apg_employe.toFixed(2),
      f.ac_employe.toFixed(2),
      f.lpp_employe.toFixed(2),
      f.ijm_employe.toFixed(2),
      f.impot_source.toFixed(2),
      f.total_deductions.toFixed(2),
      f.salaire_net.toFixed(2),
      f.avs_employeur.toFixed(2),
      f.ai_employeur.toFixed(2),
      f.apg_employeur.toFixed(2),
      f.ac_employeur.toFixed(2),
      f.lpp_employeur.toFixed(2),
      f.total_charges_patronales.toFixed(2),
      f.cout_total_employeur.toFixed(2),
      f.statut,
    ];
  });

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')),
  ].join('\n');

  return csvContent;
};

// ─────────────────────────────────────────────
// Export XML Swissdec ELM 5.0 (structure simplifiée)
// ─────────────────────────────────────────────

export const exportSwissdecXML = (
  fiches: FicheSalaire[],
  employes: Employe[],
  organisation: { nom: string; id?: string }
): string => {
  const employeMap = new Map(employes.map(e => [e.id, e]));

  const employesXML = fiches
    .map(fiche => {
      const emp = employeMap.get(fiche.employe_id);
      if (!emp) return '';
      return `
    <ELM:Mitarbeiter>
      <ELM:PersonId>${emp.id}</ELM:PersonId>
      <ELM:Vorname>${escapeXml(emp.prenom)}</ELM:Vorname>
      <ELM:Nachname>${escapeXml(emp.nom)}</ELM:Nachname>
      ${emp.numero_avs ? `<ELM:AHV-Nr>${escapeXml(emp.numero_avs)}</ELM:AHV-Nr>` : ''}
      <ELM:Lohnmonat>${fiche.periode}</ELM:Lohnmonat>
      <ELM:Bruttolohn>${fiche.salaire_brut.toFixed(2)}</ELM:Bruttolohn>
      <ELM:Nettolohn>${fiche.salaire_net.toFixed(2)}</ELM:Nettolohn>
      <ELM:AHV-Abzug-AN>${fiche.avs_employe.toFixed(2)}</ELM:AHV-Abzug-AN>
      <ELM:IV-Abzug-AN>${fiche.ai_employe.toFixed(2)}</ELM:IV-Abzug-AN>
      <ELM:EO-Abzug-AN>${fiche.apg_employe.toFixed(2)}</ELM:EO-Abzug-AN>
      <ELM:ALV-Abzug-AN>${fiche.ac_employe.toFixed(2)}</ELM:ALV-Abzug-AN>
      <ELM:BVG-Abzug-AN>${fiche.lpp_employe.toFixed(2)}</ELM:BVG-Abzug-AN>
      <ELM:KTG-Abzug-AN>${fiche.ijm_employe.toFixed(2)}</ELM:KTG-Abzug-AN>
      <ELM:Quellensteuer>${fiche.impot_source.toFixed(2)}</ELM:Quellensteuer>
      <ELM:TotalAbzuege>${fiche.total_deductions.toFixed(2)}</ELM:TotalAbzuege>
      <ELM:AHV-Abzug-AG>${fiche.avs_employeur.toFixed(2)}</ELM:AHV-Abzug-AG>
      <ELM:IV-Abzug-AG>${fiche.ai_employeur.toFixed(2)}</ELM:IV-Abzug-AG>
      <ELM:EO-Abzug-AG>${fiche.apg_employeur.toFixed(2)}</ELM:EO-Abzug-AG>
      <ELM:ALV-Abzug-AG>${fiche.ac_employeur.toFixed(2)}</ELM:ALV-Abzug-AG>
      <ELM:BVG-Abzug-AG>${fiche.lpp_employeur.toFixed(2)}</ELM:BVG-Abzug-AG>
      <ELM:TotalAG>${fiche.total_charges_patronales.toFixed(2)}</ELM:TotalAG>
      <ELM:GesamtkostenAG>${fiche.cout_total_employeur.toFixed(2)}</ELM:GesamtkostenAG>
    </ELM:Mitarbeiter>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ELM:Nachricht xmlns:ELM="http://www.swissdec.ch/schema/elm/20221101/ELMSalary" Version="5.0">
  <ELM:Kopf>
    <ELM:Absender>${escapeXml(organisation.nom)}</ELM:Absender>
    <ELM:Erstellungsdatum>${new Date().toISOString()}</ELM:Erstellungsdatum>
    <ELM:Version>5.0</ELM:Version>
  </ELM:Kopf>
  <ELM:Unternehmen>
    <ELM:Name>${escapeXml(organisation.nom)}</ELM:Name>
    <ELM:Lohndaten>${employesXML}
    </ELM:Lohndaten>
  </ELM:Unternehmen>
</ELM:Nachricht>`;
};

const escapeXml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};
