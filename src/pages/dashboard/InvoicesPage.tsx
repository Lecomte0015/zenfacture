import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Plus, Eye, Download, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrganisation } from '../../context/OrganisationContext';
import InvoiceForm from '../../components/invoices/InvoiceForm';
import { InvoiceModal } from '../../components/invoices/InvoiceModal';

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  client_name: string;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}


interface InvoicesPageProps {
  newInvoice?: boolean;
}

const InvoicesPage: React.FC<InvoicesPageProps> = ({ newInvoice = false }) => {
  const [showNewInvoice, setShowNewInvoice] = useState(newInvoice);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const location = useLocation();
  const { organisationId } = useOrganisation();

  // Charger les factures
  useEffect(() => {
    fetchInvoices();
  }, [organisationId]);

  const fetchInvoices = async () => {
    if (!organisationId) return;

    try {
      setIsLoading(true);

      const { data: invoicesData, error } = await supabase
        .from('factures')
        .select(`
          id,
          invoice_number,
          issue_date,
          due_date,
          client_name,
          total,
          status
        `)
        .eq('organisation_id', organisationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedInvoices = (invoicesData || []).map((invoice: any) => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        client_name: invoice.client_name || 'Client inconnu',
        total: invoice.total || 0,
        status: invoice.status
      }));

      setInvoices(formattedInvoices);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Rafraîchir la liste des factures après l'ajout d'une nouvelle facture
  const handleInvoiceAdded = () => {
    setShowNewInvoice(false);
    fetchInvoices();
  };

  // Gérer l'affichage du formulaire basé sur l'URL ou l'état local
  React.useEffect(() => {
    setShowNewInvoice(location.pathname === '/invoices/new');
  }, [location.pathname]);

  const handleCloseForm = () => {
    setShowNewInvoice(false);
    if (location.pathname === '/invoices/new') {
      window.history.back();
    }
  };

  const handleCloseModal = (refresh?: boolean) => {
    setSelectedInvoiceId(null);
    if (refresh) {
      fetchInvoices();
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    setUpdatingStatus(invoiceId);
    try {
      const { error } = await supabase
        .from('factures')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (error) throw error;

      // Mettre à jour localement
      setInvoices(prev => prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status: newStatus as any } : inv
      ));
    } catch (error) {
      console.error('Erreur changement statut:', error);
      alert('Erreur lors du changement de statut');
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <div className="p-6">
      {showNewInvoice && <InvoiceForm onClose={handleCloseForm} onInvoiceAdded={handleInvoiceAdded} />}

      {/* Modal de visualisation de facture */}
      {selectedInvoiceId && (
        <InvoiceModal
          isOpen={true}
          onClose={handleCloseModal}
          invoiceId={selectedInvoiceId}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
        <Link
          to="/invoices/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Nouvelle facture
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Liste des factures
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Gérer vos factures existantes ou créez-en de nouvelles.
          </p>
        </div>
        <div className="overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-500">Chargement des factures...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Aucune facture pour le moment
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° Facture
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d'émission
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Échéance
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('fr-CH') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-CH') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {(invoice.total || 0).toFixed(2)} CHF
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={invoice.status}
                          onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                          disabled={updatingStatus === invoice.id}
                          className={`px-2 py-1 text-xs font-semibold rounded border-0 cursor-pointer ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : invoice.status === 'draft'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          <option value="draft">Brouillon</option>
                          <option value="sent">Envoyée</option>
                          <option value="paid">Payée</option>
                          <option value="overdue">En retard</option>
                          <option value="cancelled">Annulée</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedInvoiceId(invoice.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center"
                          title="Voir la facture"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInvoiceId(invoice.id);
                            setTimeout(() => {
                              const printBtn = document.querySelector('[title="Télécharger PDF"]') as HTMLButtonElement;
                              printBtn?.click();
                            }, 500);
                          }}
                          className="text-gray-600 hover:text-gray-900 inline-flex items-center"
                          title="Télécharger la facture"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Télécharger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;
