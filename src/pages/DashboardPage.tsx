import { useState, useEffect } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';

// Composants du tableau de bord
import SummaryCards from '@/components/dashboard/SummaryCards';
import RecentInvoices from '@/components/dashboard/RecentInvoices';
import NewInvoiceModal from '@/components/invoices/NewInvoiceModal';

// Types
type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

const statusInfo = {
  paid: { text: 'Payée', color: 'bg-green-100 text-green-800' },
  sent: { text: 'Envoyée', color: 'bg-blue-100 text-blue-800' },
  overdue: { text: 'En retard', color: 'bg-red-100 text-red-800' },
  draft: { text: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  cancelled: { text: 'Annulée', color: 'bg-gray-200 text-gray-800' }
} as const;

const DashboardPage = () => {
  const { user } = useAuth();
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  
  // Utilisation du hook useInvoices pour gérer les factures
  const { 
    invoices, 
    loading: isLoading, 
    error: invoiceError,
    addInvoice,
    editInvoice,
    removeInvoice
  } = useInvoices({ limit: 10 });

  // Gestion des erreurs
  useEffect(() => {
    if (invoiceError) {
      console.error('Erreur lors du chargement des factures:', invoiceError);
      toast.error('Erreur lors du chargement des factures');
    }
  }, [invoiceError]);

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    if (!user) {
      console.log('Utilisateur non connecté, redirection vers la page de connexion...');
      // Redirection gérée par le routeur
      return;
    }
    console.log('Utilisateur connecté:', user.id, user.email);
  }, [user]);

  // Gestion de la sauvegarde d'une facture
  const handleSaveInvoice = async (invoiceData: any) => {
    try {
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      if (editingInvoice && editingInvoice.id) {
        // Mise à jour d'une facture existante
        await editInvoice(editingInvoice.id, invoiceData);
        toast.success('Facture mise à jour avec succès');
      } else {
        // Création d'une nouvelle facture
        await addInvoice({
          ...invoiceData,
          user_id: user.id,
          status: 'draft',
          created_at: new Date().toISOString()
        });
        toast.success('Facture créée avec succès');
      }
      
      // Fermer la modale et réinitialiser l'édition
      setIsNewInvoiceModalOpen(false);
      setEditingInvoice(null);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la facture:', error);
      toast.error('Erreur lors de la sauvegarde de la facture');
    }
  };

  // Gestion de la suppression d'une facture
  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      try {
        await removeInvoice(id);
        toast.success('Facture supprimée avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression de la facture:', error);
        toast.error('Erreur lors de la suppression de la facture');
      }
    }
  };
  
  // Afficher un message de chargement initial mais ne pas bloquer
  // (On affiche le dashboard même en loading pour éviter la boucle infinie)

  // Gestion de l'édition d'une facture
  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setIsNewInvoiceModalOpen(true);
  };

  // Gestion du changement de statut d'une facture
  const handleStatusChange = async (invoiceId: string, newStatus: InvoiceStatus) => {
    try {
      await editInvoice(invoiceId, { status: newStatus });
      toast.success('Statut de la facture mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  // Si pas d'utilisateur après 5 secondes, afficher un message d'erreur
  const [showError, setShowError] = useState(false);
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setShowError(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (!user) {
    if (showError) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center bg-red-50 p-8 rounded-lg max-w-md">
            <h2 className="text-xl font-bold text-red-800 mb-4">Problème de chargement</h2>
            <p className="text-red-600 mb-4">
              Impossible de charger votre session utilisateur. Veuillez rafraîchir la page ou vous reconnecter.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre session utilisateur...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <button
          onClick={() => {
            setEditingInvoice(null);
            setIsNewInvoiceModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <span className="mr-2">+</span> Nouvelle facture
        </button>
      </div>

      {/* Cartes de synthèse */}
      <SummaryCards />

      {/* Dernières factures */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Dernières factures</h2>
        {isLoading && invoices.length === 0 ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Chargement des factures...</span>
          </div>
        ) : (
          <RecentInvoices
            invoices={invoices}
            onEdit={handleEditInvoice}
            onDelete={handleDeleteInvoice}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Modale de création/édition de facture */}
      <NewInvoiceModal
        isOpen={isNewInvoiceModalOpen}
        onClose={() => {
          setIsNewInvoiceModalOpen(false);
          setEditingInvoice(null);
        }}
        onSave={handleSaveInvoice}
        initialData={editingInvoice}
      />
    </div>
  );
};

export default DashboardPage;
