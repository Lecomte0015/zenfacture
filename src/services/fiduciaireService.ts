import { supabase } from '@/lib/supabase';
import { getOrganisationId } from '@/lib/getOrganisationId';

export interface AccesFiduciaire {
  id: string;
  organisation_id: string;
  email_fiduciaire: string;
  nom_fiduciaire: string;
  token_acces: string;
  permissions: string[] | {
    factures: boolean;
    depenses: boolean;
    comptabilite: boolean;
    tva: boolean;
  };
  actif: boolean;
  derniere_connexion?: string;
  cree_le: string;
}

export interface ExportFiduciaire {
  id: string;
  organisation_id: string;
  acces_id: string;
  type_export: 'plan_comptable' | 'journal' | 'bilan' | 'tva';
  periode_debut?: string;
  periode_fin?: string;
  fichier_url?: string;
  cree_le: string;
}

/**
 * Génère un token aléatoire sécurisé
 */
const generateToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Crée un nouvel accès fiduciaire
 */
export const createAccess = async (
  email: string,
  nom: string,
  permissions: AccesFiduciaire['permissions']
): Promise<AccesFiduciaire> => {
  const organisationId = await getOrganisationId();

  const token = generateToken();

  // Convertir permissions objet en tableau si nécessaire
  let permissionsArray: string[];
  if (Array.isArray(permissions)) {
    permissionsArray = permissions;
  } else {
    permissionsArray = Object.entries(permissions)
      .filter(([_, v]) => v)
      .map(([k]) => k);
  }

  const { data, error } = await supabase
    .from('acces_fiduciaire')
    .insert([{
      organisation_id: organisationId,
      email_fiduciaire: email,
      nom_fiduciaire: nom,
      token_acces: token,
      permissions: JSON.stringify(permissionsArray),
      actif: true,
    }])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création de l\'accès fiduciaire:', error);
    throw error;
  }

  return data;
};

/**
 * Récupère tous les accès fiduciaires de l'organisation
 */
export const getAccesses = async (): Promise<AccesFiduciaire[]> => {
  const organisationId = await getOrganisationId();

  const { data, error } = await supabase
    .from('acces_fiduciaire')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('cree_le', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des accès:', error);
    throw error;
  }

  return data || [];
};

/**
 * Révoque un accès fiduciaire
 */
export const revokeAccess = async (accessId: string): Promise<void> => {
  const { error } = await supabase
    .from('acces_fiduciaire')
    .update({ actif: false })
    .eq('id', accessId);

  if (error) {
    console.error('Erreur lors de la révocation de l\'accès:', error);
    throw error;
  }
};

/**
 * Met à jour les permissions d'un accès fiduciaire
 */
export const updatePermissions = async (
  accessId: string,
  permissions: AccesFiduciaire['permissions']
): Promise<AccesFiduciaire> => {
  // Convertir permissions objet en tableau si nécessaire
  let permissionsArray: string[];
  if (Array.isArray(permissions)) {
    permissionsArray = permissions;
  } else {
    permissionsArray = Object.entries(permissions)
      .filter(([_, v]) => v)
      .map(([k]) => k);
  }

  const { data, error } = await supabase
    .from('acces_fiduciaire')
    .update({ permissions: JSON.stringify(permissionsArray) })
    .eq('id', accessId)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour des permissions:', error);
    throw error;
  }

  return data;
};

/**
 * Récupère un accès fiduciaire par son token
 */
export const getAccessByToken = async (token: string): Promise<AccesFiduciaire | null> => {
  const { data, error } = await supabase
    .from('acces_fiduciaire')
    .select('*')
    .eq('token_acces', token)
    .eq('actif', true)
    .maybeSingle();

  if (error) {
    console.error('Erreur lors de la récupération de l\'accès:', error);
    throw error;
  }

  return data;
};

/**
 * Met à jour la date de dernière connexion
 */
