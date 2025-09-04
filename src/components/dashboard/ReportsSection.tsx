import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiPieChart, FiDownload, FiFileText, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { getMonthName } from '@/utils/dateUtils';

// Enregistrer les composants nécessaires de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Invoice {
  id: string;
  amount: number;
  status: string;
  date: string;
  dueDate?: string;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
}

const ReportsSection: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Charger les factures et dépenses depuis le localStorage
  useEffect(() => {
    try {
      // Charger les factures
      const savedInvoices = localStorage.getItem('zenfacture_invoices');
      if (savedInvoices) {
        setInvoices(JSON.parse(savedInvoices));
      }

      // Charger les dépenses
      const savedExpenses = localStorage.getItem('zenfacture_expenses');
      if (savedExpenses) {
        setExpenses(JSON.parse(savedExpenses));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour générer les données du graphique de revenus
  const getRevenueData = () => {
    const now = new Date();
    let labels: string[] = [];
    let data: number[] = [];

    if (timeRange === 'week') {
      // Derniers 7 jours
      labels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return new Intl.DateTimeFormat('fr-CH', { weekday: 'short' }).format(date);
      });

      data = Array(7).fill(0);
      invoices.forEach(invoice => {
        if (invoice.status === 'paid') {
          const invoiceDate = new Date(invoice.date);
          const diffTime = now.getTime() - invoiceDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays >= 0 && diffDays < 7) {
            data[6 - diffDays] += invoice.amount;
          }
        }
      });
    } else if (timeRange === 'month') {
      // Derniers 30 jours
      labels = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (5 - i) * 5);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      });

      data = Array(6).fill(0);
      invoices.forEach(invoice => {
        if (invoice.status === 'paid') {
          const invoiceDate = new Date(invoice.date);
          const diffTime = now.getTime() - invoiceDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays >= 0 && diffDays < 30) {
            const index = Math.min(Math.floor(diffDays / 5), 5);
            data[index] += invoice.amount;
          }
        }
      });
    } else {
      // 12 derniers mois
      labels = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        return getMonthName(date.getMonth());
      });

      data = Array(12).fill(0);
      invoices.forEach(invoice => {
        if (invoice.status === 'paid') {
          const invoiceDate = new Date(invoice.date);
          const diffMonths = (now.getFullYear() - invoiceDate.getFullYear()) * 12 + now.getMonth() - invoiceDate.getMonth();
          
          if (diffMonths >= 0 && diffMonths < 12) {
            data[11 - diffMonths] += invoice.amount;
          }
        }
      });
    }

    return {
      labels,
      datasets: [
        {
          label: 'Revenus (CHF)',
          data,
          borderColor: 'rgb(79, 70, 229)',
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };

  // Fonction pour générer les données du graphique de dépenses par catégorie
  const getExpensesByCategoryData = () => {
    const categories = new Map<string, number>();
    
    expenses.forEach(expense => {
      const current = categories.get(expense.category) || 0;
      categories.set(expense.category, current + expense.amount);
    });

    const labels = Array.from(categories.keys());
    const data = Array.from(categories.values());

    // Couleurs pour les catégories
    const backgroundColors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
    ];

    return {
      labels,
      datasets: [
        {
          label: 'Dépenses par catégorie (CHF)',
          data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderColor: 'rgba(255, 255, 255, 0.8)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Fonction pour générer les données du graphique d'état des factures
  const getInvoicesStatusData = () => {
    const statusCounts = {
      paid: 0,
      sent: 0,
      draft: 0,
      overdue: 0,
      cancelled: 0,
    };

    invoices.forEach(invoice => {
      if (statusCounts.hasOwnProperty(invoice.status)) {
        statusCounts[invoice.status as keyof typeof statusCounts]++;
      }
    });

    return {
      labels: ['Payées', 'Envoyées', 'Brouillons', 'En retard', 'Annulées'],
      datasets: [
        {
          data: [
            statusCounts.paid,
            statusCounts.sent,
            statusCounts.draft,
            statusCounts.overdue,
            statusCounts.cancelled,
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.7)',  // Vert pour payées
            'rgba(59, 130, 246, 0.7)', // Bleu pour envoyées
            'rgba(156, 163, 175, 0.7)', // Gris pour brouillons
            'rgba(239, 68, 68, 0.7)',  // Rouge pour en retard
            'rgba(107, 114, 128, 0.7)', // Gris foncé pour annulées
          ],
          borderColor: 'rgba(255, 255, 255, 0.8)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Calculer les totaux
  const totalRevenue = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const profit = totalRevenue - totalExpenses;
  const profitPercentage = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  // Fonction pour exporter les données au format CSV
  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      // Préparer les données des factures
      const invoicesData = [
        ['Type', 'ID', 'Montant (CHF)', 'Statut', 'Date', 'Date d\'échéance'],
        ...invoices.map(invoice => [
          'Facture',
          invoice.id,
          invoice.amount.toFixed(2),
          getStatusLabel(invoice.status),
          new Date(invoice.date).toLocaleDateString('fr-CH'),
          invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-CH') : 'N/A'
        ])
      ];

      // Préparer les données des dépenses
      const expensesData = [
        ['Type', 'ID', 'Montant (CHF)', 'Catégorie', 'Date'],
        ...expenses.map(expense => [
          'Dépense',
          expense.id,
          expense.amount.toFixed(2),
          expense.category,
          new Date(expense.date).toLocaleDateString('fr-CH')
        ])
      ];

      // Créer le contenu CSV
      const csvContent = [
        'RAPPORTS ZENFACTURE',
        `Période: ${getTimeRangeLabel()}`,
        `Généré le: ${new Date().toLocaleString('fr-CH')}`,
        '\nRÉSUMÉ',
        `Revenus totaux,${totalRevenue.toFixed(2)} CHF`,
        `Dépenses totales,${totalExpenses.toFixed(2)} CHF`,
        `Bénéfice net,${profit.toFixed(2)} CHF (${profitPercentage.toFixed(1)}%)`,
        `Factures impayées,${invoices.filter(i => ['sent', 'overdue'].includes(i.status)).length} sur ${invoices.length}`,
        '\nDÉTAILS DES FACTURES',
        ...invoicesData.map(row => row.join(',')),
        '\nDÉTAILS DES DÉPENSES',
        ...expensesData.map(row => row.join(','))
      ].join('\n');

      // Créer un blob et un lien de téléchargement
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      
      link.href = url;
      link.download = `rapport-zenfacture-${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Afficher une notification de succès
      toast.success('Rapport exporté avec succès', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      toast.error('Une erreur est survenue lors de l\'exportation', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction utilitaire pour obtenir le libellé du statut
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'draft': 'Brouillon',
      'sent': 'Envoyée',
      'paid': 'Payée',
      'overdue': 'En retard',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  };

  // Fonction utilitaire pour obtenir le libellé de la période
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'week':
        return '7 derniers jours';
      case 'month':
        return '30 derniers jours';
      case 'year':
        return '12 derniers mois';
      default:
        return '';
    }
  };

  // Options communes pour les graphiques
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.raw.toFixed(2)} CHF`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return `${value} CHF`;
          },
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête avec sélecteur de période */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Rapports et analyses</h2>
          <p className="mt-1 text-sm text-gray-500">
            Visualisez les performances de votre entreprise
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center w-full sm:w-auto">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap mr-2">Période :</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
              <option value="year">12 derniers mois</option>
            </select>
          </div>
          <button
            type="button"
            onClick={exportToCSV}
            disabled={isExporting}
            className={`w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${isExporting ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-700 hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Export en cours...
              </>
            ) : (
              <>
                <FiDownload className="mr-2 h-4 w-4" />
                Exporter
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-primary-500 rounded-md p-2 sm:p-3">
                <FiDollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-sm font-medium text-gray-500 truncate">Revenus totaux</p>
                <div className="flex items-baseline">
                  <p className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                    {totalRevenue.toFixed(2)} CHF
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-2 sm:p-3">
                <FiDollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-sm font-medium text-gray-500 truncate">Dépenses totales</p>
                <div className="flex items-baseline">
                  <p className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                    {totalExpenses.toFixed(2)} CHF
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-2 sm:p-3">
                <FiTrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-sm font-medium text-gray-500 truncate">Bénéfice net</p>
                <div className="flex items-baseline flex-wrap">
                  <p className="text-lg sm:text-xl font-semibold text-gray-900 mr-2 truncate">
                    {profit.toFixed(2)} CHF
                  </p>
                  <span className={`text-sm font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-2 sm:p-3">
                <FiPieChart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-sm font-medium text-gray-500 truncate">Factures impayées</p>
                <div className="flex items-baseline flex-wrap">
                  <p className="text-lg sm:text-xl font-semibold text-gray-900 mr-1">
                    {invoices.filter(i => ['sent', 'overdue'].includes(i.status)).length}
                  </p>
                  <span className="text-sm text-gray-500 ml-1">
                    sur {invoices.length} factures
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique des revenus */}
      <div className="bg-white shadow overflow-hidden rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Revenus sur la période</h3>
        <div className="h-80">
          <Line data={getRevenueData()} options={chartOptions} />
        </div>
      </div>

      {/* Graphiques secondaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Graphique des dépenses par catégorie */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dépenses par catégorie</h3>
          <div className="h-80">
            {expenses.length > 0 ? (
              <Pie data={getExpensesByCategoryData()} options={chartOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FiPieChart className="h-12 w-12 mb-2" />
                <p>Aucune donnée de dépenses disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Graphique de l'état des factures */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">État des factures</h3>
          <div className="h-80">
            {invoices.length > 0 ? (
              <Bar data={getInvoicesStatusData()} options={chartOptions} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FiFileText className="h-12 w-12 mb-2" />
                <p>Aucune facture disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tableau des dernières transactions */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Dernières transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.length === 0 && expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucune transaction à afficher
                  </td>
                </tr>
              ) : (
                // Afficher uniquement les factures pour le moment
                [...invoices]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((invoice) => (
                    <tr key={`invoice-${invoice.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.date).toLocaleDateString('fr-CH')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Facture #{invoice.id.substring(0, 6)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : invoice.status === 'sent' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status === 'paid' ? 'Payée' : 
                           invoice.status === 'sent' ? 'Envoyée' : 
                           invoice.status === 'draft' ? 'Brouillon' : 
                           invoice.status === 'overdue' ? 'En retard' : 
                           invoice.status === 'cancelled' ? 'Annulée' : invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {(invoice?.amount || 0).toFixed(2)} CHF
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsSection;
