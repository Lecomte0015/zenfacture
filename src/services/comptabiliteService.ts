import { supabase } from '@/lib/supabase';
import { getOrganisationId } from '@/lib/getOrganisationId';

// ============= INTERFACES =============

export interface CompteComptable {
  id: string;
  organisation_id: string;
  numero: string;
  nom: string;
  type_compte: 'actif' | 'passif' | 'charge' | 'produit';
  categorie: string;
  est_systeme: boolean;
  cree_le?: string;
}

export interface ExerciceComptable {
  id: string;
  organisation_id: string;
  annee: number;
  date_debut: string;
  date_fin: string;
  statut: 'ouvert' | 'cloture';
  cree_le?: string;
}

export interface EcritureComptable {
  id: string;
  organisation_id: string;
  exercice_id: string;
  date_ecriture: string;
  numero_piece: string;
  libelle: string;
  compte_debit_id: string;
  compte_credit_id: string;
  montant: number;
  devise: string;
  facture_id?: string;
  depense_id?: string;
  transaction_id?: string;
  cree_le?: string;
}

export interface EcritureAvecComptes extends EcritureComptable {
  compte_debit?: CompteComptable;
  compte_credit?: CompteComptable;
}

export interface LigneGrandLivre {
  date: string;
  libelle: string;
  numero_piece: string;
  debit: number;
  credit: number;
  solde: number;
}

export interface CategorieBilan {
  nom: string;
  comptes: {
    numero: string;
    nom: string;
    montant: number;
  }[];
  total: number;
}

export interface Bilan {
  actifs: CategorieBilan[];
  passifs: CategorieBilan[];
  totalActifs: number;
  totalPassifs: number;
  date: string;
}

export interface CompteResultat {
  produits: CategorieBilan[];
  charges: CategorieBilan[];
  chiffreAffaires: number;
  margeBrute: number;
  resultatExploitation: number;
  resultatNet: number;
  dateDebut: string;
  dateFin: string;
}

// ============= HELPER FUNCTIONS =============

function buildTreeStructure(comptes: CompteComptable[]): CompteComptable[] {
  // Trier par numéro de compte
  return comptes.sort((a, b) => a.numero.localeCompare(b.numero));
}

// ============= PLAN COMPTABLE =============

export async function getAccounts(organisationId?: string): Promise<CompteComptable[]> {
  const orgId = organisationId || await getOrganisationId();

  const { data, error } = await supabase
    .from('plan_comptable')
    .select('*')
    .eq('organisation_id', orgId)
    .order('numero', { ascending: true });

  if (error) {
    console.error('Erreur lors du chargement des comptes:', error);
    throw error;
  }

  return buildTreeStructure(data || []);
}

export async function createAccount(
  compte: Omit<CompteComptable, 'id' | 'organisation_id' | 'cree_le'>
): Promise<CompteComptable> {
  const organisationId = await getOrganisationId();

  const { data, error } = await supabase
    .from('plan_comptable')
    .insert([{
      ...compte,
      organisation_id: organisationId,
      est_systeme: false,
    }])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création du compte:', error);
    throw error;
  }

  return data;
}

export async function updateAccount(
  id: string,
  updates: Partial<Omit<CompteComptable, 'id' | 'organisation_id' | 'est_systeme'>>
): Promise<CompteComptable> {
  // Vérifier que ce n'est pas un compte système
  const { data: existingAccount, error: fetchError } = await supabase
    .from('plan_comptable')
    .select('est_systeme')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (existingAccount?.est_systeme) {
    throw new Error('Les comptes système ne peuvent pas être modifiés');
  }

  const { data, error } = await supabase
    .from('plan_comptable')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour du compte:', error);
    throw error;
  }

  return data;
}

export async function deleteAccount(id: string): Promise<void> {
  // Vérifier que ce n'est pas un compte système
  const { data: existingAccount, error: fetchError } = await supabase
    .from('plan_comptable')
    .select('est_systeme')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (existingAccount?.est_systeme) {
    throw new Error('Les comptes système ne peuvent pas être supprimés');
  }

  // Vérifier qu'il n'y a pas d'écritures associées
  const { data: ecritures } = await supabase
    .from('ecritures_comptables')
    .select('id')
    .or(`compte_debit_id.eq.${id},compte_credit_id.eq.${id}`)
    .limit(1);

  if (ecritures && ecritures.length > 0) {
    throw new Error('Impossible de supprimer un compte avec des écritures associées');
  }

  const { error } = await supabase
    .from('plan_comptable')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    throw error;
  }
}