export const updateLastConnection = async (accessId: string): Promise<void> => {
  const { error } = await supabase
    .from('acces_fiduciaire')
    .update({
      derniere_connexion: new Date().toISOString()
    })
    .eq('id', accessId);

  if (error) {
    console.error('Erreur lors de la mise à jour de la dernière connexion:', error);
    throw error;
  }
};

/**
 * Génère les données d'export selon le type
 */
export const generateExportData = async (
  organisationId: string,
  type: 'plan_comptable' | 'journal' | 'bilan' | 'tva',
  periodeDebut?: string,
  periodeFin?: string
): Promise<any> => {
  try {
    switch (type) {
      case 'plan_comptable':
        return await generatePlanComptable(organisationId);

      case 'journal':
        return await generateJournal(organisationId, periodeDebut, periodeFin);

      case 'bilan':
        return await generateBilan(organisationId, periodeDebut, periodeFin);

      case 'tva':
        return await generateTVA(organisationId, periodeDebut, periodeFin);

      default:
        throw new Error('Type d\'export non supporté');
    }
  } catch (error) {
    console.error('Erreur lors de la génération de l\'export:', error);
    throw error;
  }
};

/**
 * Génère le plan comptable
 */
const generatePlanComptable = async (organisationId: string) => {
  const { data, error } = await supabase
    .from('plan_comptable')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('numero');

  if (error) throw error;

  return {
    headers: ['Numéro', 'Nom', 'Type', 'Catégorie'],
    rows: data?.map((compte: any) => [
      compte.numero,
      compte.nom,
      compte.type_compte,
      compte.categorie
    ]) || []
  };
};

/**
 * Génère le journal comptable
 */
const generateJournal = async (
  organisationId: string,
  periodeDebut?: string,
  periodeFin?: string
) => {
  let query = supabase
    .from('ecritures_comptables')
    .select(`
      *,
      compte_debit:compte_debit_id(numero, nom),
      compte_credit:compte_credit_id(numero, nom)
    `)
    .eq('organisation_id', organisationId)
    .order('date_ecriture', { ascending: true });

  if (periodeDebut) {
    query = query.gte('date_ecriture', periodeDebut);
  }
  if (periodeFin) {
    query = query.lte('date_ecriture', periodeFin);
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    headers: ['Date', 'Pièce', 'Libellé', 'Compte Débit', 'Compte Crédit', 'Montant'],
    rows: data?.map((ecriture: any) => [
      ecriture.date_ecriture,
      ecriture.numero_piece || '-',
      ecriture.libelle,
      ecriture.compte_debit?.numero || '-',
      ecriture.compte_credit?.numero || '-',
      ecriture.montant || 0
    ]) || []
  };
};

/**
 * Génère le bilan
 */
const generateBilan = async (
  organisationId: string,
  periodeDebut?: string,
  periodeFin?: string
) => {
  // Récupérer les factures
  let facturesQuery = supabase
    .from('factures')
    .select('total, status, issue_date, created_at')
    .eq('organisation_id', organisationId);

  if (periodeDebut) facturesQuery = facturesQuery.gte('created_at', periodeDebut);
  if (periodeFin) facturesQuery = facturesQuery.lte('created_at', periodeFin);

  const { data: factures, error: facturesError } = await facturesQuery;
  if (facturesError) throw facturesError;

  // Récupérer les dépenses
  let depensesQuery = supabase
    .from('depenses')
    .select('montant, date')
    .eq('organisation_id', organisationId);

  if (periodeDebut) depensesQuery = depensesQuery.gte('date', periodeDebut);
  if (periodeFin) depensesQuery = depensesQuery.lte('date', periodeFin);

  const { data: depenses, error: depensesError } = await depensesQuery;
  if (depensesError) throw depensesError;

  const totalVentes = factures?.reduce((sum: number, f: any) => sum + (f.total || 0), 0) || 0;
  const totalDepenses = depenses?.reduce((sum: number, d: any) => sum + (d.montant || 0), 0) || 0;
  const resultat = totalVentes - totalDepenses;

  return {
    headers: ['Catégorie', 'Montant'],
    rows: [
      ['Total Ventes', totalVentes],
      ['Total Dépenses', totalDepenses],
      ['Résultat', resultat]
    ]
  };
};

