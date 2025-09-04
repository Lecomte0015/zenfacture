import React, { useState, useMemo } from 'react';
import { FiDownload, FiPrinter, FiMail, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Invoice, InvoiceItem } from '../../types/invoice';
import 'react-toastify/dist/ReactToastify.css';

interface RecentInvoicesProps {
  invoices: Invoice[];
  onDeleteInvoice: (id: string) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onStatusChange: (id: string, status: Invoice['status']) => void;
  searchTerm: string;
  statusFilter: string;
}

const RecentInvoices: React.FC<RecentInvoicesProps> = ({ 
  invoices, 
  onEditInvoice, 
  onDeleteInvoice,
  onStatusChange,
  searchTerm: initialSearchTerm = '',
  statusFilter: initialStatusFilter = 'all'
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Filter by search term
      const matchesSearch = searchTerm === '' || 
        (invoice.client?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by status
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const calculateTotalAmount = (invoice: Invoice): number => {
    return (invoice.items || []).reduce((sum, item) => {
      return sum + ((item.quantity || 0) * (item.unitPrice || 0));
    }, 0);
  };

  const handleDownload = async (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const toastId = toast.loading('Préparation du téléchargement...');
    
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // En-tête
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURE', 20, 20);
      
      // Informations de l'entreprise (à droite)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ZENFACTURE SA', 140, 20);
      doc.setFont('helvetica', 'normal');
      doc.text('Rue du Marché 10', 140, 25);
      doc.text('2501 Biel/Bienne', 140, 30);
      doc.text('Suisse', 140, 35);
      doc.text('TVA: CHE-XXX.XXX.XXX', 140, 40);
      doc.text('Tél: +41 32 123 45 67', 140, 45);
      doc.text('Email: contact@zenfacture.ch', 140, 50);
      
      // Informations du client (à gauche)
      doc.setFont('helvetica', 'bold');
      doc.text('Facturé à:', 20, 50);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.client || 'Client inconnu', 20, 55);
      
      if (invoice.clientAddress) {
        doc.text(invoice.clientAddress, 20, 60);
        let addressY = 65;
        
        if (invoice.clientPostalCode && invoice.clientCity) {
          doc.text(`${invoice.clientPostalCode} ${invoice.clientCity}`, 20, addressY);
          addressY += 5;
        }
        
        if (invoice.clientCountry) {
          doc.text(invoice.clientCountry, 20, addressY);
        }
      }
      
      // Détails de la facture
      doc.setFont('helvetica', 'bold');
      doc.text('Détails de la facture', 20, 85);
      doc.setFont('helvetica', 'normal');
      doc.text(`N° de facture: ${invoice.invoiceNumber || invoice.id || ''}`, 20, 90);
      doc.text(`Date: ${invoice.date ? new Date(invoice.date).toLocaleDateString('fr-CH') : 'Non spécifiée'}`, 20, 95);
      
      if (invoice.dueDate) {
        doc.text(`Date d'échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-CH')}`, 20, 100);
      }
      
      // Tableau des articles
      let y = 115;
      
      // En-tête du tableau
      doc.setFillColor(240, 240, 240);
      doc.rect(20, y, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 22, y + 5);
      doc.text('Qté', 110, y + 5, { align: 'right' } as any);
      doc.text('Prix unitaire', 140, y + 5, { align: 'right' } as any);
      doc.text('Total', 170, y + 5, { align: 'right' } as any);
      
      // Lignes des articles
      y += 10;
      doc.setFont('helvetica', 'normal');
      const items = invoice.items || [];
      
      items.forEach((item: InvoiceItem) => {
        // Dessine une ligne de séparation
        doc.setDrawColor(220, 220, 220);
        doc.line(20, y - 2, 190, y - 2);
        
        // Description avec retour à la ligne si nécessaire
        const description = item.description || 'Article sans description';
        const splitDescription = doc.splitTextToSize(description, 80);
        
        // Hauteur de la cellule basée sur le nombre de lignes de description
        const cellHeight = Math.max(10, splitDescription.length * 5);
        
        // Dessine le fond de la cellule
        doc.setFillColor(255, 255, 255);
        doc.rect(20, y - 2, 170, cellHeight, 'F');
        
        // Dessine la bordure de la cellule
        doc.rect(20, y - 2, 170, cellHeight);
        
        // Texte de la description
        doc.text(splitDescription, 22, y + 3);
        
        // Quantité, prix unitaire et total
        doc.text((item.quantity || 0).toString(), 110, y + 3, { align: 'right' } as any);
        doc.text(`${(item.unitPrice || 0).toFixed(2)} ${invoice.currency || 'CHF'}`, 140, y + 3, { align: 'right' } as any);
        doc.text(`${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)} ${invoice.currency || 'CHF'}`, 170, y + 3, { align: 'right' } as any);
        
        y += cellHeight;
      });
      
      // Ligne de séparation avant le total
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(140, y, 190, y);
      y += 5;
      
      // Calcul des totaux
      const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
      const taxRate = invoice.taxRate || 7.7; // TVA suisse par défaut
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      
      // Affichage des totaux
      doc.setFont('helvetica', 'bold');
      doc.text('Sous-total:', 150, y, { align: 'right' } as any);
      doc.text(`${subtotal.toFixed(2)} ${invoice.currency || 'CHF'}`, 190, y, { align: 'right' } as any);
      y += 7;
      
      doc.text(`TVA (${taxRate}%):`, 150, y, { align: 'right' } as any);
      doc.text(`${taxAmount.toFixed(2)} ${invoice.currency || 'CHF'}`, 190, y, { align: 'right' } as any);
      y += 7;
      
      doc.setFontSize(12);
      doc.text('Total:', 150, y, { align: 'right' } as any);
      doc.text(`${total.toFixed(2)} ${invoice.currency || 'CHF'}`, 190, y, { align: 'right' } as any);
      
      // Ajout d'un QR code de paiement (version simplifiée)
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Paiement par QR-bill', 20, y);
      
      // Espace pour le QR code (sera généré côté client)
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, y + 5, 40, 40, 'S');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('(Le QR code sera généré', 65, y + 15);
      doc.text('après paiement)', 65, y + 20);
      
      // Détails de paiement
      doc.setFontSize(10);
      doc.text('Veuillez effectuer le virement à:', 65, y + 30);
      doc.text('Bénéficiaire: ZENFACTURE SA', 65, y + 35);
      doc.text('IBAN: CH93 0076 2011 6238 5295 7', 65, y + 40);
      doc.text(`Montant: ${total.toFixed(2)} ${invoice.currency || 'CHF'}`, 65, y + 45);
      doc.text(`Référence: ${invoice.invoiceNumber || invoice.id || ''}`, 65, y + 50);
      
      // Pied de page
      doc.setFontSize(8);
      doc.text('ZENFACTURE SA - Rue du Marché 10 - 2501 Biel/Bienne - Suisse', 105, 287, { align: 'center' } as any);
      doc.text('TVA: CHE-XXX.XXX.XXX - Tél: +41 32 123 45 67 - Email: contact@zenfacture.ch', 105, 290, { align: 'center' } as any);
      
      // Enregistrement du PDF
      doc.save(`facture-${invoice.invoiceNumber || invoice.id || 'sans-numero'}.pdf`);
      
      toast.dismiss(toastId);
      toast.success('Téléchargement terminé !');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.dismiss(toastId);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const handleSendEmail = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    const subject = `Facture ${invoice.invoiceNumber || invoice.id || ''} - ZENFACTURE SA`;
    const totalAmount = invoice.items?.reduce((sum, item) => 
      sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0) || 0;
    const body = `Bonjour,\n\nVeuillez trouver ci-joint la facture n°${invoice.invoiceNumber || invoice.id || ''} d'un montant de ${totalAmount.toFixed(2)} ${invoice.currency || 'CHF'}.\n\nCordialement,\nL'équipe ZENFACTURE SA`;
    const mailtoLink = `mailto:${invoice.clientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    toast.info('Ouvrez votre client de messagerie pour envoyer la facture');
  };

  const handleDelete = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      onDeleteInvoice(invoice.id);
      toast.success('Facture supprimée avec succès');
    }
  };

  const handlePrint = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Impossible d\'ouvrir la fenêtre d\'impression. Veuillez désactiver votre bloqueur de fenêtres popup.');
      return;
    }

    const totalAmount = calculateTotalAmount(invoice);
    const taxRate = invoice.taxRate || 0;
    const totalWithTax = totalAmount * (1 + taxRate / 100);

    // Création d'un contenu HTML simple pour l'impression
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Facture ${invoice.invoiceNumber || invoice.id || ''}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
          .company-info { text-align: right; }
          h1 { color: #2d3748; margin: 0 0 5px 0; font-size: 24px; }
          h2 { color: #4a5568; font-size: 18px; margin: 20px 0 10px 0; }
          .client-info, .invoice-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
          th { background-color: #f8fafc; font-weight: 600; }
          .text-right { text-align: right; }
          .total-row { font-weight: bold; }
          .notes { margin-top: 30px; padding: 15px; background-color: #f8fafc; border-radius: 4px; }
          .status { 
            display: inline-block; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 12px; 
            font-weight: 600; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
          }
          .status-draft { background-color: #e2e8f0; color: #4a5568; }
          .status-sent { background-color: #bee3f8; color: #2b6cb0; }
          .status-paid { background-color: #c6f6d5; color: #2f855a; }
          .status-overdue { background-color: #fed7d7; color: #c53030; }
          .status-cancelled { background-color: #e2e8f0; color: #4a5568; text-decoration: line-through; }
          .status-pending { background-color: #feebc8; color: #b7791f; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>ZENFACTURE SA</h1>
            <p>Rue du Marché 10<br>2501 Biel/Bienne<br>Suisse</p>
          </div>
          <div class="company-info">
            <p>Date: ${new Date(invoice.date).toLocaleDateString()}</p>
            ${invoice.dueDate ? `<p>Échéance: ${new Date(invoice.dueDate).toLocaleDateString()}</p>` : ''}
          </div>
        </div>

        <div class="client-info">
          <h2>À :</h2>
          <p>
            ${invoice.client || 'Client inconnu'}<br>
            ${invoice.clientAddress || ''}<br>
            ${invoice.clientPostalCode || ''} ${invoice.clientCity || ''}<br>
            ${invoice.clientCountry || ''}
          </p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Quantité</th>
              <th class="text-right">Prix unitaire</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(invoice.items || []).map(item => `
              <tr>
                <td>${item.description || 'Article sans description'}</td>
                <td class="text-right">${item.quantity || 0}</td>
                <td class="text-right">${(item.unitPrice || 0).toFixed(2)} ${invoice.currency || 'CHF'}</td>
                <td class="text-right">${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)} ${invoice.currency || 'CHF'}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3" class="text-right">Sous-total:</td>
              <td class="text-right">${totalAmount.toFixed(2)} ${invoice.currency || 'CHF'}</td>
            </tr>
            ${taxRate > 0 ? `
              <tr class="total-row">
                <td colspan="3" class="text-right">TVA (${taxRate}%):</td>
                <td class="text-right">${(totalAmount * (taxRate / 100)).toFixed(2)} ${invoice.currency || 'CHF'}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3" class="text-right">Total TTC:</td>
                <td class="text-right">${totalWithTax.toFixed(2)} ${invoice.currency || 'CHF'}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>

        ${invoice.notes ? `
          <div class="notes">
            <h2>Notes:</h2>
            <p>${invoice.notes}</p>
          </div>
        ` : ''}

        <div class="footer" style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #718096; font-size: 0.9em;">
          <p>Merci pour votre confiance !</p>
          <p>ZENFACTURE SA - Rue du Marché 10 - 2501 Biel/Bienne - Suisse</p>
          <p>Email: contact@zenfacture.ch - Tél: +41 32 123 45 67</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Factures récentes</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Invoice['status'] | 'all')}
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyée</option>
              <option value="paid">Payée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
        </div>

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
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => {
                  const invoiceNumber = invoice.invoiceNumber || `FAC-${invoice.id.slice(0, 8).toUpperCase()}`;
                  const clientName = invoice.client || 'Client inconnu';
                  const totalAmount = calculateTotalAmount(invoice);

                  return (
                    <tr 
                      key={invoice.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onEditInvoice(invoice)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {totalAmount.toFixed(2)} {invoice.currency || 'CHF'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          className={`px-2 py-1 text-xs font-semibold rounded-md border-0 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            invoice.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : invoice.status === 'sent' 
                                ? 'bg-blue-100 text-blue-800' 
                                : invoice.status === 'cancelled' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                          }`}
                          value={invoice.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            onStatusChange(invoice.id, e.target.value as Invoice['status']);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="draft">Brouillon</option>
                          <option value="sent">Envoyée</option>
                          <option value="paid">Payée</option>
                          <option value="cancelled">Annulée</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(invoice, e);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Télécharger"
                          >
                            <FiDownload size={18} />
                          </button>
                          <button
                            onClick={(e) => handlePrint(invoice, e)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Imprimer"
                          >
                            <FiPrinter size={18} />
                          </button>
                          <button
                            onClick={(e) => handleSendEmail(invoice, e)}
                            className="text-green-600 hover:text-green-900"
                            title="Envoyer par email"
                          >
                            <FiMail size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditInvoice(invoice);
                            }}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Modifier"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(invoice, e)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucune facture trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecentInvoices;