// ============= EXERCICES COMPTABLES =============

export async function getExercices(organisationId?: string): Promise<ExerciceComptable[]> {
  const orgId = organisationId || await getOrganisationId();

  const { data, error } = await supabase
    .from('exercices_comptables')
    .select('*')
    .eq('organisation_id', orgId)
    .order('annee', { ascending: false });

  if (error) {
    console.error('Erreur lors du chargement des exercices:', error);
    throw error;
  }

  return data || [];
}

export async function createExercice(
  exercice: Omit<ExerciceComptable, 'id' | 'organisation_id' | 'cree_le'>
): Promise<ExerciceComptable> {
  const organisationId = await getOrganisationId();

  const { data, error } = await supabase
    .from('exercices_comptables')
    .insert([{
      annee: exercice.annee,
      date_debut: exercice.date_debut,
      date_fin: exercice.date_fin,
      statut: 'ouvert',
      organisation_id: organisationId,
    }])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création de l\'exercice:', error);
    throw error;
  }

  return data;
}

export async function closeExercice(id: string): Promise<ExerciceComptable> {
  const { data, error } = await supabase
    .from('exercices_comptables')
    .update({ statut: 'cloture' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la clôture de l\'exercice:', error);
    throw error;
  }

  return data;
}

// ============= ÉCRITURES COMPTABLES =============

export interface GetEcrituresFilters {
  dateDebut?: string;
  dateFin?: string;
  compteId?: string;
  exerciceId?: string;
}

export async function getEcritures(
  filters?: GetEcrituresFilters,
  organisationId?: string
): Promise<EcritureAvecComptes[]> {
  const orgId = organisationId || await getOrganisationId();

  let query = supabase
    .from('ecritures_comptables')
    .select(`
      *,
      compte_debit:compte_debit_id(id, numero, nom, type_compte, categorie),
      compte_credit:compte_credit_id(id, numero, nom, type_compte, categorie)
    `)
    .eq('organisation_id', orgId)
    .order('date_ecriture', { ascending: false })
    .order('cree_le', { ascending: false });

  if (filters?.dateDebut) {
    query = query.gte('date_ecriture', filters.dateDebut);
  }

  if (filters?.dateFin) {
    query = query.lte('date_ecriture', filters.dateFin);
  }

  if (filters?.compteId) {
    query = query.or(`compte_debit_id.eq.${filters.compteId},compte_credit_id.eq.${filters.compteId}`);
  }

  if (filters?.exerciceId) {
    query = query.eq('exercice_id', filters.exerciceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erreur lors du chargement des écritures:', error);
    throw error;
  }

  return data || [];
}

export async function createEcriture(
  ecriture: Omit<EcritureComptable, 'id' | 'organisation_id' | 'cree_le'>
): Promise<EcritureComptable> {
  const organisationId = await getOrganisationId();

  const { data, error } = await supabase
    .from('ecritures_comptables')
    .insert([{
      organisation_id: organisationId,
      exercice_id: ecriture.exercice_id,
      date_ecriture: ecriture.date_ecriture,
      numero_piece: ecriture.numero_piece,
      libelle: ecriture.libelle,
      compte_debit_id: ecriture.compte_debit_id,
      compte_credit_id: ecriture.compte_credit_id,
      montant: ecriture.montant,
      devise: ecriture.devise || 'CHF',
      facture_id: ecriture.facture_id,
      depense_id: ecriture.depense_id,
      transaction_id: ecriture.transaction_id,
    }])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création de l\'écriture:', error);
    throw error;
  }

  return data;
}

export async function updateEcriture(
  id: string,
  updates: Partial<Omit<EcritureComptable, 'id' | 'organisation_id'>>
): Promise<EcritureComptable> {
  const { data, error } = await supabase
    .from('ecritures_comptables')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour de l\'écriture:', error);
    throw error;
  }

  return data;
}

