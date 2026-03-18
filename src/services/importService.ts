import { supabase } from '../lib/supabaseClient';

export interface ImportRecord {
  id: string;
  organisation_id: string;
  source: string;
  type_donnees: string;
  statut: string;
  nb_lignes: number;
  nb_importees: number;
  nb_erreurs: number;
  erreurs_detail: any | null;
  cree_le: string;
}

export interface ColumnMapping {
  [sourceColumn: string]: string;
}

/**
 * Parse un fichier CSV et retourne les en-têtes et les lignes
 */
export const parseCSV = async (file: File): Promise<{ headers: string[]; rows: any[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
          reject(new Error('Le fichier CSV est vide'));
          return;
        }

        // Détecter le séparateur (virgule, point-virgule, ou tabulation)
        const firstLine = lines[0];
        const separators = [';', ',', '\t'];
        const separator = separators.reduce((best, sep) => {
          const count = (firstLine.match(new RegExp(sep, 'g')) || []).length;
          const bestCount = (firstLine.match(new RegExp(best, 'g')) || []).length;
          return count > bestCount ? sep : best;
        });

        // Parser les en-têtes
        const headers = lines[0].split(separator).map(h => h.trim().replace(/^"|"$/g, ''));

        // Parser les lignes de données
        const rows = lines.slice(1).map(line => {
          const values = line.split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        }).filter(row => Object.values(row).some(v => v !== ''));

        resolve({ headers, rows });
      } catch (error) {
        reject(new Error('Erreur lors du parsing du fichier CSV'));
      }
    };

    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsText(file, 'UTF-8');
  });
};

/**
 * Détecte la source du CSV (Bexio, Cresus, ou Générique) basé sur les noms de colonnes
 */
export const detectSource = (headers: string[]): 'bexio' | 'cresus' | 'generic' => {
  const headersLower = headers.map(h => h.toLowerCase());

  // Colonnes typiques de Bexio
  const bexioIndicators = ['contact_type_id', 'user_id', 'owner_id', 'kb_item_status_id'];
  const hasBexioIndicators = bexioIndicators.some(indicator =>
    headersLower.some(h => h.includes(indicator))
  );

  if (hasBexioIndicators) return 'bexio';

  // Colonnes typiques de Crésus
  const cresusIndicators = ['n°', 'no', 'titre', 'compte'];
  const hasCresusIndicators = cresusIndicators.some(indicator =>
    headersLower.some(h => h === indicator || h.startsWith(indicator))
  );

  if (hasCresusIndicators) return 'cresus';

  return 'generic';
};

/**
 * Retourne le mapping de colonnes connu pour les exports Bexio
 */
export const getBexioMapping = (type: string): ColumnMapping => {
  const mappings: Record<string, ColumnMapping> = {
    clients: {
      'name_1': 'nom',
      'name_2': 'prenom',
      'mail': 'email',
      'phone_fixed': 'telephone',
      'phone_mobile': 'telephone',
      'address': 'adresse',
      'postcode': 'code_postal',
      'city': 'ville',
      'country_id': 'pays',
      'remarks': 'notes',
    },
    factures: {
      'title': 'invoice_number',
      'document_nr': 'invoice_number',
      'contact_id': 'client_id',
      'total_gross': 'total',
      'total_net': 'subtotal',
      'total': 'total',
      'date': 'date',
      'due_date': 'due_date',
      'currency_code': 'devise',
      'status': 'status',
    },
    produits: {
      'name': 'nom',
      'description': 'description',
      'unit_price': 'prix_unitaire',
      'tax_rate': 'taux_tva',
      'unit': 'unite',
      'category': 'categorie',
    },
  };

  return mappings[type] || {};
};

/**
 * Retourne le mapping de colonnes connu pour les exports Crésus
 */
