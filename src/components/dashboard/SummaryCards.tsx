import React from 'react';
import { FiDollarSign, FiTrendingUp, FiClock, FiCheckCircle } from 'react-icons/fi';
import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceData } from '@/services/invoiceService';

const formatCurrency = (amount: number | string | undefined): string => {
  if (amount === undefined || amount === null) return '0.00 CHF';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) || 0 : amount;
  return new Intl.NumberFormat('fr-CH', { 
    style: 'currency', 
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(num);
};

type SummaryCardProps = {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down';
};

const SummaryCard = ({ title, value, change, icon, trend }: SummaryCardProps) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-md bg-primary-100 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd>
              <div className="text-lg font-medium text-gray-900">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
      <div className="mt-4">
        <div className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'} flex items-center`}>
          {trend === 'up' ? (
            <svg
              className="self-center flex-shrink-0 h-5 w-5 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="self-center flex-shrink-0 h-5 w-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span className="ml-1">{change}</span>
        </div>
      </div>
    </div>
  </div>
);

const SummaryCards: React.FC = () => {
  const { invoices = [], loading: isLoading } = useInvoices({ limit: 100 });
  
  // Calculer les statistiques des factures
  const stats = React.useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
      };
    }

    const now = new Date();
    
    return (invoices as InvoiceData[]).reduce<{
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
      overdueAmount: number;
      totalInvoices: number;
      paidInvoices: number;
      pendingInvoices: number;
      overdueInvoices: number;
    }>(
      (acc, invoice) => {
        const total = invoice.total || 0;
        const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
        const isOverdue = dueDate && dueDate < now && invoice.status !== 'paid';
        const isPaid = invoice.status === 'paid';
        const isPending = !isPaid && !isOverdue && invoice.status !== 'cancelled';

        return {
          totalAmount: acc.totalAmount + total,
          paidAmount: isPaid ? acc.paidAmount + total : acc.paidAmount,
          pendingAmount: isPending ? acc.pendingAmount + total : acc.pendingAmount,
          overdueAmount: isOverdue ? acc.overdueAmount + total : acc.overdueAmount,
          totalInvoices: acc.totalInvoices + 1,
          paidInvoices: isPaid ? acc.paidInvoices + 1 : acc.paidInvoices,
          pendingInvoices: isPending ? acc.pendingInvoices + 1 : acc.pendingInvoices,
          overdueInvoices: isOverdue ? acc.overdueInvoices + 1 : acc.overdueInvoices,
        };
      },
      {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
      }
    );
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
        ))}
      </div>
    );
  }

  const {
    totalAmount,
    paidAmount,
    pendingAmount,
    overdueAmount,
    totalInvoices,
    paidInvoices,
  } = stats;

  // Calculer les pourcentages
  const paidPercentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
  const pendingPercentage = totalAmount > 0 ? Math.round((pendingAmount / totalAmount) * 100) : 0;
  const overduePercentage = totalAmount > 0 ? Math.round((overdueAmount / totalAmount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Chiffre d'affaires"
        value={formatCurrency(totalAmount)}
        change={`${paidPercentage}% payé`}
        icon={<FiDollarSign className="h-6 w-6 text-primary-600" />}
        trend={paidPercentage >= 50 ? 'up' : 'down'}
      />
      <SummaryCard
        title="Factures payées"
        value={`${paidInvoices} / ${totalInvoices}`}
        change={`${totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0}%`}
        icon={<FiCheckCircle className="h-6 w-6 text-green-600" />}
        trend={paidInvoices / (totalInvoices || 1) >= 0.5 ? 'up' : 'down'}
      />
      <SummaryCard
        title="En attente"
        value={formatCurrency(pendingAmount)}
        change={`${pendingPercentage}% du total`}
        icon={<FiClock className="h-6 w-6 text-yellow-600" />}
        trend={pendingPercentage > 30 ? 'down' : 'up'}
      />
      <SummaryCard
        title="En retard"
        value={formatCurrency(overdueAmount)}
        change={`${overduePercentage}% du total`}
        icon={<FiTrendingUp className="h-6 w-6 text-red-600" />}
        trend={overduePercentage > 10 ? 'down' : 'up'}
      />
    </div>
  );
};

export default SummaryCards;