export async function deleteEcriture(id: string): Promise<void> {
  const { error } = await supabase
    .from('ecritures_comptables')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur lors de la suppression de l\'écriture:', error);
    throw error;
  }
}

// ============= GRAND LIVRE =============

export async function getGrandLivre(
  organisationId: string,
  compteId: string,
  dateDebut: string,
  dateFin: string
): Promise<LigneGrandLivre[]> {
  const ecritures = await getEcritures(
    { dateDebut, dateFin, compteId },
    organisationId
  );

  const lignes: LigneGrandLivre[] = [];
  let solde = 0;

  // Trier par date
  const ecrituresSortees = ecritures.sort((a, b) =>
    new Date(a.date_ecriture).getTime() - new Date(b.date_ecriture).getTime()
  );

  for (const ecriture of ecrituresSortees) {
    const debit = ecriture.compte_debit_id === compteId ? ecriture.montant : 0;
    const credit = ecriture.compte_credit_id === compteId ? ecriture.montant : 0;
    solde += debit - credit;

    lignes.push({
      date: ecriture.date_ecriture,
      libelle: ecriture.libelle,
      numero_piece: ecriture.numero_piece,
      debit,
      credit,
      solde,
    });
  }

  return lignes;
}

// ============= BILAN =============

export async function getBilan(
  organisationId: string,
  dateFin: string
): Promise<Bilan> {
  const comptes = await getAccounts(organisationId);
  const ecritures = await getEcritures(
    { dateFin },
    organisationId
  );

  // Calculer les soldes de chaque compte
  const soldesComptes = new Map<string, number>();

  for (const ecriture of ecritures) {
    const debit = soldesComptes.get(ecriture.compte_debit_id) || 0;
    soldesComptes.set(ecriture.compte_debit_id, debit + ecriture.montant);

    const credit = soldesComptes.get(ecriture.compte_credit_id) || 0;
    soldesComptes.set(ecriture.compte_credit_id, credit - ecriture.montant);
  }

  // Grouper par type et catégorie
  const actifs: Map<string, CategorieBilan> = new Map();
  const passifs: Map<string, CategorieBilan> = new Map();

  for (const compte of comptes) {
    const solde = soldesComptes.get(compte.id) || 0;

    if (solde === 0) continue;

    const categorie = compte.categorie || 'Autres';
    const map = compte.type_compte === 'actif' ? actifs : passifs;

    if (!map.has(categorie)) {
      map.set(categorie, {
        nom: categorie,
        comptes: [],
        total: 0,
      });
    }

    const cat = map.get(categorie)!;
    cat.comptes.push({
      numero: compte.numero,
      nom: compte.nom,
      montant: Math.abs(solde),
    });
    cat.total += Math.abs(solde);
  }

  const actifsArray = Array.from(actifs.values());
  const passifsArray = Array.from(passifs.values());

  return {
    actifs: actifsArray,
    passifs: passifsArray,
    totalActifs: actifsArray.reduce((sum, cat) => sum + cat.total, 0),
    totalPassifs: passifsArray.reduce((sum, cat) => sum + cat.total, 0),
    date: dateFin,
  };
}

// ============= COMPTE DE RÉSULTAT =============

