import React, { useState, useEffect } from 'react';
import { Link, Check, X, Search } from 'lucide-react';
import { BankTransaction } from '@/services/bankingService';
import { supabase } from '@/lib/supabaseClient';
import { useOrganisation } from '@/context/OrganisationContext';

interface ReconciliationViewProps {
  transaction: BankTransaction | null;
  onReconcile: (transactionId: string, factureId?: string, depenseId?: string) => Promise<void>;
  onIgnore: (transactionId: string) => Promise<void>;
  onClose: () => void;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  total: number;
  date: string;
  due_date: string;
  qr_reference: string | null;
}

interface Expense {
  id: string;
  description: string;
  montant: number;
  date: string;
  categorie: string;
}

export function ReconciliationView({
  transaction,
  onReconcile,
  onIgnore,
  onClose,
}: ReconciliationViewProps) {
  const [suggestions, setSuggestions] = useState<{
    invoices: Invoice[];
    expenses: Expense[];
  }>({ invoices: [], expenses: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{
    invoices: Invoice[];
    expenses: Expense[];
  }>({ invoices: [], expenses: [] });
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'invoice' | 'expense' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { organisationId } = useOrganisation();

  useEffect(() => {
    if (transaction) {
      loadSuggestions();
    }
  }, [transaction]);

  useEffect(() => {
    if (searchTerm) {
      performSearch();
    } else {
      setSearchResults({ invoices: [], expenses: [] });
    }
  }, [searchTerm]);

  const loadSuggestions = async () => {
    if (!transaction) return;

    try {
      setLoading(true);

      if (!organisationId) return;

      // For credit transactions, suggest invoices
      if (transaction.type === 'credit') {
        const { data: invoices } = await supabase
          .from('factures')
          .select('*')
          .eq('organisation_id', organisationId)
          .in('status', ['sent', 'overdue'])
          .order('date', { ascending: false })
          .limit(10);

        // Filter and score invoices
        const scoredInvoices = (invoices || [])
          .map((invoice) => {
            let score = 0;

            // Amount match (highest priority)
            if (Math.abs(invoice.total - transaction.montant) < 0.01) {
              score += 100;
            } else if (Math.abs(invoice.total - transaction.montant) < 1) {
              score += 50;
            }

            // Reference match
            if (
              invoice.qr_reference &&
              transaction.reference?.includes(invoice.qr_reference)
            ) {
              score += 80;
            }

            // Date proximity (within 30 days)
            const daysDiff = Math.abs(
              (new Date(invoice.due_date).getTime() -
                new Date(transaction.date_valeur).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            if (daysDiff <= 30) {
              score += Math.max(0, 30 - daysDiff);
            }

            return { ...invoice, score };
          })
          .filter((invoice) => invoice.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        setSuggestions((prev) => ({ ...prev, invoices: scoredInvoices }));
      }

      // For debit transactions, suggest expenses
      if (transaction.type === 'debit') {
        const { data: expenses } = await supabase
          .from('depenses')
          .select('*')
          .eq('organisation_id', organisationId)
          .order('date', { ascending: false })
          .limit(10);

        // Filter and score expenses
        const scoredExpenses = (expenses || [])
          .map((expense) => {
            let score = 0;

            // Amount match (highest priority)
            if (Math.abs(expense.montant - Math.abs(transaction.montant)) < 0.01) {
              score += 100;
            } else if (Math.abs(expense.montant - Math.abs(transaction.montant)) < 1) {
              score += 50;
            }

            // Date proximity (within 7 days)
            const daysDiff = Math.abs(
              (new Date(expense.date).getTime() -
                new Date(transaction.date_valeur).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            if (daysDiff <= 7) {
              score += Math.max(0, 20 - daysDiff * 2);
            }

            return { ...expense, score };
          })
          .filter((expense) => expense.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        setSuggestions((prev) => ({ ...prev, expenses: scoredExpenses }));
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!transaction || !searchTerm) return;

    try {
      if (!organisationId) return;

      // Search invoices
      if (transaction.type === 'credit') {
        const { data: invoices } = await supabase
          .from('factures')
          .select('*')
          .eq('organisation_id', organisationId)
          .or(
            `invoice_number.ilike.%${searchTerm}%,client_name.ilike.%${searchTerm}%`
          )
          .limit(10);

        setSearchResults((prev) => ({ ...prev, invoices: invoices || [] }));
      }

      // Search expenses
      if (transaction.type === 'debit') {
        const { data: expenses } = await supabase
          .from('depenses')
          .select('*')
          .eq('organisation_id', organisationId)
          .ilike('description', `%${searchTerm}%`)
          .limit(10);

        setSearchResults((prev) => ({ ...prev, expenses: expenses || [] }));
      }
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleReconcile = async () => {
    if (!transaction || !selectedId) return;

    try {
      if (selectedType === 'invoice') {
        await onReconcile(transaction.id, selectedId);
      } else if (selectedType === 'expense') {
        await onReconcile(transaction.id, undefined, selectedId);
      }
      onClose();
    } catch (error) {
      console.error('Error reconciling:', error);
    }
  };

  const handleIgnore = async () => {
    if (!transaction) return;

    try {
      await onIgnore(transaction.id);
      onClose();
    } catch (error) {
      console.error('Error ignoring transaction:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!transaction) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Link className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>Sélectionnez une transaction pour commencer le rapprochement</p>
      </div>
    );
  }

  const displayResults = searchTerm ? searchResults : suggestions;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Transaction Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div>
              <span className="text-sm text-gray-500">Date:</span>
              <p className="font-medium text-gray-900">
                {formatDate(transaction.date_valeur)}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Montant:</span>
              <p className={`text-lg font-semibold ${
                transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'credit' ? '+' : '-'}
                {formatCurrency(Math.abs(transaction.montant), transaction.devise)}
              </p>
            </div>
            {transaction.description && (
              <div>
                <span className="text-sm text-gray-500">Description:</span>
                <p className="text-gray-900">{transaction.description}</p>
              </div>
            )}
            {transaction.reference && (
              <div>
                <span className="text-sm text-gray-500">Référence:</span>
                <p className="font-mono text-sm text-gray-900">{transaction.reference}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Matching Items */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {transaction.type === 'credit' ? 'Factures' : 'Dépenses'}
          </h3>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Chargement...</div>
            ) : transaction.type === 'credit' ? (
              displayResults.invoices.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Aucune facture trouvée
                </div>
              ) : (
                displayResults.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    onClick={() => {
                      setSelectedType('invoice');
                      setSelectedId(invoice.id);
                    }}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedId === invoice.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {invoice.invoice_number}
                        </p>
                        <p className="text-sm text-gray-600">{invoice.client_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(invoice.total, 'CHF')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(invoice.due_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : displayResults.expenses.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Aucune dépense trouvée
              </div>
            ) : (
              displayResults.expenses.map((expense) => (
                <div
                  key={expense.id}
                  onClick={() => {
                    setSelectedType('expense');
                    setSelectedId(expense.id);
                  }}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedId === expense.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {expense.description}
                      </p>
                      <p className="text-sm text-gray-600">{expense.categorie}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(expense.montant, 'CHF')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(expense.date)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
        <button
          onClick={handleIgnore}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <X className="h-4 w-4 mr-2" />
          Ignorer
        </button>
        <button
          onClick={handleReconcile}
          disabled={!selectedId}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="h-4 w-4 mr-2" />
          Rapprocher
        </button>
      </div>
    </div>
  );
}
