import { FiDollarSign, FiTrendingUp, FiClock, FiCheckCircle } from 'react-icons/fi';
import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: string | number;
  total?: string | number;
  date: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
  items?: InvoiceItem[];
  notes?: string;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  subtotal?: number;
  createdAt?: string;
  updatedAt?: string;
}

const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) || 0 : amount;
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' })
    .format(num)
    .replace('CHF', 'CHF')
    .trim();
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

const SummaryCards = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour charger les factures
  const loadInvoices = useCallback(() => {
    try {
      const savedInvoices = localStorage.getItem('zenfacture_invoices');
      if (savedInvoices) {
        const parsedInvoices = JSON.parse(savedInvoices);
        if (Array.isArray(parsedInvoices)) {
          setInvoices(parsedInvoices);
        } else {
          console.warn('Les données des factures ne sont pas un tableau');
          setInvoices([]);
        }
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
      toast.error('Erreur lors du chargement des factures');
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les factures au montage du composant et écouter les changements
  useEffect(() => {
    loadInvoices();
    
    // Écouter les changements dans le localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zenfacture_invoices' || e.key === null) {
        loadInvoices();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadInvoices]);

  // Fonction pour convertir un montant en nombre (gère les virgules et points décimaux)
  const parseAmount = (amount: string | number): number => {
    if (typeof amount === 'number') return amount;
    // Remplacer les virgules par des points et convertir en nombre
    const num = parseFloat(amount.toString().replace(',', '.'));
    return isNaN(num) ? 0 : num;
  };

  // Calculer les statistiques
  const calculateStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    console.log('Calcul des statistiques pour', invoices.length, 'factures');
    
    // Revenus du mois en cours
    const monthlyRevenue = invoices
      .filter(invoice => {
        try {
          if (!invoice.date) return false;
          const invoiceDate = new Date(invoice.date);
          return (
            invoice.status === 'paid' &&
            invoiceDate.getMonth() === currentMonth &&
            invoiceDate.getFullYear() === currentYear
          );
        } catch (e) {
          console.error('Erreur lors du traitement de la date de facture:', e);
          return false;
        }
      })
      .reduce((sum, invoice) => {
        // Utiliser le montant total de la facture si disponible, sinon calculer à partir des articles
        let totalAmount = 0;
        
        if (invoice.total !== undefined) {
          totalAmount = parseAmount(invoice.total);
        } else if (invoice.amount) {
          totalAmount = parseAmount(invoice.amount);
        } else if (invoice.items && Array.isArray(invoice.items)) {
          totalAmount = invoice.items.reduce((itemSum: number, item: InvoiceItem) => {
            const itemTotal = parseAmount(item.amount) || (parseAmount(item.quantity) * parseAmount(item.unitPrice));
            return itemSum + itemTotal;
          }, 0);
        }
        
        console.log(`Facture ${invoice.id}: ${totalAmount} CHF (${invoice.status})`);
        return sum + totalAmount;
      }, 0);

    // Factures impayées
    const unpaidInvoices = invoices.filter(
      invoice => invoice.status === 'pending' || invoice.status === 'overdue' || !invoice.status
    );
    
    const unpaidAmount = unpaidInvoices.reduce((sum: number, invoice: Invoice) => {
      if (invoice.total !== undefined) {
        return sum + parseAmount(invoice.total);
      } else if (invoice.amount) {
        return sum + parseAmount(invoice.amount);
      } else if (invoice.items && Array.isArray(invoice.items)) {
        const invoiceTotal = invoice.items.reduce((itemSum: number, item: InvoiceItem) => {
          const itemAmount = item.amount || 0;
          const itemQuantity = item.quantity || 0;
          const itemUnitPrice = item.unitPrice || 0;
          const itemTotal = parseAmount(itemAmount) || (parseAmount(itemQuantity) * parseAmount(itemUnitPrice));
          return itemSum + itemTotal;
        }, 0);
        return sum + invoiceTotal;
      }
      return sum;
    }, 0);

    // Factures payées
    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
    const paidCount = paidInvoices.length;

    // Taux de croissance (comparaison avec le mois dernier)
    const lastMonthRevenue = invoices
      .filter(invoice => {
        try {
          if (!invoice.date) return false;
          const invoiceDate = new Date(invoice.date);
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const year = currentMonth === 0 ? currentYear - 1 : currentYear;
          
          return (
            invoice.status === 'paid' &&
            invoiceDate.getMonth() === lastMonth &&
            invoiceDate.getFullYear() === year
          );
        } catch (e) {
          console.error('Erreur lors du traitement de la date de facture (mois dernier):', e);
          return false;
        }
      })
      .reduce((sum: number, invoice: Invoice) => {
        if (invoice.total !== undefined) {
          return sum + parseAmount(invoice.total);
        } else if (invoice.amount) {
          return sum + parseAmount(invoice.amount);
        } else if (invoice.items && Array.isArray(invoice.items)) {
          return sum + invoice.items.reduce((itemSum: number, item: InvoiceItem) => {
            const itemAmount = item.amount || 0;
            const itemQuantity = item.quantity || 0;
            const itemUnitPrice = item.unitPrice || 0;
            return itemSum + (parseAmount(itemAmount) || (parseAmount(itemQuantity) * parseAmount(itemUnitPrice)));
          }, 0);
        }
        return sum;
      }, 0);

    // Calcul du taux de croissance
    const growthRate = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : monthlyRevenue > 0 ? 100 : 0;

    console.log('Statistiques calculées:', {
      monthlyRevenue,
      unpaidInvoices: unpaidInvoices.length,
      unpaidAmount,
      paidCount,
      growthRate,
      lastMonthRevenue
    });

    return {
      monthlyRevenue,
      unpaidInvoices: unpaidInvoices.length,
      unpaidAmount,
      paidCount,
      growthRate
    };
  };

  const { monthlyRevenue, unpaidInvoices, unpaidAmount, paidCount, growthRate } = calculateStats();
  const currentMonthName = format(new Date(), 'MMMM', { locale: fr });

  const cards = [
    {
      title: `Revenus ${currentMonthName}`,
      value: formatCurrency(monthlyRevenue),
      change: growthRate >= 0 
        ? `+${growthRate.toFixed(1)}% par rapport au mois dernier` 
        : `${growthRate.toFixed(1)}% par rapport au mois dernier`,
      icon: <FiDollarSign className="h-6 w-6 text-primary-600" />,
      trend: growthRate >= 0 ? 'up' as const : 'down' as const,
    },
    {
      title: 'Factures impayées',
      value: formatCurrency(unpaidAmount),
      change: `${unpaidInvoices} facture${unpaidInvoices > 1 ? 's' : ''} en attente`,
      icon: <FiClock className="h-6 w-6 text-yellow-600" />,
      trend: 'up' as const,
    },
    {
      title: 'Factures payées',
      value: paidCount.toString(),
      change: `sur ${invoices.length} facture${invoices.length > 1 ? 's' : ''} au total`,
      icon: <FiCheckCircle className="h-6 w-6 text-green-600" />,
      trend: 'up' as const,
    },
    {
      title: 'Taux de croissance',
      value: `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
      change: `par rapport à ${format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'MMMM', { locale: fr })}`,
      icon: <FiTrendingUp className="h-6 w-6 text-blue-600" />,
      trend: growthRate >= 0 ? 'up' as const : 'down' as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <SummaryCard key={index} {...card} />
      ))}
    </div>
  );
};

export default SummaryCards;