/**
 * Génère le rapport TVA
 */
const generateTVA = async (
  organisationId: string,
  periodeDebut?: string,
  periodeFin?: string
) => {
  let query = supabase
    .from('factures')
    .select('total, tax_amount, created_at, status')
    .eq('organisation_id', organisationId);

  if (periodeDebut) query = query.gte('created_at', periodeDebut);
  if (periodeFin) query = query.lte('created_at', periodeFin);

  const { data, error } = await query;
  if (error) throw error;

  const totalTVA = data?.reduce((sum: number, f: any) => sum + (f.tax_amount || 0), 0) || 0;
  const totalHT = data?.reduce((sum: number, f: any) => sum + ((f.total || 0) - (f.tax_amount || 0)), 0) || 0;

  return {
    headers: ['Type', 'Base HT', 'TVA', 'Total TTC'],
    rows: [
      ['TVA Collectée', totalHT.toFixed(2), totalTVA.toFixed(2), (totalHT + totalTVA).toFixed(2)]
    ]
  };
};

/**
 * Crée un export fiduciaire
 */
export const createExport = async (
  accesId: string,
  type: ExportFiduciaire['type_export'],
  format: 'csv' | 'json',
  periodeDebut?: string,
  periodeFin?: string
): Promise<ExportFiduciaire> => {
  // Récupérer l'accès pour obtenir l'organisation_id
  const { data: accesData } = await supabase
    .from('acces_fiduciaire')
    .select('organisation_id')
    .eq('id', accesId)
    .single();

  if (!accesData) {
    throw new Error('Accès non trouvé');
  }

  // Générer les données d'export
  const exportData = await generateExportData(
    accesData.organisation_id,
    type,
    periodeDebut,
    periodeFin
  );

  // Convertir en CSV si nécessaire
  let fileContent = exportData;
  if (format === 'csv') {
    fileContent = convertToCSV(exportData);
  }

  const { data: exportRecord, error } = await supabase
    .from('exports_fiduciaire')
    .insert([{
      organisation_id: accesData.organisation_id,
      acces_id: accesId,
      type_export: type,
      periode_debut: periodeDebut,
      periode_fin: periodeFin,
    }])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création de l\'export:', error);
    throw error;
  }

  return exportRecord;
};

/**
 * Récupère tous les exports d'une organisation
 */
export const getExports = async (): Promise<ExportFiduciaire[]> => {
  const organisationId = await getOrganisationId();

  const { data, error } = await supabase
    .from('exports_fiduciaire')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('cree_le', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des exports:', error);
    throw error;
  }

  return data || [];
};

/**
 * Convertit des données en format CSV
 */
const convertToCSV = (data: { headers: string[], rows: any[][] }): string => {
  const { headers, rows } = data;
  const csvRows = [
    headers.join(','),
    ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
  ];
  return csvRows.join('\n');
};

/**
 * Télécharge les données d'un export au format CSV ou JSON
 */
export const downloadExport = async (exportRecord: ExportFiduciaire, format: 'csv' | 'json' = 'csv'): Promise<void> => {
  // Re-generate the data for download
  const exportData = await generateExportData(
    exportRecord.organisation_id,
    exportRecord.type_export,
    exportRecord.periode_debut,
    exportRecord.periode_fin
  );

  const data = format === 'csv'
    ? convertToCSV(exportData)
    : JSON.stringify(exportData, null, 2);

  const blob = new Blob([data], {
    type: format === 'csv' ? 'text/csv' : 'application/json'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export_${exportRecord.type_export}_${new Date().toISOString().split('T')[0]}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
