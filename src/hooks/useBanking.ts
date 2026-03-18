import { useState, useEffect, useCallback } from 'react';
import {
  BankAccount,
  BankTransaction,
  BankFile,
  TransactionFilter,
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getTransactions,
  importTransactions,
  reconcileTransaction,
  autoReconcile,
  getFiles,
  createFileRecord,
} from '@/services/bankingService';
import { parseCAMT } from '@/services/iso20022Parser';

export function useBanking() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [files, setFiles] = useState<BankFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load accounts
  const loadAccounts = useCallback(async () => {
    try {
      setAccountsLoading(true);
      const data = await getAccounts();
      setAccounts(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des comptes';
      setError(errorMessage);
      console.error('Error loading accounts:', err);
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  // Load transactions
  const loadTransactions = useCallback(async (filters?: TransactionFilter) => {
    try {
      setTransactionsLoading(true);
      const data = await getTransactions(filters);
      setTransactions(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des transactions';
      setError(errorMessage);
      console.error('Error loading transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  // Load files
  const loadFiles = useCallback(async () => {
    try {
      setFilesLoading(true);
      const data = await getFiles();
      setFiles(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des fichiers';
      setError(errorMessage);
      console.error('Error loading files:', err);
    } finally {
      setFilesLoading(false);
    }
  }, []);

  // Create account
  const addAccount = useCallback(async (
    account: Omit<BankAccount, 'id' | 'organisation_id' | 'cree_le'>
  ) => {
    try {
      const newAccount = await createAccount(account);
      setAccounts(prev => [newAccount, ...prev]);
      return newAccount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du compte';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update account
  const modifyAccount = useCallback(async (
    id: string,
    updates: Partial<Omit<BankAccount, 'id' | 'organisation_id' | 'cree_le'>>
  ) => {
    try {
      const updatedAccount = await updateAccount(id, updates);
      setAccounts(prev => prev.map(acc => acc.id === id ? updatedAccount : acc));
      return updatedAccount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification du compte';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Delete account
  const removeAccount = useCallback(async (id: string) => {
    try {
      await deleteAccount(id);
      setAccounts(prev => prev.filter(acc => acc.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du compte';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Import file
  const importFile = useCallback(async (
    compteId: string,
    file: File
  ): Promise<{ transactions: BankTransaction[]; fileRecord: BankFile }> => {
    try {
      // Read file content
      const content = await file.text();

      // Parse XML
      const parsedTransactions = parseCAMT(content);

      // Determine file type
      let fileType: 'camt.053' | 'camt.054' = 'camt.053';
      if (content.includes('camt.054') || content.includes('BkToCstmrDbtCdtNtfctn')) {
        fileType = 'camt.054';
      }

      // Create file record
      const fileRecord = await createFileRecord({
        nom_fichier: file.name,
        type_fichier: fileType,
        statut: 'en_cours',
        nb_transactions: parsedTransactions.length,
        date_import: new Date().toISOString().split('T')[0],
      });

      // Import transactions
      const importedTransactions = await importTransactions(compteId, parsedTransactions);

      // Update file status
      await createFileRecord({
        ...fileRecord,
        statut: 'complete',
      });

      // Reload transactions and files
      await loadTransactions();
      await loadFiles();

      return { transactions: importedTransactions, fileRecord };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'import du fichier';
      setError(errorMessage);
      throw err;
    }
  }, [loadTransactions, loadFiles]);

  // Reconcile transaction
  const reconcile = useCallback(async (
    transactionId: string,
    factureId?: string,
    depenseId?: string
  ) => {
    try {
      const updated = await reconcileTransaction(transactionId, factureId, depenseId);
      setTransactions(prev => prev.map(tx => tx.id === transactionId ? updated : tx));
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du rapprochement';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Auto reconcile
  const runAutoReconcile = useCallback(async () => {
    try {
      const result = await autoReconcile();
      await loadTransactions();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du rapprochement automatique';
      setError(errorMessage);
      throw err;
    }
  }, [loadTransactions]);

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        loadAccounts(),
        loadTransactions(),
        loadFiles(),
      ]);
      setLoading(false);
    };

    loadAll();
  }, [loadAccounts, loadTransactions, loadFiles]);

  return {
    // State
    accounts,
    transactions,
    files,
    loading,
    accountsLoading,
    transactionsLoading,
    filesLoading,
    error,

    // Functions
    loadAccounts,
    loadTransactions,
    loadFiles,
    addAccount,
    modifyAccount,
    removeAccount,
    importFile,
    reconcile,
    runAutoReconcile,
  };
}