export async function getCompteResultat(
  organisationId: string,
  dateDebut: string,
  dateFin: string
): Promise<CompteResultat> {
  const comptes = await getAccounts(organisationId);
  const ecritures = await getEcritures(
    { dateDebut, dateFin },
    organisationId
  );

  // Calculer les soldes de chaque compte
  const soldesComptes = new Map<string, number>();

  for (const ecriture of ecritures) {
    const debit = soldesComptes.get(ecriture.compte_debit_id) || 0;
    soldesComptes.set(ecriture.compte_debit_id, debit + ecriture.montant);

    const credit = soldesComptes.get(ecriture.compte_credit_id) || 0;
    soldesComptes.set(ecriture.compte_credit_id, credit - ecriture.montant);
  }

  // Grouper par type et catégorie
  const produits: Map<string, CategorieBilan> = new Map();
  const charges: Map<string, CategorieBilan> = new Map();

  for (const compte of comptes) {
    const solde = soldesComptes.get(compte.id) || 0;

    if (solde === 0) continue;

    const categorie = compte.categorie || 'Autres';
    const map = compte.type_compte === 'produit' ? produits : compte.type_compte === 'charge' ? charges : null;

    if (!map) continue;

    if (!map.has(categorie)) {
      map.set(categorie, {
        nom: categorie,
        comptes: [],
        total: 0,
      });
    }

    const cat = map.get(categorie)!;
    cat.comptes.push({
      numero: compte.numero,
      nom: compte.nom,
      montant: Math.abs(solde),
    });
    cat.total += Math.abs(solde);
  }

  const produitsArray = Array.from(produits.values());
  const chargesArray = Array.from(charges.values());

  const totalProduits = produitsArray.reduce((sum, cat) => sum + cat.total, 0);
  const totalCharges = chargesArray.reduce((sum, cat) => sum + cat.total, 0);

  // Calculer les indicateurs
  const chiffreAffaires = produitsArray.find(c => c.nom === 'Ventes')?.total || 0;
  const coutAchats = chargesArray.find(c => c.nom === 'Achats')?.total || 0;
  const margeBrute = chiffreAffaires - coutAchats;
  const resultatExploitation = totalProduits - totalCharges;
  const resultatNet = resultatExploitation;

  return {
    produits: produitsArray,
    charges: chargesArray,
    chiffreAffaires,
    margeBrute,
    resultatExploitation,
    resultatNet,
    dateDebut,
    dateFin,
  };
}

// ============= ÉCRITURES AUTOMATIQUES =============

export async function createAutoEcriture(
  type: 'facture' | 'paiement' | 'depense',
  data: any,
  organisationId: string
): Promise<EcritureComptable | null> {
  // Récupérer les comptes système nécessaires
  const { data: comptesData } = await supabase
    .from('plan_comptable')
    .select('*')
    .eq('organisation_id', organisationId)
    .eq('est_systeme', true);

  if (!comptesData || comptesData.length === 0) {
    console.warn('Aucun compte système trouvé pour les écritures automatiques');
    return null;
  }

  // Trouver l'exercice en cours
  const { data: exerciceData } = await supabase
    .from('exercices_comptables')
    .select('*')
    .eq('organisation_id', organisationId)
    .eq('statut', 'ouvert')
    .lte('date_debut', new Date().toISOString().split('T')[0])
    .gte('date_fin', new Date().toISOString().split('T')[0])
    .maybeSingle();

  if (!exerciceData) {
    console.warn('Aucun exercice en cours trouvé');
    return null;
  }

  let compteDebit: CompteComptable | undefined;
  let compteCredit: CompteComptable | undefined;

  switch (type) {
    case 'facture':
      // Débit: Créances clients / Crédit: Ventes
      compteDebit = comptesData.find((c: any) => c.numero === '1100');
      compteCredit = comptesData.find((c: any) => c.numero === '3000');
      break;
    case 'paiement':
      // Débit: Banque / Crédit: Créances clients
      compteDebit = comptesData.find((c: any) => c.numero === '1000');
      compteCredit = comptesData.find((c: any) => c.numero === '1100');
      break;
    case 'depense':
      // Débit: Charges / Crédit: Banque
      compteDebit = comptesData.find((c: any) => c.numero === '4000');
      compteCredit = comptesData.find((c: any) => c.numero === '1000');
      break;
  }

  if (!compteDebit || !compteCredit) {
    console.warn('Comptes système introuvables pour type:', type);
    return null;
  }

  const ecriture: Omit<EcritureComptable, 'id' | 'organisation_id' | 'cree_le'> = {
    exercice_id: exerciceData.id,
    date_ecriture: data.date || new Date().toISOString().split('T')[0],
    numero_piece: data.numero || `AUTO-${Date.now()}`,
    libelle: data.libelle || `${type} automatique`,
    compte_debit_id: compteDebit.id,
    compte_credit_id: compteCredit.id,
    montant: data.montant || 0,
    devise: 'CHF',
    facture_id: type === 'facture' ? data.id : undefined,
    depense_id: type === 'depense' ? data.id : undefined,
  };

  return await createEcriture(ecriture);
}
