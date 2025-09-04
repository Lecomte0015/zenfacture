import { FiFileText, FiDownload, FiPrinter, FiMail, FiEye, FiChevronDown, FiCheck, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useState, useRef, useEffect } from 'react';

// Composant de menu déroulant pour le statut
const StatusDropdown = ({ 
  currentStatus, 
  onStatusChange 
}: { 
  currentStatus: string; 
  onStatusChange: (status: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const statuses = [
    { value: 'paid', label: 'Payée', color: 'green' },
    { value: 'pending', label: 'En attente', color: 'yellow' },
    { value: 'overdue', label: 'En retard', color: 'red' },
  ];
  
  const currentStatusData = statuses.find(s => s.value === currentStatus) || statuses[1];
  
  // Fermer le menu quand on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          className={`inline-flex justify-between items-center w-full rounded-md px-3 py-1 text-sm font-medium ${
            currentStatusData.color === 'green' ? 'bg-green-100 text-green-800' :
            currentStatusData.color === 'red' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="true"
          aria-expanded="true"
        >
          <StatusBadge status={currentStatus} onStatusChange={onStatusChange} />
          <FiChevronDown className="ml-2 h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-1 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(status.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                  currentStatus === status.value ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
                role="menuitem"
              >
                {currentStatus === status.value && <FiCheck className="mr-2 h-4 w-4" />}
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  status.color === 'green' ? 'bg-green-500' :
                  status.color === 'red' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`}></span>
                {status.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'draft';

type Invoice = {
  id: string;
  client: string;
  amount: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
};

const statusText: Record<InvoiceStatus, string> = {
  paid: 'Payée',
  pending: 'En attente',
  overdue: 'En retard',
};

interface InvoiceRowProps {
  invoice: Invoice;
  onDownload: (invoice: Invoice, e: React.MouseEvent) => void;
  onPrint: (invoice: Invoice, e: React.MouseEvent) => void;
  onSendEmail: (invoice: Invoice, e: React.MouseEvent) => void;
  onViewDetails: (invoice: Invoice) => void;
}

const InvoiceRow = ({ 
  invoice, 
  onDownload, 
  onPrint, 
  onSendEmail, 
  onViewDetails,
  onStatusChange,
  onDelete
}: InvoiceRowProps & { 
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-50 rounded-md">
            <FiFileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">Facture #{invoice.id}</div>
            <div className="text-sm text-gray-500">{invoice.client}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{invoice.amount} CHF</div>
        <div className="text-sm text-gray-500">Échéance: {invoice.dueDate}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusDropdown 
          currentStatus={invoice.status} 
          onStatusChange={(status) => onStatusChange(invoice.id, status)}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Télécharger"
            onClick={(e) => onDownload(invoice, e)}
          >
            <FiDownload className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Imprimer"
            onClick={(e) => onPrint(invoice, e)}
          >
            <FiPrinter className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Envoyer par email"
            onClick={(e) => onSendEmail(invoice, e)}
          >
            <FiMail className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Voir la facture"
            onClick={() => onViewDetails(invoice)}
          >
            <FiEye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
                onDelete(invoice.id);
              }
            }}
            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
            title="Supprimer la facture"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Clé pour le stockage local
const INVOICES_STORAGE_KEY = 'zenfacture_invoices';

// Données par défaut pour les factures
const defaultInvoices: Invoice[] = [
  {
    id: 'INV-2023-045',
    client: 'Acme Corp',
    amount: '2,450.00',
    date: '01/08/2023',
    dueDate: '20/08/2023',
    status: 'pending',
  },
  {
    id: 'INV-2023-044',
    client: 'Globex Corporation',
    amount: '1,250.00',
    date: '28/07/2023',
    dueDate: '15/08/2023',
    status: 'pending',
  },
  {
    id: 'INV-2023-043',
    client: 'Soylent Corp',
    amount: '3,200.00',
    date: '25/07/2023',
    dueDate: '10/08/2023',
    status: 'overdue',
  },
  {
    id: 'INV-2023-042',
    client: 'Umbrella Corporation',
    amount: '4,500.00',
    date: '15/07/2023',
    dueDate: '05/08/2023',
    status: 'paid',
  },
];

const RecentInvoices = () => {
  // Charger les factures depuis le stockage local ou utiliser les données par défaut
  const loadInvoices = (): Invoice[] => {
    try {
      const savedInvoices = localStorage.getItem(INVOICES_STORAGE_KEY);
      if (savedInvoices) {
        return JSON.parse(savedInvoices);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
    }
    return [...defaultInvoices];
  };
  const [invoices, setInvoices] = useState<Invoice[]>(loadInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fonction pour sauvegarder les factures dans le localStorage
  const saveInvoices = (invoicesToSave: Invoice[]) => {
    try {
      localStorage.setItem('invoices', JSON.stringify(invoicesToSave));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des factures:', error);
      toast.error('Une erreur est survenue lors de la sauvegarde des factures');
    }
  };

  // Fonction pour charger les factures depuis le localStorage
  const loadInvoices = (): Invoice[] => {
    try {
      const savedInvoices = localStorage.getItem('invoices');
      if (savedInvoices) {
        return JSON.parse(savedInvoices);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
      toast.error('Une erreur est survenue lors du chargement des factures');
    }
    return [];
  };

  // Fonction pour gérer le changement de statut d'une facture
  const handleStatusChange = (invoiceId: string, newStatus: string) => {
    const updatedInvoices = invoices.map(invoice => {
      if (invoice.id === invoiceId) {
        return { ...invoice, status: newStatus };
      }
      return invoice;
    });
    setInvoices(updatedInvoices);
    saveInvoices(updatedInvoices);
    toast.success(`Statut de la facture ${invoiceId} mis à jour`);
  };

  // Gestion de la suppression d'une facture
  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      const updatedInvoices = invoices.filter(invoice => invoice.id !== invoiceId);
      setInvoices(updatedInvoices);
      saveInvoices(updatedInvoices);
      setSelectedInvoice(null);
      toast.success('Facture supprimée avec succès');
    }
  };

  // Fonction pour gérer l'impression d'une facture
  const handlePrint = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInvoice(invoice);
    // On ouvre la modale en mode impression
    setIsModalOpen(true);
    // On attend que la modale soit ouverte avant d'imprimer
    setTimeout(() => {
      window.print();
    }, 500);
  };



  // Fonction pour gérer le téléchargement d'une facture
  const handleDownload = async (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Charger dynamiquement les bibliothèques nécessaires
      const { jsPDF } = await import('jspdf');
      
      // Créer un nouveau document PDF
      const doc = new jsPDF();
      
      // Ajouter les informations de base
      doc.setFontSize(18);
      doc.text(`FACTURE N°${invoice.id}`, 20, 20);
      
      // Informations du client
      doc.setFontSize(12);
      doc.text(`Client: ${invoice.client}`, 20, 40);
      doc.text(`Montant: ${invoice.amount} CHF`, 20, 50);
      doc.text(`Date: ${invoice.date}`, 20, 60);
      doc.text(`Échéance: ${invoice.dueDate}`, 20, 70);
      
      // Mention légale
      doc.setFontSize(8);
      doc.text('Document généré par ZenFacture - https://zenfacture.ch', 105, 280, { align: 'center' });
      
      // Sauvegarder le PDF
      doc.save(`facture-${invoice.id}.pdf`);
      
      toast.success(`Facture ${invoice.id} téléchargée avec succès`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Une erreur est survenue lors de la génération du PDF');
    }
  };

  const handleSendEmail = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    const subject = `Facture ${invoice.id}`;
    const body = `Bonjour,\n\nVeuillez trouver ci-joint la facture ${invoice.id} d'un montant de ${invoice.amount} CHF.\n\nCordialement,\nVotre entreprise`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

// ...


  return (
    <div className="overflow-x-auto">
      <div className="align-middle inline-block min-w-full">
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  onDownload={handleDownload}
                  onPrint={handlePrint}
                  onSendEmail={handleSendEmail}
                  onViewDetails={handleOpenModal}
                  onDelete={handleDeleteInvoice}
                  onStatusChange={updateInvoiceStatus}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal pour afficher les détails de la facture */}
      {selectedInvoice && (
        <InvoiceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
};
