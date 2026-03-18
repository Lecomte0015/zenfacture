import React, { useState, useEffect } from 'react';
import { FileText, Receipt, Calculator, BookOpen, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Invoice } from '@/types/invoice';
import type { Expense } from '@/types/expense';

interface FiduciaireDashboardProps {
  organisationId: string;
  permissions: string[];
  token: string;
}

interface SummaryData {
  totalInvoices: number;
  totalExpenses: number;
  vatBalance: number;
  accountingEntries: number;
}

const FiduciaireDashboard: React.FC<FiduciaireDashboardProps> = ({
  organisationId,
  permissions,
  token,
}) => {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalInvoices: 0,
    totalExpenses: 0,
    vatBalance: 0,
    accountingEntries: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [organisationId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('factures')
        .select('*')
        .eq('organisation_id', organisationId)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('depenses')
        .select('*')
        .eq('organisation_id', organisationId)
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;

      // Calculate summary data
      const totalInvoices = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
      const vatBalance = invoices?.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0) || 0;
      const accountingEntries = (invoices?.length || 0) + (expenses?.length || 0);

      setSummaryData({
        totalInvoices,
        totalExpenses,
        vatBalance,
        accountingEntries,
      });

      setRecentInvoices(invoices?.slice(0, 10) || []);
      setRecentExpenses(expenses?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-CH');
  };

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const key = header.toLowerCase().replace(' ', '_');
        const value = row[key] || '';
        return `"${value}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportInvoices = () => {
    const invoiceData = recentInvoices.map(inv => ({
      numero: inv.invoiceNumber || '',
      client: inv.client,
      date: formatDate(inv.date),
      echeance: formatDate(inv.dueDate),
      montant: inv.total,
      statut: inv.status,
    }));
    exportToCSV(invoiceData, 'factures.csv', ['Numéro', 'Client', 'Date', 'Échéance', 'Montant', 'Statut']);
  };

  const exportExpenses = () => {
    const expenseData = recentExpenses.map(exp => ({
      description: exp.description,
      categorie: exp.category,
      date: formatDate(exp.date),
      montant: exp.amount,
      statut: exp.status,
    }));
    exportToCSV(expenseData, 'depenses.csv', ['Description', 'Catégorie', 'Date', 'Montant', 'Statut']);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord fiduciaire</h1>
          <p className="text-gray-600 mt-2">Vue d'ensemble financière du client</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total factures</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(summaryData.totalInvoices)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total dépenses</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(summaryData.totalExpenses)}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <Receipt className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Solde TVA</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(summaryData.vatBalance)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Calculator className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Écritures comptables</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {summaryData.accountingEntries}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Factures récentes</h2>
              <button
                onClick={exportInvoices}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Échéance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Aucune facture trouvée
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.client}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : invoice.status === 'sent'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {invoice.status === 'paid'
                            ? 'Payée'
                            : invoice.status === 'overdue'
                            ? 'En retard'
                            : invoice.status === 'sent'
                            ? 'Envoyée'
                            : invoice.status === 'draft'
                            ? 'Brouillon'
                            : invoice.status === 'cancelled'
                            ? 'Annulée'
                            : 'En attente'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Dépenses récentes</h2>
              <button
                onClick={exportExpenses}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Aucune dépense trouvée
                    </td>
                  </tr>
                ) : (
                  recentExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            expense.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : expense.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : expense.status === 'reimbursed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {expense.status === 'approved'
                            ? 'Approuvée'
                            : expense.status === 'rejected'
                            ? 'Rejetée'
                            : expense.status === 'reimbursed'
                            ? 'Remboursée'
                            : 'En attente'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiduciaireDashboard;