export const getCresusMapping = (type: string): ColumnMapping => {
  const mappings: Record<string, ColumnMapping> = {
    clients: {
      'N°': 'numero_client',
      'No': 'numero_client',
      'Nom': 'nom',
      'Prénom': 'prenom',
      'Entreprise': 'entreprise',
      'Email': 'email',
      'Téléphone': 'telephone',
      'Adresse': 'adresse',
      'NPA': 'code_postal',
      'Localité': 'ville',
      'Pays': 'pays',
      'Remarques': 'notes',
    },
    factures: {
      'N° facture': 'invoice_number',
      'No facture': 'invoice_number',
      'Client': 'client_name',
      'Date': 'date',
      'Échéance': 'due_date',
      'Montant': 'total',
      'Total': 'total',
      'Statut': 'status',
      'Devise': 'devise',
    },
    produits: {
      'Nom': 'nom',
      'Description': 'description',
      'Prix': 'prix_unitaire',
      'Prix unitaire': 'prix_unitaire',
      'TVA': 'taux_tva',
      'Unité': 'unite',
      'Catégorie': 'categorie',
    },
  };

  return mappings[type] || {};
};

/**
 * Crée un enregistrement d'import dans la table imports
 */
export const createImportRecord = async (
  organisationId: string,
  source: string,
  type: string,
  nbLignes: number
): Promise<string> => {
  const { data, error } = await supabase
    .from('imports')
    .insert({
      organisation_id: organisationId,
      source,
      type_donnees: type,
      statut: 'en_cours',
      nb_lignes: nbLignes,
      nb_importees: 0,
      nb_erreurs: 0,
      erreurs_detail: null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Erreur lors de la création de l\'enregistrement d\'import:', error);
    throw error;
  }

  return data.id;
};

/**
 * Met à jour un enregistrement d'import
 */
export const updateImportRecord = async (
  id: string,
  nbImportees: number,
  nbErreurs: number,
  erreursDetail: any
): Promise<void> => {
  const { error } = await supabase
    .from('imports')
    .update({
      statut: nbErreurs > 0 ? 'termine_avec_erreurs' : 'termine',
      nb_importees: nbImportees,
      nb_erreurs: nbErreurs,
      erreurs_detail: erreursDetail,
    })
    .eq('id', id);

  if (error) {
    console.error('Erreur lors de la mise à jour de l\'enregistrement d\'import:', error);
    throw error;
  }
};

/**
 * Transforme une ligne selon le mapping et retourne les données formatées
 */
const transformRow = (
  row: any,
  mapping: ColumnMapping,
  type: 'clients' | 'factures' | 'produits' | 'depenses',
  organisationId: string,
  userId: string
): any => {
  const transformed: any = {
    organisation_id: organisationId,
  };

  // Appliquer le mapping
  Object.entries(mapping).forEach(([sourceCol, targetCol]) => {
    if (row[sourceCol] !== undefined && row[sourceCol] !== '') {
      transformed[targetCol] = row[sourceCol];
    }
  });

  // Transformations spécifiques par type
  if (type === 'clients') {
    transformed.pays = transformed.pays || 'CH';
    transformed.devise_preferee = transformed.devise_preferee || 'CHF';
    transformed.conditions_paiement = parseInt(transformed.conditions_paiement) || 30;

    // S'assurer qu'au moins un nom existe
    if (!transformed.nom && !transformed.prenom) {
      transformed.nom = 'Client importé';
    }
  }

  if (type === 'factures') {
    transformed.user_id = userId;
    transformed.status = transformed.status || 'draft';
    transformed.devise = transformed.devise || 'CHF';
    transformed.currency = transformed.currency || transformed.devise || 'CHF';
    transformed.items = transformed.items || [];
    transformed.subtotal = parseFloat(transformed.subtotal) || 0;
    transformed.tax = parseFloat(transformed.tax) || 0;
    transformed.total = parseFloat(transformed.total) || 0;
  }

  if (type === 'produits') {
    transformed.prix_unitaire = parseFloat(transformed.prix_unitaire) || 0;
    transformed.taux_tva = parseFloat(transformed.taux_tva) || 7.7;
    transformed.unite = transformed.unite || 'unité';
    transformed.actif = true;
  }

  if (type === 'depenses') {
    transformed.utilisateur_id = userId;
    transformed.montant = parseFloat(transformed.montant) || 0;
    transformed.statut = transformed.statut || 'en_attente';
    transformed.categorie = transformed.categorie || 'Autre';
    transformed.date = transformed.date || new Date().toISOString().split('T')[0];
  }

  return transformed;
};

/**
 * Importe des données dans la table appropriée
 */
