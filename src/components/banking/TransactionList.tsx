import React, { useState } from 'react';
import { ArrowUpDown, Search, Check, X } from 'lucide-react';
import { BankTransaction } from '@/services/bankingService';

interface TransactionListProps {
  transactions: BankTransaction[];
  onTransactionClick: (transaction: BankTransaction) => void;
  onFilterChange: (filters: {
    dateDebut?: string;
    dateFin?: string;
    type?: 'credit' | 'debit' | '';
    statutRapprochement?: 'non_rapproche' | 'rapproche' | 'ignore' | '';
  }) => void;
  loading?: boolean;
}

export function TransactionList({
  transactions,
  onTransactionClick,
  onFilterChange,
  loading = false,
}: TransactionListProps) {
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    type: '' as 'credit' | 'debit' | '',
    statutRapprochement: '' as 'non_rapproche' | 'rapproche' | 'ignore' | '',
    search: '',
  });

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    onFilterChange({
      dateDebut: newFilters.dateDebut || undefined,
      dateFin: newFilters.dateFin || undefined,
      type: newFilters.type || undefined,
      statutRapprochement: newFilters.statutRapprochement || undefined,
    });
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        tx.description?.toLowerCase().includes(searchLower) ||
        tx.reference?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

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

  const getStatusBadge = (statut: string) => {
    const badges = {
      non_rapproche: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Non rapproché',
      },
      rapproche: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Rapproché',
      },
      ignore: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        label: 'Ignoré',
      },
    };

    const badge = badges[statut as keyof typeof badges] || badges.non_rapproche;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date début
            </label>
            <input
              type="date"
              value={filters.dateDebut}
              onChange={(e) => handleFilterChange({ ...filters, dateDebut: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date fin
            </label>
            <input
              type="date"
              value={filters.dateFin}
              onChange={(e) => handleFilterChange({ ...filters, dateFin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange({ ...filters, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="credit">Crédit</option>
              <option value="debit">Débit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={filters.statutRapprochement}
              onChange={(e) => handleFilterChange({ ...filters, statutRapprochement: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="non_rapproche">Non rapproché</option>
              <option value="rapproche">Rapproché</option>
              <option value="ignore">Ignoré</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recherche
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Description, référence..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Chargement...</div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ArrowUpDown className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>Aucune transaction trouvée</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    onClick={() => onTransactionClick(transaction)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date_valeur)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {transaction.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {transaction.reference || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                      <span
                        className={
                          transaction.type === 'credit'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {transaction.type === 'credit' ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.montant), transaction.devise)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(transaction.statut_rapprochement)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading && filteredTransactions.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total transactions:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {filteredTransactions.length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Crédits:</span>
              <span className="ml-2 font-semibold text-green-600">
                {formatCurrency(
                  filteredTransactions
                    .filter((t) => t.type === 'credit')
                    .reduce((sum, t) => sum + t.montant, 0),
                  'CHF'
                )}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Débits:</span>
              <span className="ml-2 font-semibold text-red-600">
                {formatCurrency(
                  Math.abs(
                    filteredTransactions
                      .filter((t) => t.type === 'debit')
                      .reduce((sum, t) => sum + t.montant, 0)
                  ),
                  'CHF'
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
