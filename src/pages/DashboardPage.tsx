import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiDownload } from 'react-icons/fi';
import SummaryCards from '@/components/dashboard/SummaryCards';
import RemindersSection from '@/components/dashboard/RemindersSection';
import RecentInvoices from '@/components/dashboard/RecentInvoices';
import ExpensesSection from '@/components/dashboard/ExpensesSection';
import ReportsSection from '@/components/dashboard/ReportsSection';
import NewInvoiceModal from '@/components/invoices/NewInvoiceModal';
import { toast } from 'react-toastify';

type InvoiceStatus = 'paid' | 'sent' | 'overdue' | 'draft' | 'cancelled';

const statusInfo: Record<InvoiceStatus, { text: string; color: string }> = {
  paid: { text: 'Payée', color: 'bg-green-100 text-green-800' },
  sent: { text: 'Envoyée', color: 'bg-blue-100 text-blue-800' },
  overdue: { text: 'En retard', color: 'bg-red-100 text-red-800' },
  draft: { text: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  cancelled: { text: 'Annulée', color: 'bg-gray-200 text-gray-800' }
};

import { Invoice } from '../types/invoice';

type InvoiceData = Invoice;

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);

  // Charger les factures depuis le localStorage
  useEffect(() => {
    try {
      const savedInvoices = localStorage.getItem('zenfacture_invoices');
      if (savedInvoices) {
        const parsedInvoices = JSON.parse(savedInvoices);
        if (Array.isArray(parsedInvoices)) {
          setInvoices(parsedInvoices);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
    }
  }, []);

  const handleSaveInvoice = (invoiceData: Invoice) => {
    try {
      // Formater correctement les données de la facture
      const formattedInvoice: Invoice = {
        ...invoiceData,
        // S'assurer que le montant total est correctement calculé
        total: invoiceData.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0,
        // Formater la date au format YYYY-MM-DD si nécessaire
        date: invoiceData.date ? new Date(invoiceData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate).toISOString().split('T')[0] : 
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        // S'assurer que le statut est défini et valide
        status: (['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(invoiceData.status || '')
          ? invoiceData.status
          : 'draft') as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
        // Formater les montants des articles
        items: (invoiceData.items || []).map(item => ({
          ...item,
          // S'assurer que les montants sont des nombres
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          amount: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
        }))
      } as Invoice;

      // Récupérer les factures existantes
      const savedInvoices = localStorage.getItem('zenfacture_invoices');
      let invoices: InvoiceData[] = [];
      
      try {
        invoices = savedInvoices ? JSON.parse(savedInvoices) : [];
        if (!Array.isArray(invoices)) {
          console.warn('Les données des factures ne sont pas un tableau, réinitialisation...');
          invoices = [];
        }
      } catch (e) {
        console.error('Erreur lors de la lecture des factures existantes:', e);
        invoices = [];
      }
      
      let updatedInvoices: InvoiceData[];
      
      if (editingInvoice && editingInvoice.id) {
        // Mettre à jour la facture existante
        updatedInvoices = invoices.map((inv: InvoiceData) => 
          inv.id === editingInvoice.id ? formattedInvoice : inv
        );
        toast.success('Facture mise à jour avec succès !');
      } else {
        // Créer une nouvelle facture avec un ID unique
        const newInvoice = {
          ...formattedInvoice,
          id: `INV-${Date.now()}`,
          // S'assurer que la date de création est définie pour les nouvelles factures
          date: formattedInvoice.date || new Date().toISOString().split('T')[0]
        };
        
        // Ajouter la nouvelle facture
        updatedInvoices = [...invoices, newInvoice];
        toast.success('Facture créée avec succès !');
      }
      
      // Sauvegarder dans le localStorage
      localStorage.setItem('zenfacture_invoices', JSON.stringify(updatedInvoices));
      
      // Déclencher un événement personnalisé pour notifier les autres composants
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'zenfacture_invoices',
        newValue: JSON.stringify(updatedInvoices)
      }));
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la facture:', error);
      toast.error('Une erreur est survenue lors de la sauvegarde de la facture');
    } finally {
      setIsNewInvoiceModalOpen(false);
      setEditingInvoice(null);
    }
  };

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setIsNewInvoiceModalOpen(true);
  };

  const handleStatusChange = (invoiceId: string, newStatus: Invoice['status']) => {
    try {
      const updatedInvoices = invoices.map(invoice => 
        invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
      );
      
      // Mettre à jour l'état local
      setInvoices(updatedInvoices);
      
      // Sauvegarder dans le localStorage
      localStorage.setItem('zenfacture_invoices', JSON.stringify(updatedInvoices));
      
      // Notifier les autres composants du changement
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'zenfacture_invoices',
        newValue: JSON.stringify(updatedInvoices)
      }));
      
      toast.success('Statut de la facture mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  // Fonction pour exporter les factures au format CSV
  const handleExportInvoices = useCallback(() => {
    try {
      // Récupérer les factures depuis le localStorage
      const savedInvoices = localStorage.getItem('zenfacture_invoices');
      const invoices = savedInvoices ? JSON.parse(savedInvoices) : [];
      
      if (!invoices || invoices.length === 0) {
        toast.warning('Aucune facture à exporter');
        return;
      }

      // Créer les en-têtes CSV
      const headers = [
        'N° Facture',
        'Client',
        'Montant (CHF)',
        'Date',
        'Échéance',
        'Statut',
        'Adresse Client',
        'Ville',
        'Code Postal',
        'Pays'
      ];

      // Créer les lignes de données
      const csvRows = [];
      csvRows.push(headers.join(';'));

      // Ajouter chaque facture comme une ligne CSV
      for (const invoice of invoices) {
        const row = [
          `"${invoice.id}"`,
          `"${invoice.client}"`,
          `"${invoice.amount}"`,
          `"${invoice.date}"`,
          `"${invoice.dueDate}"`,
          `"${statusInfo[invoice.status as keyof typeof statusInfo]?.text || invoice.status}"`,
          `"${invoice.clientAddress || ''}"`,
          `"${invoice.clientCity || ''}"`,
          `"${invoice.clientPostalCode || ''}"`,
          `"${invoice.clientCountry || ''}"`
        ];
        csvRows.push(row.join(';'));
      }

      // Créer le contenu CSV
      const csvContent = csvRows.join('\n');
      
      // Créer un blob avec le contenu CSV (avec BOM pour Excel)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Créer un lien de téléchargement
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `export-factures-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Export réussi : ${invoices.length} facture(s) exportée(s)`);
    } catch (error) {
      console.error('Erreur lors de l\'export des factures:', error);
      toast.error('Une erreur est survenue lors de l\'export des factures');
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-gray-600">
            Bienvenue sur votre espace de gestion ZenFacture
          </p>
          
          {/* Navigation des onglets */}
          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Aperçu
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'invoices'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Factures
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'expenses'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dépenses
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Rapports
              </button>
            </nav>
          </div>
        </div>
        
        {!['expenses', 'reports'].includes(activeTab) && (
          <div className="mt-4 flex space-x-3 md:mt-0">
            <button
              type="button"
              onClick={handleExportInvoices}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiDownload className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
              Exporter
            </button>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => setIsNewInvoiceModalOpen(true)}
            >
              <FiPlus className="-ml-1 mr-2 h-5 w-5" />
              Nouvelle facture
            </button>
          </div>
        )}
      </div>

      {/* Contenu des onglets */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <>
            <SummaryCards />
            
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Rappels et notifications</h2>
                <button className="text-sm text-primary-600 hover:text-primary-800">
                  Voir tout
                </button>
              </div>
              <RemindersSection invoices={invoices} />
            </div>
            
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Factures récentes</h2>
                <button 
                  className="text-sm text-primary-600 hover:text-primary-800"
                  onClick={() => setActiveTab('invoices')}
                >
                  Voir tout
                </button>
              </div>
              <RecentInvoices 
                invoices={invoices} 
                onEditInvoice={handleEditInvoice} 
                onDeleteInvoice={(id) => {
                  const updatedInvoices = invoices.filter(inv => inv.id !== id);
                  setInvoices(updatedInvoices);
                  localStorage.setItem('zenfacture_invoices', JSON.stringify(updatedInvoices));
                }}
                onStatusChange={handleStatusChange}
                searchTerm=""
                statusFilter="all"
              />
            </div>
          </>
        )}
        
        {activeTab === 'invoices' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Gestion des factures</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Visualisez et gérez toutes vos factures
              </p>
            </div>
            <div className="border-t border-gray-200">
              <RecentInvoices 
                invoices={invoices} 
                onEditInvoice={handleEditInvoice} 
                onDeleteInvoice={(id) => {
                  const updatedInvoices = invoices.filter(inv => inv.id !== id);
                  setInvoices(updatedInvoices);
                  localStorage.setItem('zenfacture_invoices', JSON.stringify(updatedInvoices));
                }}
                onStatusChange={handleStatusChange}
                searchTerm=""
                statusFilter="all"
              />
            </div>
          </div>
        )}
        
        {activeTab === 'expenses' && <ExpensesSection />}
        
        {activeTab === 'reports' && <ReportsSection />}
      </div>

      {/* New Invoice Modal */}
      <NewInvoiceModal
        isOpen={isNewInvoiceModalOpen}
        onClose={() => {
          setIsNewInvoiceModalOpen(false);
          setEditingInvoice(null);
        }}
        onSave={handleSaveInvoice}
        initialData={editingInvoice || undefined}
      />
    </div>
  );
};

export default DashboardPage;
