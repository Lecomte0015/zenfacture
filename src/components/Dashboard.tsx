import React, { useState } from 'react';
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Plus, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  ArrowLeft,
  DollarSign,
  CreditCard,
  PiggyBank
} from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface Invoice {
  id: string;
  clientName: string;
  clientCompany: string;
  clientAddress: string;
  clientCity: string;
  amount: number;
  description: string;
  date: string;
  reference: string;
}

interface DashboardProps {
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onBack }) => {
  const [currentUser] = useState({
    prenom: 'Utilisateur',
    nom: 'Test'
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientCompany: '',
    clientAddress: '',
    clientCity: '',
    amount: '',
    description: '',
    reference: ''
  });

  // Calculs financiers
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const avsCharges = totalRevenue * 0.105; // 10.5% AVS/AI/APG
  const lppCharges = Math.max(0, (totalRevenue - 21330) * 0.0825); // 8.25% LPP au-dessus de 21'330
  const totalCharges = avsCharges + lppCharges;
  const netProfit = totalRevenue - totalCharges;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateQRCode = async (invoice: Invoice): Promise<string> => {
    try {
      const qrData = [
        'SPC',
        '0200',
        '1',
        'CH4431999123000889012',
        'S',
        'ZenFacture SA',
        'Route de la Paix 123',
        '1000',
        'Lausanne',
        'CH',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        invoice.amount.toFixed(2),
        'CHF',
        'S',
        invoice.clientName || '',
        invoice.clientAddress || '',
        '',
        invoice.clientCity || '',
        '',
        'CH',
        'QRR',
        invoice.reference,
        'Facture ' + invoice.reference,
        'EPD'
      ].join('\n');

      // Utiliser une promesse pour gérer la génération du QR code
      return new Promise((resolve, reject) => {
        QRCode.toDataURL(qrData, {
          width: 260,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          type: 'image/png',
          errorCorrectionLevel: 'H',
          scale: 4
        }, (err: any, url: string) => {
          if (err) {
            console.error('Erreur de génération du QR code:', err);
            reject(err);
          } else {
            resolve(url);
          }
        });
      });
    } catch (error) {
      console.error('Erreur dans generateQRCode:', error);
      throw error;
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      const pdf = new jsPDF();
      
      // En-tête ZenFacture
      pdf.setTextColor(59, 130, 246);
      pdf.setFontSize(20);
      pdf.text('ZenFacture', 20, 30);
      
      // Informations émetteur
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.text('ZenFacture SA', 20, 45);
      pdf.text('Route de la Paix 123', 20, 52);
      pdf.text('1000 Lausanne', 20, 59);
      pdf.text('Suisse', 20, 66);
      pdf.text('TVA: CHE-123.456.789', 20, 73);
      
      // Informations client
      pdf.setFontSize(12);
      pdf.text('Facturé à:', 120, 45);
      pdf.setFontSize(10);
      pdf.text(invoice.clientName || '', 120, 59);
      pdf.text(invoice.clientCompany || '', 120, 66);
      pdf.text(invoice.clientAddress || '', 120, 73);
      pdf.text(invoice.clientCity || '', 120, 80);
      
      // Titre facture
      pdf.setFontSize(16);
      pdf.text('FACTURE', 20, 100);
      
      // Numéro et date
      pdf.setFontSize(10);
      pdf.text(`N° ${invoice.reference}`, 20, 115);
      pdf.text(`Date: ${invoice.date}`, 20, 122);
      
      // Tableau
      pdf.setFontSize(12);
      pdf.text('Description', 20, 140);
      pdf.text('Montant', 150, 140);
      pdf.line(20, 145, 190, 145);
      
      pdf.setFontSize(10);
      pdf.text(invoice.description || '', 20, 155);
      pdf.text(`CHF ${invoice.amount.toFixed(2)}`, 150, 155);
      
      pdf.line(20, 165, 190, 165);
      
      // Total
      pdf.setFontSize(12);
      pdf.text('Total:', 130, 180);
      pdf.text(`CHF ${invoice.amount.toFixed(2)}`, 150, 180);
      
      // QR Code
      try {
        const qrCodeDataUrl = await generateQRCode(invoice);
        if (qrCodeDataUrl) {
          // Ajouter une bordure autour du QR code pour une meilleure visibilité
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(18, 198, 54, 54);
          
          // Ajouter le QR code
          pdf.addImage(qrCodeDataUrl, 'PNG', 20, 200, 50, 50);
          
          // Ajouter un texte en dessous du QR code
          pdf.setFontSize(8);
          pdf.text('Paiement par QR-bill', 20, 260);
        }
      } catch (error) {
        console.error('Impossible de générer le QR code:', error);
        pdf.setFontSize(10);
        pdf.text('QR Code non disponible', 20, 220);
      }
      
      // Informations de paiement
      pdf.setFontSize(10);
      pdf.text('Informations de paiement:', 80, 215);
      pdf.text('IBAN: CH44 3199 9123 0008 8901 2', 80, 225);
      pdf.text(`Référence: ${invoice.reference}`, 80, 235);
      pdf.text('Conditions: Payable dans les 30 jours', 80, 245);
      
      pdf.save(`facture-${invoice.reference}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération de la facture');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.amount || !formData.description) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      clientName: formData.clientName,
      clientCompany: formData.clientCompany,
      clientAddress: formData.clientAddress,
      clientCity: formData.clientCity,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: new Date().toLocaleDateString('fr-CH'),
      reference: formData.reference || `REF-${Date.now()}`
    };

    setInvoices(prev => [...prev, newInvoice]);
    
    // Télécharger automatiquement la facture
    await handleDownloadInvoice(newInvoice);
    
    // Réinitialiser le formulaire
    setFormData({
      clientName: '',
      clientCompany: '',
      clientAddress: '',
      clientCity: '',
      amount: '',
      description: '',
      reference: ''
    });
    
    setShowInvoiceForm(false);
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(invoice => invoice.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">ZenFacture</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Bonjour, {currentUser.prenom} {currentUser.nom}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-gray-900">CHF {totalRevenue.toLocaleString('fr-CH', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Charges à régler</p>
                <p className="text-2xl font-bold text-gray-900">CHF {totalCharges.toLocaleString('fr-CH', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <PiggyBank className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bénéfices</p>
                <p className="text-2xl font-bold text-gray-900">CHF {netProfit.toLocaleString('fr-CH', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Factures</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Factures récentes</h2>
          <button
            onClick={() => setShowInvoiceForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle facture
          </button>
        </div>

        {/* Invoice Form Modal */}
        {showInvoiceForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Nouvelle QR-facture</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entreprise
                  </label>
                  <input
                    type="text"
                    name="clientCompany"
                    value={formData.clientCompany}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="clientAddress"
                    value={formData.clientAddress}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="clientCity"
                    value={formData.clientCity}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant (CHF) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Référence (optionnel)
                  </label>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    placeholder="Sera généré automatiquement si vide"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInvoiceForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Générer la facture
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Invoices List */}
        <div className="bg-white rounded-lg shadow-sm">
          {invoices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune facture</h3>
              <p className="text-gray-600 mb-4">Commencez par créer votre première QR-facture</p>
              <button
                onClick={() => setShowInvoiceForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer une facture
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{invoice.clientName}</div>
                          <div className="text-sm text-gray-500">{invoice.clientCompany}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        CHF {invoice.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleDownloadInvoice(invoice)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteInvoice(invoice.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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