import { supabase } from '@/lib/supabaseClient';
import { getOrganisationId } from '@/lib/getOrganisationId';

// Interfaces
export interface BankAccount {
  id: string;
  organisation_id: string;
  nom: string;
  iban: string;
  bic: string | null;
  devise: string;
  solde: number;
  actif: boolean;
  cree_le: string;
}

export interface BankTransaction {
  id: string;
  compte_id: string;
  organisation_id: string;
  reference: string | null;
  montant: number;
  devise: string;
  date_valeur: string;
  date_comptable: string | null;
  description: string | null;
  type: 'credit' | 'debit';
  statut_rapprochement: 'non_rapproche' | 'rapproche' | 'ignore';
  facture_id: string | null;
  depense_id: string | null;
  cree_le: string;
}

export interface BankFile {
  id: string;
  organisation_id: string;
  nom_fichier: string;
  type_fichier: 'camt.053' | 'camt.054' | 'pain.001';
  statut: 'en_cours' | 'complete' | 'erreur';
  nb_transactions: number;
  date_import: string;
  cree_le: string;
}

export interface TransactionFilter {
  dateDebut?: string;
  dateFin?: string;
  type?: 'credit' | 'debit';
  statutRapprochement?: 'non_rapproche' | 'rapproche' | 'ignore';
  compteId?: string;
}

// Bank Account CRUD
export async function createAccount(
  account: Omit<BankAccount, 'id' | 'organisation_id' | 'cree_le'>
): Promise<BankAccount> {
  const organisationId = await getOrganisationId();

  const { data, error } = await supabase
    .from('comptes_bancaires')
    .insert({
      ...account,
      organisation_id: organisationId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAccounts(): Promise<BankAccount[]> {
  const organisationId = await getOrganisationId();

  const { data, error } = await supabase
    .from('comptes_bancaires')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('cree_le', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateAccount(
  id: string,
  updates: Partial<Omit<BankAccount, 'id' | 'organisation_id' | 'cree_le'>>
): Promise<BankAccount> {
  const { data, error } = await supabase
    .from('comptes_bancaires')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase
    .from('comptes_bancaires')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Transaction CRUD
export async function getTransactions(
  filters?: TransactionFilter
): Promise<BankTransaction[]> {
  const organisationId = await getOrganisationId();

  let query = supabase
    .from('transactions_bancaires')
    .select('*')
    .eq('organisation_id', organisationId);

  if (filters?.dateDebut) {
    query = query.gte('date_valeur', filters.dateDebut);
  }
  if (filters?.dateFin) {
    query = query.lte('date_valeur', filters.dateFin);
  }
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.statutRapprochement) {
    query = query.eq('statut_rapprochement', filters.statutRapprochement);
  }
  if (filters?.compteId) {
    query = query.eq('compte_id', filters.compteId);
  }

  query = query.order('date_valeur', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function importTransactions(
  compteId: string,
  transactions: Omit<BankTransaction, 'id' | 'organisation_id' | 'compte_id' | 'cree_le'>[]
): Promise<BankTransaction[]> {
  const organisationId = await getOrganisationId();

  const transactionsToInsert = transactions.map(t => ({
    ...t,
    compte_id: compteId,
    organisation_id: organisationId,
  }));

  const { data, error } = await supabase
    .from('transactions_bancaires')
    .insert(transactionsToInsert)
    .select();

  if (error) throw error;
  return data || [];
}

export async function updateReconciliation(
  transactionId: string,
  statutRapprochement: 'non_rapproche' | 'rapproche' | 'ignore',
  factureId?: string | null,
  depenseId?: string | null
): Promise<BankTransaction> {
  const { data, error } = await supabase
    .from('transactions_bancaires')
    .update({
      statut_rapprochement: statutRapprochement,
      facture_id: factureId || null,
      depense_id: depenseId || null,
    })
    .eq('id', transactionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// File CRUD
export async function createFileRecord(
  file: Omit<BankFile, 'id' | 'organisation_id' | 'cree_le'>
): Promise<BankFile> {
  const organisationId = await getOrganisationId();

  const { data, error } = await supabase
    .from('fichiers_bancaires')
    .insert({
      ...file,
      organisation_id: organisationId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getFiles(): Promise<BankFile[]> {
  const organisationId = await getOrganisationId();

  const { data, error } = await supabase
    .from('fichiers_bancaires')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('cree_le', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Reconciliation functions
export async function reconcileTransaction(
  transactionId: string,
  factureId?: string,
  depenseId?: string
): Promise<BankTransaction> {
  return updateReconciliation(
    transactionId,
    'rapproche',
    factureId,
    depenseId
  );
}

export async function autoReconcile(organisationId?: string): Promise<{
  matched: number;
  total: number;
}> {
  const orgId = organisationId || await getOrganisationId();

  // Récupérer les transactions non rapprochées
  const { data: transactions, error: txError } = await supabase
    .from('transactions_bancaires')
    .select('*')
    .eq('organisation_id', orgId)
    .eq('statut_rapprochement', 'non_rapproche');

  if (txError) throw txError;
  if (!transactions) return { matched: 0, total: 0 };

  // Récupérer les factures non payées
  const { data: factures, error: facturesError } = await supabase
    .from('factures')
    .select('*')
    .eq('organisation_id', orgId)
    .in('status', ['sent', 'overdue']);

  if (facturesError) throw facturesError;

  // Récupérer les dépenses
  const { data: depenses, error: depensesError } = await supabase
    .from('depenses')
    .select('*')
    .eq('organisation_id', orgId);

  if (depensesError) throw depensesError;

  let matched = 0;

  for (const transaction of transactions) {
    // Essayer de matcher avec une facture
    if (transaction.type === 'credit' && factures) {
      const matchedFacture = factures.find(f => {
        const amountMatch = Math.abs(f.total - transaction.montant) < 0.01;
        const referenceMatch = f.qr_reference &&
          transaction.reference?.includes(f.qr_reference);
        const dateMatch = f.due_date &&
          Math.abs(new Date(f.due_date).getTime() - new Date(transaction.date_valeur).getTime())
          < 30 * 24 * 60 * 60 * 1000; // 30 jours

        return amountMatch && (referenceMatch || dateMatch);
      });

      if (matchedFacture) {
        await reconcileTransaction(transaction.id, matchedFacture.id);
        matched++;
        continue;
      }
    }

    // Essayer de matcher avec une dépense
    if (transaction.type === 'debit' && depenses) {
      const matchedDepense = depenses.find(d => {
        const amountMatch = Math.abs(d.montant - Math.abs(transaction.montant)) < 0.01;
        const dateMatch = Math.abs(
          new Date(d.date).getTime() - new Date(transaction.date_valeur).getTime()
        ) < 7 * 24 * 60 * 60 * 1000; // 7 jours

        return amountMatch && dateMatch;
      });

      if (matchedDepense) {
        await reconcileTransaction(transaction.id, undefined, matchedDepense.id);
        matched++;
      }
    }
  }

  return {
    matched,
    total: transactions.length,
  };
}
