import React, { useMemo, useState } from 'react';
import { FiDownload, FiPrinter, FiMail, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { InvoiceData } from '@/services/invoiceService';
import 'react-toastify/dist/ReactToastify.css';
import FeatureGuard from '../FeatureGuard';
import { Button } from '@/components/ui/button';
import { useTrial } from '@/hooks';
import { useAuth } from '@/context/AuthContext';
// Bannière d'essai terminé intégrée directement dans le composant

// Type pour les propriétés du composant
interface RecentInvoicesProps {
  invoices: InvoiceData[];
  onDelete: (id: string) => void;
  onEdit: (invoice: InvoiceData) => void;
  onStatusChange?: (id: string, status: InvoiceData['status']) => void;
  isLoading?: boolean;
  error?: string | null;
}

declare global {
  interface Window {
    jsPDF: any;
  }
}

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';


const RecentInvoices: React.FC<RecentInvoicesProps> = ({
  invoices = [],
  onDelete,
  onEdit,
  onStatusChange = () => {},
  isLoading = false,
  error = null,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    
    return invoices.filter((invoice: InvoiceData) => {
      try {
        const searchLower = searchTerm.toLowerCase();
        const clientName = invoice.client_name || 'Client inconnu';
        const invoiceNumber = invoice.invoice_number || `FACT-${invoice.id.slice(0, 8).toUpperCase()}`;
        const clientEmail = invoice.client_email || '';
        
        const matchesSearch = searchTerm === '' || 
          clientName.toLowerCase().includes(searchLower) ||
          invoiceNumber.toLowerCase().includes(searchLower) ||
          clientEmail.toLowerCase().includes(searchLower);
        
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      } catch (error) {
        console.error('Error filtering invoices:', error);
        return false;
      }
    });
  }, [invoices, searchTerm, statusFilter]);

  const handlePrint = (invoice: InvoiceData, e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    try {
      window.print();
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast.error('Erreur lors de l\'impression de la facture');
    }
  };

  const handleSendEmail = async (invoice: InvoiceData, e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.stopPropagation();
    try {
      const subject = `Facture ${invoice.invoice_number} - ZENFACTURE SA`;
      const body = `Bonjour,%0D%0A%0D%0AVeuillez trouver ci-jointe la facture n°${invoice.invoice_number} d'un montant de ${invoice.total?.toFixed(2)} CHF.%0D%0A%0D%0ACordialement,%0AL'équipe ZENFACTURE SA`;
      window.location.href = `mailto:${invoice.client_email}?subject=${encodeURIComponent(subject)}&body=${body}`;
    } catch (error) {
      console.error('Error preparing email:', error);
      toast.error('Erreur lors de la préparation de l\'email');
    }
  };

  const handleDownload = async (invoice: InvoiceData, e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.stopPropagation();
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new window.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add PDF content
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('FACTURE', 105, 20, { align: 'center' });
      
      // Add invoice details
      doc.setFontSize(12);
      doc.text(`N° ${invoice.invoice_number}`, 15, 30);
      doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, 15, 40);
      
      // Add client information
      doc.text('Facturé à:', 15, 60);
      doc.text(invoice.client_name, 15, 70);
      if (invoice.client_company) doc.text(invoice.client_company, 15, 75);
      if (invoice.client_address) doc.text(invoice.client_address, 15, 80);
      if (invoice.client_zip && invoice.client_city) {
        doc.text(`${invoice.client_zip} ${invoice.client_city}`, 15, 85);
      }
      
      // Add items table
      const startY = 110;
      const lineHeight = 7;
      let currentY = startY;
      
      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(15, startY - 10, 180, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 20, startY - 4);
      doc.text('Qté', 120, startY - 4, { align: 'right' });
      doc.text('Prix unitaire', 140, startY - 4, { align: 'right' });
      doc.text('Total', 180, startY - 4, { align: 'right' });
      
      // Table rows
      doc.setFont('helvetica', 'normal');
      invoice.items.forEach((item, index) => {
        const y = startY + (index * lineHeight);
        doc.text(item.description, 20, y);
        doc.text(item.quantity.toString(), 120, y, { align: 'right' });
        doc.text(`${item.unit_price.toFixed(2)} CHF`, 140, y, { align: 'right' });
        doc.text(`${(item.quantity * item.unit_price).toFixed(2)} CHF`, 180, y, { align: 'right' });
        currentY = y;
      });
      
      // Totals
      currentY += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Sous-total:', 150, currentY, { align: 'right' });
      doc.text(`${invoice.subtotal.toFixed(2)} CHF`, 180, currentY, { align: 'right' });
      
      currentY += 7;
      doc.text(`TVA (${invoice.items[0]?.tax_rate || 8.1}%):`, 150, currentY, { align: 'right' });
      doc.text(`${invoice.tax_amount.toFixed(2)} CHF`, 180, currentY, { align: 'right' });
      
      currentY += 10;
      doc.setFontSize(14);
      doc.text('Total:', 150, currentY, { align: 'right' });
      doc.text(`${invoice.total.toFixed(2)} CHF`, 180, currentY, { align: 'right' });
      
      // Save the PDF
      doc.save(`facture-${invoice.invoice_number}.pdf`);
      
      toast.success('Téléchargement du PDF réussi');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const handleDelete = (invoice: InvoiceData, e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la facture ${invoice.invoice_number || invoice.id} ?`)) {
      onDelete(invoice.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { canAccessFeature, isTrialExpired, hasActiveSubscription } = useTrial();
  const { user } = useAuth();
  
  // Fonction pour gérer la création d'une nouvelle facture
  const handleAddNewInvoice = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    // Vérifier si l'utilisateur peut créer une nouvelle facture
    if (!canAccessFeature('invoices', { currentUsage: filteredInvoices.length })) {
      toast.error('Vous avez atteint la limite de factures pour votre forfait.');
      return;
    }
    
    // Créer une facture vide pour l'édition
    const newInvoice: Omit<InvoiceData, 'id' | 'created_at' | 'updated_at'> & { id: string } = {
      id: 'new',
      user_id: user?.id || '',
      invoice_number: '',
      client_name: '',
      client_email: '',
      date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours plus tard
      status: 'draft',
      items: [],
      subtotal: 0,
      tax_amount: 0,
      total: 0,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onEdit(newInvoice as unknown as InvoiceData);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Bannière d'essai terminé */}
      {isTrialExpired && !hasActiveSubscription && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Votre période d'essai est terminée. <a href="/pricing" className="font-medium text-yellow-700 underline hover:text-yellow-600">Mettez à niveau votre forêt</a> pour continuer à profiter de toutes les fonctionnalités.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">Factures récentes</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Rechercher une facture..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyée</option>
            <option value="paid">Payée</option>
            <option value="overdue">En retard</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune facture trouvée
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Facture
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr 
                  key={invoice.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onEdit(invoice)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoice_number || `FACT-${invoice.id.slice(0, 8).toUpperCase()}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.client_name || 'Client inconnu'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.total?.toFixed(2)} CHF
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      invoice.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      invoice.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status === 'paid' ? 'Payée' :
                       invoice.status === 'sent' ? 'Envoyée' :
                       invoice.status === 'overdue' ? 'En retard' :
                       invoice.status === 'draft' ? 'Brouillon' :
                       invoice.status === 'cancelled' ? 'Annulée' :
                       'Inconnu'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <FeatureGuard requiredFeature="export_pdf">
                        <button
                          onClick={(e) => {
                            if (!canAccessFeature('export_pdf')) {
                              toast.error('Cette fonctionnalité n\'est pas incluse dans votre forêt actuel.');
                              return;
                            }
                            handleDownload(invoice, e);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Télécharger en PDF"
                          disabled={isTrialExpired && !hasActiveSubscription}
                        >
                          <FiDownload size={16} />
                        </button>
                      </FeatureGuard>
                      
                      <FeatureGuard requiredFeature="print_invoice">
                        <button
                          onClick={(e) => handlePrint(invoice, e)}
                          className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Imprimer"
                          disabled={isTrialExpired && !hasActiveSubscription}
                        >
                          <FiPrinter size={16} />
                        </button>
                      </FeatureGuard>
                      
                      <FeatureGuard requiredFeature="email_invoice">
                        <button
                          onClick={(e) => {
                            if (!canAccessFeature('email_invoice')) {
                              toast.error('L\'envoi d\'emails n\'est pas inclus dans votre forêt actuel.');
                              return;
                            }
                            handleSendEmail(invoice, e);
                          }}
                          className={`text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 ${
                            !invoice.client_email || (isTrialExpired && !hasActiveSubscription) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title={!invoice.client_email ? 'Aucun email défini' : 'Envoyer par email'}
                          disabled={!invoice.client_email || (isTrialExpired && !hasActiveSubscription)}
                        >
                          <FiMail size={16} />
                        </button>
                      </FeatureGuard>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!canAccessFeature('invoices', { currentUsage: filteredInvoices.length })) {
                            toast.error('Vous avez atteint la limite de factures pour votre forêt.');
                            return;
                          }
                          onEdit(invoice);
                        }}
                        className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Modifier"
                        disabled={isTrialExpired && !hasActiveSubscription}
                      >
                        <FiEdit2 size={18} />
                      </button>
                      
                      <button
                        onClick={(e) => handleDelete(invoice, e)}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Supprimer"
                        disabled={isTrialExpired && !hasActiveSubscription}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="mt-6 flex justify-end">
        <FeatureGuard requiredFeature="create_invoice">
          <Button
            onClick={handleAddNewInvoice}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            disabled={isTrialExpired && !hasActiveSubscription}
          >
            <FiPlus size={16} />
            Nouvelle facture
          </Button>
        </FeatureGuard>
      </div>
    </div>
  );
};

export default React.memo(RecentInvoices);