export const importData = async (
  organisationId: string,
  source: string,
  type: 'clients' | 'factures' | 'produits' | 'depenses',
  rows: any[],
  mapping: ColumnMapping
): Promise<{ nbImportees: number; nbErreurs: number; erreurs: any[] }> => {
  // Récupérer l'utilisateur courant
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('Utilisateur non authentifié');
  }

  // Créer l'enregistrement d'import
  const importId = await createImportRecord(organisationId, source, type, rows.length);

  let nbImportees = 0;
  let nbErreurs = 0;
  const erreurs: any[] = [];

  // Déterminer la table cible
  const tables: Record<typeof type, string> = {
    clients: 'clients',
    factures: 'factures',
    produits: 'produits',
    depenses: 'depenses',
  };
  const tableName = tables[type];

  // Importer par lots de 50 pour éviter les timeouts
  const batchSize = 50;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    for (const row of batch) {
      try {
        const transformed = transformRow(row, mapping, type, organisationId, userId);

        const { error } = await supabase
          .from(tableName)
          .insert(transformed);

        if (error) {
          nbErreurs++;
          erreurs.push({
            ligne: i + batch.indexOf(row) + 2, // +2 car ligne 1 = headers
            donnees: row,
            erreur: error.message,
          });
        } else {
          nbImportees++;
        }
      } catch (error: any) {
        nbErreurs++;
        erreurs.push({
          ligne: i + batch.indexOf(row) + 2,
          donnees: row,
          erreur: error.message || 'Erreur inconnue',
        });
      }
    }
  }

  // Mettre à jour l'enregistrement d'import
  await updateImportRecord(importId, nbImportees, nbErreurs, erreurs.length > 0 ? erreurs : null);

  return { nbImportees, nbErreurs, erreurs };
};

/**
 * Récupère l'historique des imports pour une organisation
 */
export const getImportHistory = async (organisationId: string): Promise<ImportRecord[]> => {
  const { data, error } = await supabase
    .from('imports')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('cree_le', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Erreur lors de la récupération de l\'historique des imports:', error);
    throw error;
  }

  return data || [];
};

/**
 * Récupère les colonnes cibles disponibles pour un type de données
 */
export const getTargetColumns = (type: string): { key: string; label: string }[] => {
  const columns: Record<string, { key: string; label: string }[]> = {
    clients: [
      { key: 'numero_client', label: 'Numéro client' },
      { key: 'nom', label: 'Nom' },
      { key: 'prenom', label: 'Prénom' },
      { key: 'entreprise', label: 'Entreprise' },
      { key: 'email', label: 'Email' },
      { key: 'telephone', label: 'Téléphone' },
      { key: 'adresse', label: 'Adresse' },
      { key: 'code_postal', label: 'Code postal' },
      { key: 'ville', label: 'Ville' },
      { key: 'pays', label: 'Pays' },
      { key: 'devise_preferee', label: 'Devise préférée' },
      { key: 'conditions_paiement', label: 'Conditions de paiement (jours)' },
      { key: 'notes', label: 'Notes' },
    ],
    factures: [
      { key: 'invoice_number', label: 'Numéro de facture' },
      { key: 'client_id', label: 'ID Client' },
      { key: 'client_name', label: 'Nom du client' },
      { key: 'date', label: 'Date' },
      { key: 'due_date', label: 'Date d\'échéance' },
      { key: 'status', label: 'Statut' },
      { key: 'subtotal', label: 'Sous-total' },
      { key: 'tax', label: 'TVA' },
      { key: 'total', label: 'Total' },
      { key: 'devise', label: 'Devise' },
      { key: 'notes', label: 'Notes' },
    ],
    produits: [
      { key: 'nom', label: 'Nom' },
      { key: 'description', label: 'Description' },
      { key: 'prix_unitaire', label: 'Prix unitaire' },
      { key: 'taux_tva', label: 'Taux TVA (%)' },
      { key: 'unite', label: 'Unité' },
      { key: 'categorie', label: 'Catégorie' },
    ],
    depenses: [
      { key: 'description', label: 'Description' },
      { key: 'montant', label: 'Montant' },
      { key: 'categorie', label: 'Catégorie' },
      { key: 'date', label: 'Date' },
      { key: 'statut', label: 'Statut' },
      { key: 'notes', label: 'Notes' },
    ],
  };

  return columns[type] || [];
};
