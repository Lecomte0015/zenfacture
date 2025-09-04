import React, { useState, useMemo } from 'react';
import { FiDownload, FiPrinter, FiMail, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Invoice, InvoiceItem } from '../../types/invoice';
import 'react-toastify/dist/ReactToastify.css';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'pending';

interface RecentInvoicesProps {
  invoices: Invoice[];
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onStatusChange?: (invoiceId: string, status: InvoiceStatus) => void;
}

const RecentInvoices: React.FC<RecentInvoicesProps> = ({ 
  invoices, 
  onEditInvoice, 
  onDeleteInvoice, 
  onStatusChange 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
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
      
      doc.setFontSize(20);
      doc.text('FACTURE', 20, 30);
      
      doc.setFontSize(12);
      doc.text('ZENFACTURE SA', 20, 50);
      doc.text('Rue du Marché 10', 20, 55);
      doc.text('2501 Biel/Bienne', 20, 60);
      doc.text('Suisse', 20, 65);
      
      doc.text('À :', 20, 85);
      doc.text(invoice.client || '', 30, 85);
      
      if (invoice.clientAddress) {
        doc.text(invoice.clientAddress, 30, 90);
      }
      
      if (invoice.clientPostalCode && invoice.clientCity) {
        doc.text(`${invoice.clientPostalCode} ${invoice.clientCity}`, 30, 95);
      }
      
      if (invoice.clientCountry) {
        doc.text(invoice.clientCountry, 30, 100);
      }
      
      doc.text(`Facture n°: ${invoice.invoiceNumber || invoice.id || ''}`, 20, 120);
      doc.text(`Date: ${invoice.date || ''}`, 20, 125);
      
      if (invoice.dueDate) {
        doc.text(`Échéance: ${invoice.dueDate}`, 20, 130);
      }
      
      let y = 140;
      
      // En-tête du tableau
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 20, y);
      doc.text('Qté', 120, y, { align: 'right' } as any);
      doc.text('Prix unitaire', 150, y, { align: 'right' } as any);
      doc.text('Total', 180, y, { align: 'right' } as any);
      y += 10;
      
      // Lignes des articles
      doc.setFont('helvetica', 'normal');
      invoice.items?.forEach(item => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        doc.text(item.description || '', 20, y);
        doc.text((item.quantity || 0).toString(), 120, y, { align: 'right' } as any);
        doc.text((item.unitPrice || 0).toFixed(2), 150, y, { align: 'right' } as any);
        doc.text(itemTotal.toFixed(2), 180, y, { align: 'right' } as any);
        y += 10;
      });
      
      // Ligne de total
      y += 5;
      doc.setLineWidth(0.5);
      doc.line(150, y, 190, y);
      y += 10;
      
      const total = calculateTotalAmount(invoice);
      doc.setFont('helvetica', 'bold');
      doc.text('Total', 150, y, { align: 'right' } as any);
      doc.text(total.toFixed(2), 180, y, { align: 'right' } as any);
      
      // Notes
      if (invoice.notes) {
        y += 20;
        doc.setFont('helvetica', 'italic');
        doc.text('Notes:', 20, y);
        doc.setFont('helvetica', 'normal');
        doc.splitTextToSize(invoice.notes, 170).forEach((line: string, i: number) => {
          doc.text(line, 30, y + 10 + (i * 5));
        });
      }
      
      // Enregistrement du PDF
      doc.save(`facture-${invoice.invoiceNumber || invoice.id || 'sans-numero'}.pdf`);
      
      toast.update(toastId, {
        render: 'Téléchargement terminé',
        type: 'success',
        isLoading: false,
        autoClose: 2000
      });
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.update(toastId, {
        render: 'Erreur lors de la génération du PDF',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  const handlePrint = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Impossible d\'ouvrir la fenêtre d\'impression. Veuillez désactiver votre bloqueur de fenêtres popup.');
      return;
    }
    
    const total = calculateTotalAmount(invoice);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Facture ${invoice.invoiceNumber || invoice.id || ''}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .company-info { flex: 1; }
            .invoice-info { text-align: right; }
            .client-info { margin: 30px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { text-align: left; padding: 10px; background: #f5f5f5; border-bottom: 1px solid #ddd; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .text-right { text-align: right; }
            .total { font-weight: bold; font-size: 1.1em; }
            .notes { margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; }
            .status {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 0.9em;
              margin-left: 10px;
            }
            .status-draft { background-color: #e0e0e0; color: #424242; }
            .status-sent { background-color: #bbdefb; color: #0d47a1; }
            .status-paid { background-color: #c8e6c9; color: #1b5e20; }
            .status-overdue { background-color: #ffcdd2; color: #b71c1c; }
            .status-cancelled { background-color: #424242; color: #fff; }
            .status-pending { background-color: #fff9c4; color: #f57f17; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="company-info">
                <h1>ZENFACTURE SA</h1>
                <p>Rue du Marché 10</p>
                <p>2501 Biel/Bienne</p>
                <p>Suisse</p>
              </div>
              <div class="invoice-info">
                <h1>FACTURE</h1>
                <p>N°: ${invoice.invoiceNumber || invoice.id || ''}</p>
                <p>Date: ${invoice.date || ''}</p>
                ${invoice.dueDate ? `<p>Échéance: ${invoice.dueDate}</p>` : ''}
                <p>
                  Statut: 
                  <span class="status status-${invoice.status || 'draft'}">
                    ${(invoice.status || 'draft').toUpperCase()}
                  </span>
                </p>
              </div>
            </div>
            
            <div class="client-info">
              <h3>À :</h3>
              <p>${invoice.client || ''}</p>
              ${invoice.clientAddress ? `<p>${invoice.clientAddress}</p>` : ''}
              ${invoice.clientPostalCode && invoice.clientCity ? 
                `<p>${invoice.clientPostalCode} ${invoice.clientCity}</p>` : ''}
              ${invoice.clientCountry ? `<p>${invoice.clientCountry}</p>` : ''}
              ${invoice.clientEmail ? `<p>${invoice.clientEmail}</p>` : ''}
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-right">Qté</th>
                  <th class="text-right">Prix unitaire</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${(invoice.items || []).map(item => {
                  const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
                  return `
                    <tr>
                      <td>${item.description || ''}</td>
                      <td class="text-right">${item.quantity || 0}</td>
                      <td class="text-right">${(item.unitPrice || 0).toFixed(2)} ${invoice.currency || 'CHF'}</td>
                      <td class="text-right">${itemTotal.toFixed(2)} ${invoice.currency || 'CHF'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr class="total">
                  <td colspan="3" class="text-right">Total</td>
                  <td class="text-right">${total.toFixed(2)} ${invoice.currency || 'CHF'}</td>
                </tr>
              </tfoot>
            </table>
            
            ${invoice.notes ? `
              <div class="notes">
                <h4>Notes :</h4>
                <p>${invoice.notes.replace(/\n/g, '<br>')}</p>
              </div>
            ` : ''}
          </div>
          
          <script>
            // Fermer la fenêtre après l'impression
            window.onload = function() {
              setTimeout(() => {
                window.print();
                // Fermer la fenêtre après l'impression (certains navigateurs peuvent bloquer cela)
                setTimeout(() => window.close(), 1000);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleSendEmail = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const total = calculateTotalAmount(invoice);
    const subject = `Facture ${invoice.invoiceNumber || invoice.id || ''} - ZENFACTURE SA`;
    const body = `Bonjour,

Veuillez trouver ci-joint la facture n°${invoice.invoiceNumber || invoice.id || ''} d'un montant de ${total.toFixed(2)} ${invoice.currency || 'CHF'}.

Cordialement,
L'équipe ZENFACTURE SA`;
    
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-800 text-white';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Factures récentes</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyé</option>
            <option value="paid">Payé</option>
            <option value="overdue">En retard</option>
            <option value="cancelled">Annulé</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Facture</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Échéance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onEditInvoice(invoice)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber || invoice.id?.substring(0, 8) || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.client || 'Sans nom'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.date || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.dueDate || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {calculateTotalAmount(invoice).toFixed(2)} {invoice.currency || 'CHF'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(invoice.status || 'draft')}`}>
                      {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Brouillon'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(invoice, e);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Télécharger le PDF"
                      >
                        <FiDownload className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrint(invoice, e);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title="Imprimer"
                      >
                        <FiPrinter className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendEmail(invoice, e);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Envoyer par email"
                      >
                        <FiMail className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditInvoice(invoice);
                        }}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Modifier"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(invoice, e)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucune facture trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentInvoices;
