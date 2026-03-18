import { Fragment, useRef, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX, FiPrinter, FiDownload, FiEdit2, FiSave, FiMail, FiCreditCard, FiExternalLink, FiAlertTriangle } from 'react-icons/fi';
import { getInvoice, updateInvoice } from '../../services/invoiceService';
import { generateInvoiceQrCode, formatIbanDisplay } from '../../services/swissQrService';
import { sendInvoiceEmail, generatePdfBase64 } from '../../services/emailService';
// Payrexx désactivé — nécessite un domaine déployé pour les webhooks
// import { createPaymentLink, getExistingPaymentLink, toCents } from '../../services/payrexxService';
import { supabase } from '../../lib/supabase';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  invoiceId?: string;
}

interface InvoiceViewItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

interface InvoiceViewData {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email?: string;
  client_company?: string;
  client_address?: string;
  client_city?: string;
  client_postal_code?: string;
  client_country?: string;
  company_name?: string;
  company_address?: string;
  company_city?: string;
  company_postal_code?: string;
  company_country?: string;
  company_vat?: string;
  date: string;
  due_date: string;
  status: string;
  items: InvoiceViewItem[];
  subtotal: number;
  tax_amount: number;
  total: number;
  devise?: string;
  notes?: string;
  iban?: string;
  company_logo_url?: string;
  primary_color?: string;
  header_bg_color?: string;
  font_family?: string;
  qr_position?: string;
  address_spacing?: string;
}

export const InvoiceModal = ({ isOpen, onClose, invoiceId }: InvoiceModalProps) => {
  const [invoice, setInvoice] = useState<InvoiceViewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrError, setQrError] = useState<string | null>(null);
  // Email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  // Paiement en ligne (Payrexx — désactivé jusqu'au déploiement)
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !invoiceId) {
      // Réinitialiser l'état quand le modal se ferme
      if (!isOpen) {
        setInvoice(null);
        setIsEditing(false);
        setQrCodeUrl('');
        setQrError(null);
        setPaymentLink(null);
        setPaymentError(null);
        setShowEmailModal(false);
        setEmailFeedback(null);
      }
      return;
    }

    const fetchInvoice = async () => {
      setIsLoading(true);
      setError(null);
      // Réinitialiser les états de la facture précédente
      setIsEditing(false);
      setQrCodeUrl('');
      setQrError(null);
      setPaymentLink(null);
      setPaymentError(null);
      try {
        const data = await getInvoice(invoiceId);
        if (data) {
          const mappedItems: InvoiceViewItem[] = (data.items || []).map((item: any) => ({
            id: item.id || Date.now().toString(),
            description: item.description || '',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice ?? item.unit_price ?? 0,
            vatRate: item.vatRate ?? item.vat_rate ?? item.tax_rate ?? 0,
            total: item.total ?? item.amount ?? (item.quantity || 1) * (item.unitPrice ?? item.unit_price ?? 0),
          }));
          const invoiceData = { ...data, items: mappedItems } as InvoiceViewData;

          // Toujours récupérer les infos fraîches de l'organisation (nom, adresse, IBAN)
          const orgId = (data as any).organisation_id;
          if (orgId) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: org } = await (supabase as any)
                .from('organisations')
                .select('iban, nom, adresse, code_postal, ville, pays, numero_tva, email, telephone, logo_url, primary_color, header_bg_color, font_family, qr_position, address_spacing')
                .eq('id', orgId)
                .single();
              if (org) {
                // Toujours écraser avec les données fraîches de l'org
                if (org.nom) invoiceData.company_name = org.nom;
                if (org.iban) invoiceData.iban = org.iban;
                if (org.adresse) invoiceData.company_address = org.adresse;
                if (org.code_postal) invoiceData.company_postal_code = org.code_postal;
                if (org.ville) invoiceData.company_city = org.ville;
                if (org.pays) invoiceData.company_country = org.pays;
                if (org.numero_tva) invoiceData.company_vat = org.numero_tva;
                if (org.logo_url) invoiceData.company_logo_url = org.logo_url;
                invoiceData.primary_color = org.primary_color || '#2563EB';
                invoiceData.header_bg_color = org.header_bg_color || '#F3F4F6';
                invoiceData.font_family = org.font_family || 'helvetica';
                invoiceData.qr_position = org.qr_position || 'center';
                invoiceData.address_spacing = org.address_spacing || 'normal';
              }
            } catch (orgErr) {
              console.warn('Impossible de charger les données de l\'organisation:', orgErr);
            }
          }

          setInvoice(invoiceData);
          generateQRCode(invoiceData);
        } else {
          setError('Facture non trouvée');
        }
      } catch (err) {
        console.error('Erreur chargement facture:', err);
        setError('Erreur lors du chargement');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, isOpen]);

  const generateQRCode = async (inv: InvoiceViewData) => {
    setQrError(null);
    // Ne générer le QR que si l'IBAN est configuré
    if (!inv.iban) {
      setQrError('IBAN non configuré. Renseignez votre IBAN dans les paramètres de l\'organisation.');
      return;
    }
    try {
      const url = await generateInvoiceQrCode({
        creditorIban: inv.iban,
        creditorName: inv.company_name || '',
        creditorStreet: inv.company_address,
        creditorPostalCode: inv.company_postal_code || '',
        creditorCity: inv.company_city || '',
        creditorCountry: inv.company_country,
        debtorName: inv.client_name,
        debtorStreet: inv.client_address,
        debtorPostalCode: inv.client_postal_code,
        debtorCity: inv.client_city,
        debtorCountry: inv.client_country,
        amount: inv.total,
        currency: (inv.devise === 'EUR' ? 'EUR' : 'CHF'),
        invoiceNumber: inv.invoice_number,
      }, { size: 180 });
      setQrCodeUrl(url);
    } catch (err: any) {
      console.error('Erreur QR code:', err);
      setQrError(err?.message ?? 'Erreur lors de la génération du QR code.');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount?: number) => {
    const value = amount || 0;
    const devise = invoice?.devise || 'CHF';
    return `${value.toFixed(2)} ${devise}`;
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!invoice) return;
    setInvoice({ ...invoice, [field]: value });
  };

  const handleItemChange = (index: number, field: keyof InvoiceViewItem, value: any) => {
    if (!invoice) return;
    const updatedItems = [...invoice.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    const item = updatedItems[index];
    updatedItems[index].total = item.quantity * item.unitPrice;

    const subtotal = updatedItems.reduce((sum, it) => sum + it.total, 0);
    const taxAmount = updatedItems.reduce((sum, it) => sum + (it.total * it.vatRate / 100), 0);
    const total = subtotal + taxAmount;

    setInvoice({
      ...invoice,
      items: updatedItems,
      subtotal,
      tax_amount: taxAmount,
      total
    });
  };

  const handleSave = async () => {
    if (!invoice) return;

    try {
      setIsSaving(true);
      const itemsForDB = invoice.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        vat_rate: item.vatRate,
        total: item.total,
      }));

      await updateInvoice(invoice.id, {
        client_name: invoice.client_name,
        client_company: invoice.client_company,
        client_address: invoice.client_address,
        client_city: invoice.client_city,
        client_postal_code: invoice.client_postal_code,
        items: itemsForDB as any,
        subtotal: invoice.subtotal,
        tax_amount: invoice.tax_amount,
        total: invoice.total,
        notes: invoice.notes,
      });

      setIsEditing(false);
      onClose(true);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture ${invoice?.invoice_number || ''}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20mm; font-size: 10pt; line-height: 1.5; color: #000; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
            .company { max-width: 250px; }
            .company h2 { font-size: 13pt; margin-bottom: 8px; font-weight: bold; }
            .company p { font-size: 9pt; margin: 2px 0; line-height: 1.3; }
            .invoice-info { text-align: right; }
            .invoice-info h1 { font-size: 20pt; color: #2563eb; margin-bottom: 10px; font-weight: bold; }
            .invoice-info p { font-size: 9pt; margin: 3px 0; }
            .client-address { margin-bottom: 30px; }
            .client-address > div { display: inline-block; border-left: 3px solid #2563eb; padding-left: 10px; }
            .client-address p { font-size: 9pt; margin: 2px 0; line-height: 1.3; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 9pt; }
            th { background: #f8f9fa; padding: 8px 6px; text-align: left; font-size: 8pt; text-transform: uppercase; color: #555; border-bottom: 2px solid #333; font-weight: 600; }
            td { padding: 6px; border-bottom: 1px solid #ddd; }
            .text-right { text-align: right; }
            .totals { margin-left: auto; width: 220px; margin-bottom: 40px; margin-top: 10px; }
            .totals-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 9pt; }
            .totals-row.total { font-size: 12pt; font-weight: bold; border-top: 2px solid #000; padding-top: 6px; margin-top: 6px; }
            .footer { font-size: 8pt; color: #333; line-height: 1.5; }
            .qr-bill-section { margin-top: 30px; padding-top: 20px; border-top: 2px dashed #999; }
            .receipt { width: 30%; border-right: 2px dashed #999; padding-right: 15px; }
            .receipt p { font-size: 7pt; margin: 2px 0; line-height: 1.3; }
            .payment-section { flex: 1; display: flex; gap: 15px; }
            .payment-info { flex: 1; }
            .payment-info p { font-size: 8pt; margin: 2px 0; line-height: 1.3; }
            .qr-code-container { flex-shrink: 0; text-align: center; }
            .qr-code-container img { width: 110px; height: 110px; border: 1px solid #000; }
            .qr-code-container p { font-size: 6pt; margin-top: 3px; color: #666; }
            @media print {
              body { padding: 15mm; }
              .header { page-break-after: avoid; }
              table { page-break-inside: avoid; }
              .qr-bill-section { page-break-before: avoid; margin-top: 20mm; }
            }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Helper : hex → [r, g, b]
  const hexToRgb = (hex: string): [number, number, number] => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return [isNaN(r) ? 37 : r, isNaN(g) ? 99 : g, isNaN(b) ? 235 : b];
  };

  // Helper : charger une image URL en dataURL via canvas
  const loadImageAsDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Impossible de charger le logo'));
      img.src = url;
    });
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = 210;
    const marginL = 18;
    const marginR = 18;
    const contentW = pageW - marginL - marginR;
    let y = 18;

    // ── Personnalisation ──
    const primaryRgb = hexToRgb(invoice.primary_color || '#2563EB');
    const baseFont = (invoice.font_family === 'times' || invoice.font_family === 'courier')
      ? invoice.font_family : 'helvetica';
    const qrPos = invoice.qr_position || 'center';
    const addrSpacing = invoice.address_spacing || 'normal';
    const addrLn = addrSpacing === 'compact' ? 4 : addrSpacing === 'spacious' ? 6 : 5;

    // Couleur primaire très légère pour fond en-tête tableau
    const lightPrimary: [number, number, number] = [
      Math.round(primaryRgb[0] * 0.12 + 225),
      Math.round(primaryRgb[1] * 0.12 + 225),
      Math.round(primaryRgb[2] * 0.12 + 225),
    ];

    // ══════════════════════════════════════════════════════════════════
    // ── HEADER : Logo gauche + FACTURE + détails droite ──
    // ══════════════════════════════════════════════════════════════════
    const headerStartY = y;
    let logoBottomY = headerStartY;

    if (invoice.company_logo_url) {
      try {
        const logoDataUrl = await loadImageAsDataUrl(invoice.company_logo_url);
        doc.addImage(logoDataUrl, 'PNG', marginL, headerStartY, 40, 16);
        logoBottomY = headerStartY + 19;
      } catch { /* logo non disponible */ }
    }

    // Titre FACTURE - droite
    doc.setFont(baseFont, 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...primaryRgb);
    doc.text('FACTURE', pageW - marginR, headerStartY + 11, { align: 'right' });

    // Ligne décorative sous FACTURE
    doc.setDrawColor(...primaryRgb);
    doc.setLineWidth(0.5);
    doc.line(pageW - marginR - 58, headerStartY + 13, pageW - marginR, headerStartY + 13);
    doc.setLineWidth(0.2);
    doc.setDrawColor(0, 0, 0);

    // N°, Date, Échéance - droite, compact
    doc.setFont(baseFont, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);
    doc.text(`N° ${invoice.invoice_number}`, pageW - marginR, headerStartY + 19, { align: 'right' });
    doc.text(`Date : ${formatDate(invoice.date)}`, pageW - marginR, headerStartY + 24, { align: 'right' });
    doc.text(`Échéance : ${formatDate(invoice.due_date)}`, pageW - marginR, headerStartY + 29, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    y = Math.max(logoBottomY, headerStartY + 33);

    // Ligne séparatrice colorée
    doc.setDrawColor(...primaryRgb);
    doc.setLineWidth(0.5);
    doc.line(marginL, y, pageW - marginR, y);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    y += 7;

    // ══════════════════════════════════════════════════════════════════
    // ── ÉMETTEUR (gauche) | DESTINATAIRE (droite) — même niveau ──
    // ══════════════════════════════════════════════════════════════════
    const col1X = marginL;
    const col2X = marginL + contentW / 2 + 5;
    const addrTopY = y;

    // Labels
    doc.setFont(baseFont, 'bold');
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text('ÉMETTEUR', col1X, addrTopY);
    doc.text('DESTINATAIRE', col2X, addrTopY);
    doc.setTextColor(0, 0, 0);

    // Barre colorée destinataire
    doc.setFillColor(...primaryRgb);
    doc.rect(col2X - 3.5, addrTopY + 2, 0.9, 22, 'F');

    let emitterCurY = addrTopY + 5;
    let clientCurY  = addrTopY + 5;

    // ── Émetteur ──
    doc.setFont(baseFont, 'bold');
    doc.setFontSize(10);
    doc.text(invoice.company_name || '', col1X, emitterCurY);
    emitterCurY += addrLn;

    doc.setFont(baseFont, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    if (invoice.company_address) { doc.text(invoice.company_address, col1X, emitterCurY); emitterCurY += addrLn; }
    const emCity = `${invoice.company_postal_code || ''} ${invoice.company_city || ''}`.trim();
    if (emCity) { doc.text(emCity, col1X, emitterCurY); emitterCurY += addrLn; }
    if (invoice.company_country) { doc.text(invoice.company_country, col1X, emitterCurY); emitterCurY += addrLn; }
    if (invoice.company_vat) {
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(`IDE : CHE-${invoice.company_vat}`, col1X, emitterCurY);
      emitterCurY += addrLn;
    }
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);

    // ── Destinataire ──
    doc.setFont(baseFont, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(invoice.client_name || '', col2X, clientCurY);
    clientCurY += addrLn;

    doc.setFont(baseFont, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    if (invoice.client_company) { doc.text(invoice.client_company, col2X, clientCurY); clientCurY += addrLn; }
    if (invoice.client_address) { doc.text(invoice.client_address, col2X, clientCurY); clientCurY += addrLn; }
    const clCity = `${invoice.client_postal_code || ''} ${invoice.client_city || ''}`.trim();
    if (clCity) { doc.text(clCity, col2X, clientCurY); clientCurY += addrLn; }
    if (invoice.client_country && invoice.client_country !== 'CH') {
      doc.text(invoice.client_country, col2X, clientCurY); clientCurY += addrLn;
    }
    doc.setTextColor(0, 0, 0);

    y = Math.max(emitterCurY, clientCurY) + 7;

    // Ligne séparatrice légère
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    doc.setDrawColor(0, 0, 0);
    y += 6;

    // ══════════════════════════════════════════════════════════════════
    // ── TABLEAU DES ARTICLES ──
    // ══════════════════════════════════════════════════════════════════
    const colX = [marginL, marginL + 82, marginL + 107, marginL + 130, marginL + 157];

    // En-tête tableau : fond teinté primaire léger, texte couleur primaire
    doc.setFillColor(...lightPrimary);
    doc.rect(marginL, y, contentW, 7, 'F');
    doc.setFont(baseFont, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...primaryRgb);
    doc.text('DESCRIPTION', colX[0] + 1, y + 4.5);
    doc.text('QTÉ',        colX[1], y + 4.5, { align: 'right' });
    doc.text('PRIX UNIT.', colX[2], y + 4.5, { align: 'right' });
    doc.text('TVA',        colX[3], y + 4.5, { align: 'right' });
    doc.text('MONTANT',    colX[4] + 13, y + 4.5, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y += 8;

    // Lignes d'articles
    doc.setFont(baseFont, 'normal');
    doc.setFontSize(9);
    for (const item of invoice.items) {
      if (y > 215) { doc.addPage(); y = 20; }
      doc.setTextColor(30, 30, 30);
      doc.text(doc.splitTextToSize(item.description, 78), colX[0], y);
      doc.setTextColor(60, 60, 60);
      doc.text(String(item.quantity), colX[1], y, { align: 'right' });
      doc.text(`${(item.unitPrice || 0).toFixed(2)}`, colX[2], y, { align: 'right' });
      doc.text(`${(item.vatRate || 0).toFixed(1)}%`, colX[3], y, { align: 'right' });
      doc.setTextColor(30, 30, 30);
      doc.text(`${(item.total || 0).toFixed(2)}`, colX[4] + 13, y, { align: 'right' });
      doc.setDrawColor(225, 225, 225);
      doc.line(marginL, y + 3, marginL + contentW, y + 3);
      doc.setDrawColor(0, 0, 0);
      y += 7.5;
    }

    y += 4;

    // ── Totaux ──
    const totLeftX  = marginL + contentW - 68;
    const totRightX = marginL + contentW;

    doc.setFont(baseFont, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Sous-total :', totLeftX, y);
    doc.text(`${(invoice.subtotal || 0).toFixed(2)} ${invoice.devise || 'CHF'}`, totRightX, y, { align: 'right' });
    y += 5;
    doc.text('TVA :', totLeftX, y);
    doc.text(`${(invoice.tax_amount || 0).toFixed(2)} ${invoice.devise || 'CHF'}`, totRightX, y, { align: 'right' });
    y += 3;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(totLeftX, y, totRightX, y);
    doc.setDrawColor(0, 0, 0);
    y += 5;
    doc.setFont(baseFont, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text('Total :', totLeftX, y);
    doc.setTextColor(...primaryRgb);
    doc.text(`${(invoice.total || 0).toFixed(2)} ${invoice.devise || 'CHF'}`, totRightX, y, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y += 10;

    // ── Conditions + IBAN (remplit l'espace avant QR-bill) ──
    doc.setFont(baseFont, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    if (invoice.due_date) {
      doc.text(
        `Conditions de paiement : dû avant le ${formatDate(invoice.due_date)}.`,
        marginL, y
      );
      y += 4.5;
    }
    if (invoice.notes) {
      const noteLines = doc.splitTextToSize(`Remarques : ${invoice.notes}`, contentW);
      doc.text(noteLines, marginL, y);
      y += noteLines.length * 4.5;
    }
    if (invoice.iban) {
      y += 2;
      doc.text(`Paiement par virement : IBAN ${formatIbanDisplay(invoice.iban)}`, marginL, y);
      y += 4.5;
      doc.text(`Bénéficiaire : ${invoice.company_name || ''}`, marginL, y);
    }
    doc.setTextColor(0, 0, 0);

    // ══════════════════════════════════════════════════════════════════
    // ── QR-BILL standard suisse — fixé à y=230 ──
    // ══════════════════════════════════════════════════════════════════
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docAny = doc as any;
    if (qrCodeUrl) {
      const qrY = 230;
      doc.setLineWidth(0.3);
      docAny.setLineDashPattern([2, 2], 0);
      doc.line(marginL, qrY, marginL + contentW, qrY);
      docAny.setLineDashPattern([], 0);

      const qrSize = 46;
      let qrImgX: number, receipX: number, payX: number, sep1X: number, sep2X: number;

      if (qrPos === 'left') {
        qrImgX  = marginL;
        sep1X   = marginL + qrSize + 4;
        receipX = sep1X + 3;
        sep2X   = marginL + qrSize + 60;
        payX    = sep2X + 3;
      } else if (qrPos === 'right') {
        receipX = marginL;
        sep1X   = marginL + 50;
        payX    = sep1X + 3;
        sep2X   = marginL + contentW - qrSize - 4;
        qrImgX  = sep2X + 2;
      } else {
        receipX = marginL;
        sep1X   = marginL + 52;
        qrImgX  = sep1X + 5;
        sep2X   = qrImgX + qrSize + 4;
        payX    = sep2X + 3;
      }

      docAny.setLineDashPattern([2, 2], 0);
      doc.line(sep1X, qrY, sep1X, qrY + 56);
      if (qrPos !== 'left' && qrPos !== 'right') {
        doc.line(sep2X, qrY, sep2X, qrY + 56);
      }
      docAny.setLineDashPattern([], 0);

      // QR image
      doc.addImage(qrCodeUrl, 'PNG', qrImgX, qrY + 4, qrSize, qrSize);
      doc.setFont(baseFont, 'normal');
      doc.setFontSize(6);
      doc.text('QR-Facture Suisse', qrImgX + qrSize / 2, qrY + 53, { align: 'center' });

      // Récépissé
      doc.setFont(baseFont, 'bold'); doc.setFontSize(7.5);
      doc.text('Récépissé', receipX, qrY + 5);
      doc.setFont(baseFont, 'normal'); doc.setFontSize(6);
      const rLines = [
        'Compte / Payable à',
        formatIbanDisplay(invoice.iban || ''),
        invoice.company_name || '',
        `${invoice.company_postal_code || ''} ${invoice.company_city || ''}`.trim(),
        '', 'Payable par',
        invoice.client_name,
        `${invoice.client_postal_code || ''} ${invoice.client_city || ''}`.trim(),
      ];
      let ry = qrY + 10;
      rLines.forEach(l => { if (l !== '') { doc.text(l, receipX, ry); } ry += 4; });
      doc.setFont(baseFont, 'bold'); doc.setFontSize(7);
      doc.text('Montant', receipX, qrY + 44);
      doc.text(`${invoice.devise || 'CHF'} ${(invoice.total || 0).toFixed(2)}`, receipX, qrY + 49);

      // Section de paiement
      doc.setFont(baseFont, 'bold'); doc.setFontSize(7.5);
      doc.text('Section de paiement', payX, qrY + 5);
      doc.setFont(baseFont, 'normal'); doc.setFontSize(6);
      const pLines = [
        'Compte / Payable à',
        formatIbanDisplay(invoice.iban || ''),
        invoice.company_name || '',
        `${invoice.company_postal_code || ''} ${invoice.company_city || ''}`.trim(),
        '', 'Référence',
        invoice.invoice_number,
        '', 'Payable par',
        invoice.client_name,
        `${invoice.client_postal_code || ''} ${invoice.client_city || ''}`.trim(),
      ];
      let py = qrY + 10;
      pLines.forEach(l => { if (l !== '') { doc.text(l, payX, py); } py += 4; });
      doc.setFont(baseFont, 'bold'); doc.setFontSize(9);
      doc.text(`${invoice.devise || 'CHF'}  ${(invoice.total || 0).toFixed(2)}`, payX, qrY + 54);
    }

    doc.save(`facture-${invoice.invoice_number}.pdf`);
  };

  // Payrexx désactivé — nécessite un domaine déployé
  // handleCreatePaymentLink supprimé

  const handleOpenEmailModal = () => {
    setEmailTo(invoice?.client_email || '');
    setEmailFeedback(null);
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!invoice || !emailTo.trim()) return;
    setIsSendingEmail(true);
    setEmailFeedback(null);

    // Générer le PDF en base64 pour la pièce jointe
    const pdfBase64 = await generatePdfBase64({
      invoice_number: invoice.invoice_number,
      company_name: invoice.company_name,
      company_address: invoice.company_address,
      company_postal_code: invoice.company_postal_code,
      company_city: invoice.company_city,
      company_country: invoice.company_country,
      company_vat: invoice.company_vat,
      client_name: invoice.client_name,
      client_address: invoice.client_address,
      client_postal_code: invoice.client_postal_code,
      client_city: invoice.client_city,
      client_country: invoice.client_country,
      date: invoice.date,
      due_date: invoice.due_date,
      items: invoice.items.map(i => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        vatRate: i.vatRate,
        total: i.total,
      })),
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      total: invoice.total,
      devise: invoice.devise,
      iban: invoice.iban,
      qrCodeDataUrl: qrCodeUrl || undefined,
      company_logo_url: invoice.company_logo_url,
      primary_color: invoice.primary_color,
      header_bg_color: invoice.header_bg_color,
    });

    const result = await sendInvoiceEmail({
      to: emailTo.trim(),
      recipientName: invoice.client_name,
      senderName: invoice.company_name || 'ZenFacture',
      invoiceNumber: invoice.invoice_number,
      amount: invoice.total.toFixed(2),
      currency: invoice.devise || 'CHF',
      dueDate: invoice.due_date,
      notes: invoice.notes,
      pdfBase64: pdfBase64 ?? undefined,
    });

    setIsSendingEmail(false);

    if (result.success) {
      setEmailFeedback({ type: 'success', message: `Facture envoyée à ${emailTo}` });
      // Mettre à jour le statut de la facture à "sent"
      try {
        await updateInvoice(invoice.id, { status: 'sent' });
        setInvoice(prev => prev ? { ...prev, status: 'sent' } : prev);
      } catch (_e) {
        // Non bloquant : le mail a bien été envoyé
      }
      // Fermer le modal après 2s et rafraîchir la liste
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailFeedback(null);
        onClose(true); // Rafraîchir la liste parente
      }, 2000);
    } else {
      setEmailFeedback({ type: 'error', message: result.error || 'Erreur lors de l\'envoi' });
    }
  };

  return (
    <>
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => onClose()}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">

                {/* Barre d'actions */}
                <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {invoice ? `Facture ${invoice.invoice_number}` : 'Chargement...'}
                  </Dialog.Title>
                  <div className="flex items-center gap-2">
                    {invoice && !isEditing && (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          Modifier
                        </button>
                        <button
                          onClick={handlePrint}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          <FiPrinter className="w-4 h-4" />
                          Imprimer
                        </button>
                        <button
                          onClick={handleDownloadPdf}
                          title="Télécharger PDF"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          <FiDownload className="w-4 h-4" />
                          PDF
                        </button>
                        <button
                          onClick={handleOpenEmailModal}
                          title="Envoyer par email"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                        >
                          <FiMail className="w-4 h-4" />
                          Envoyer
                        </button>
                        <button
                          disabled
                          title="Disponible après déploiement du projet (Payrexx requiert un domaine)"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed"
                        >
                          <FiCreditCard className="w-4 h-4" />
                          Payer en ligne
                        </button>
                      </>
                    )}
                    {invoice && isEditing && (
                      <>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                          disabled={isSaving}
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleSave}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                          disabled={isSaving}
                        >
                          <FiSave className="w-4 h-4" />
                          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onClose()}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Bannière lien de paiement */}
                {paymentLink && (
                  <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <FiCreditCard className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <p className="text-sm text-emerald-800 font-medium">Lien de paiement créé</p>
                      <span className="text-xs text-emerald-600 truncate hidden sm:block">{paymentLink}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => navigator.clipboard.writeText(paymentLink)}
                        className="text-xs px-2.5 py-1 bg-white border border-emerald-300 text-emerald-700 rounded-md hover:bg-emerald-50"
                      >
                        Copier
                      </button>
                      <a
                        href={paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                      >
                        Ouvrir <FiExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
                {paymentError && (
                  <div className="px-6 py-2 bg-red-50 border-b border-red-100 text-sm text-red-700">
                    ⚠️ {paymentError}
                    <button onClick={() => setPaymentError(null)} className="ml-2 text-red-400 hover:text-red-600">✕</button>
                  </div>
                )}

                {/* Contenu */}
                <div className="p-6 max-h-[85vh] overflow-y-auto">
                  {isLoading && (
                    <div className="flex items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-md text-center">
                      <p>{error}</p>
                    </div>
                  )}

                  {invoice && !isLoading && (
                    <div ref={printRef} className="relative">

                      {/* Bannière avertissement si infos société incomplètes */}
                      {(!invoice.company_address || !invoice.iban) && !isEditing && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                          <FiAlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                          <div>
                            <p className="font-semibold mb-0.5">Informations de l'organisation incomplètes</p>
                            <p>
                              {!invoice.company_address && !invoice.iban
                                ? "L'adresse et l'IBAN sont manquants."
                                : !invoice.company_address
                                ? "L'adresse de votre organisation est manquante."
                                : "L'IBAN est manquant — le QR-bill ne peut pas être généré."}
                              {' '}
                              <a href="/dashboard/settings" className="underline font-medium hover:text-amber-900">
                                Compléter dans les paramètres →
                              </a>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ── HEADER : Logo + FACTURE ── */}
                      <div className="flex justify-between items-start mb-5">
                        {/* Logo */}
                        <div>
                          {invoice.company_logo_url && (
                            <img src={invoice.company_logo_url} alt="Logo"
                              className="max-h-14 max-w-[180px] object-contain" />
                          )}
                        </div>
                        {/* Titre + numéro + statut */}
                        <div className="text-right">
                          <h1 className="text-3xl font-bold" style={{ color: invoice.primary_color || '#2563EB' }}>
                            FACTURE
                          </h1>
                          <p className="text-base font-bold text-gray-900 mt-1">{invoice.invoice_number}</p>
                          <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                            <p>Date : {formatDate(invoice.date)}</p>
                            <p>Échéance : {formatDate(invoice.due_date)}</p>
                          </div>
                          <div className="mt-2">
                            {invoice.status === 'paid'      && <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">✓ Payée</span>}
                            {invoice.status === 'sent'      && <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">Envoyée</span>}
                            {invoice.status === 'draft'     && <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">Brouillon</span>}
                            {invoice.status === 'overdue'   && <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">En retard</span>}
                            {invoice.status === 'cancelled' && <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-400 rounded-full line-through">Annulée</span>}
                          </div>
                        </div>
                      </div>

                      {/* ── ÉMETTEUR + DESTINATAIRE côte à côte ── */}
                      <div className="grid grid-cols-2 gap-6 mb-5 pb-5 border-b border-gray-200">
                        {/* Émetteur */}
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Émetteur</p>
                          <div className="text-sm leading-[1.35]">
                            <span className="block font-bold text-gray-900">{invoice.company_name || 'Mon entreprise'}</span>
                            {invoice.company_address
                              ? <span className="block text-gray-600">{invoice.company_address}</span>
                              : <span className="block text-amber-600 italic text-xs">Adresse manquante</span>}
                            {(invoice.company_postal_code || invoice.company_city) && (
                              <span className="block text-gray-600">{invoice.company_postal_code} {invoice.company_city}</span>
                            )}
                            <span className="block text-gray-600">{invoice.company_country || 'Suisse'}</span>
                            {invoice.company_vat && (
                              <span className="block text-gray-400 text-xs mt-0.5">IDE : CHE-{invoice.company_vat}</span>
                            )}
                          </div>
                        </div>

                        {/* Destinataire */}
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Destinataire</p>
                          {isEditing ? (
                            <div className="space-y-1">
                              <input type="text" value={invoice.client_name}
                                onChange={(e) => handleFieldChange('client_name', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded" placeholder="Nom" />
                              <input type="text" value={invoice.client_company || ''}
                                onChange={(e) => handleFieldChange('client_company', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded" placeholder="Entreprise" />
                              <input type="text" value={invoice.client_address || ''}
                                onChange={(e) => handleFieldChange('client_address', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded" placeholder="Adresse" />
                              <div className="flex gap-1">
                                <input type="text" value={invoice.client_postal_code || ''}
                                  onChange={(e) => handleFieldChange('client_postal_code', e.target.value)}
                                  className="w-1/3 px-2 py-1 text-sm border border-gray-300 rounded" placeholder="CP" />
                                <input type="text" value={invoice.client_city || ''}
                                  onChange={(e) => handleFieldChange('client_city', e.target.value)}
                                  className="w-2/3 px-2 py-1 text-sm border border-gray-300 rounded" placeholder="Ville" />
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm leading-[1.35] border-l-4 pl-3" style={{ borderColor: invoice.primary_color || '#2563EB' }}>
                              <span className="block font-bold text-gray-900">{invoice.client_name}</span>
                              {invoice.client_company && <span className="block text-gray-700">{invoice.client_company}</span>}
                              {invoice.client_address && <span className="block text-gray-600">{invoice.client_address}</span>}
                              {(invoice.client_postal_code || invoice.client_city) && (
                                <span className="block text-gray-600">{invoice.client_postal_code} {invoice.client_city}</span>
                              )}
                              {invoice.client_country && invoice.client_country !== 'CH' && (
                                <span className="block text-gray-600">{invoice.client_country}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Table des articles compacte */}
                      <table className="w-full text-sm mb-6">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left py-2 px-2 text-xs font-semibold text-gray-600 uppercase">Description</th>
                            <th className="text-right py-2 px-2 text-xs font-semibold text-gray-600 uppercase w-16">Qté</th>
                            <th className="text-right py-2 px-2 text-xs font-semibold text-gray-600 uppercase w-24">Prix unit.</th>
                            <th className="text-right py-2 px-2 text-xs font-semibold text-gray-600 uppercase w-16">TVA</th>
                            <th className="text-right py-2 px-2 text-xs font-semibold text-gray-600 uppercase w-24">Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items.map((item, index) => (
                            <tr key={item.id || index} className="border-b border-gray-200">
                              <td className="py-2 px-2">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                    className="w-full px-1 py-0.5 text-sm border rounded"
                                  />
                                ) : (
                                  item.description
                                )}
                              </td>
                              <td className="py-2 px-2 text-right">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                    className="w-full px-1 py-0.5 text-sm border rounded text-right"
                                  />
                                ) : (
                                  item.quantity
                                )}
                              </td>
                              <td className="py-2 px-2 text-right">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={item.unitPrice}
                                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    className="w-full px-1 py-0.5 text-sm border rounded text-right"
                                  />
                                ) : (
                                  (item.unitPrice || 0).toFixed(2)
                                )}
                              </td>
                              <td className="py-2 px-2 text-right">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={item.vatRate}
                                    onChange={(e) => handleItemChange(index, 'vatRate', parseFloat(e.target.value) || 0)}
                                    className="w-full px-1 py-0.5 text-sm border rounded text-right"
                                  />
                                ) : (
                                  `${(item.vatRate || 0).toFixed(1)}%`
                                )}
                              </td>
                              <td className="py-2 px-2 text-right font-medium">
                                {(item.total || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Totaux à droite */}
                      <div className="totals ml-auto w-64 mb-8">
                        <div className="totals-row flex justify-between py-1 text-sm">
                          <span className="text-gray-600">Sous-total:</span>
                          <span>{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="totals-row flex justify-between py-1 text-sm">
                          <span className="text-gray-600">TVA:</span>
                          <span>{formatCurrency(invoice.tax_amount)}</span>
                        </div>
                        <div className="totals-row total flex justify-between py-2 text-base font-bold border-t-2 border-gray-800 mt-2">
                          <span>Total:</span>
                          <span style={{ color: invoice.primary_color || '#2563EB' }}>{formatCurrency(invoice.total)}</span>
                        </div>
                      </div>

                      {/* Notes et conditions de paiement */}
                      <div className="footer text-xs text-gray-500 mb-4 max-w-2xl border-t border-gray-100 pt-3">
                        <span className="font-semibold text-gray-700">Conditions : </span>
                        Paiement dû avant le {formatDate(invoice.due_date)}.
                        {invoice.notes && (
                          <span className="ml-2 italic text-gray-500">{invoice.notes}</span>
                        )}
                      </div>

                      {/* Erreur QR (IBAN manquant ou invalide) */}
                      {qrError && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
                          ⚠️ {qrError}
                        </div>
                      )}

                      {/* Section QR-Bill suisse standard : Récépissé | QR | Section paiement */}
                      {qrCodeUrl && !qrError && (
                        <div className="qr-bill-section mt-6 pt-4 border-t-2 border-dashed border-gray-400">
                          <div className="flex gap-0">

                            {/* ① Récépissé (gauche ~28%) */}
                            <div className="border-r-2 border-dashed border-gray-400 pr-3 mr-3" style={{width: '28%'}}>
                              <p className="text-[9px] font-bold mb-1.5">Récépissé</p>
                              <div className="text-[7.5px] leading-tight text-gray-700 space-y-0.5">
                                <p className="font-semibold">Compte / Payable à</p>
                                <p className="font-mono text-[7px]">{invoice.iban ? formatIbanDisplay(invoice.iban) : ''}</p>
                                <p className="font-semibold">{invoice.company_name}</p>
                                {invoice.company_address && <p>{invoice.company_address}</p>}
                                <p>{invoice.company_postal_code} {invoice.company_city}</p>
                                <p className="font-semibold mt-1.5">Payable par</p>
                                <p>{invoice.client_name}</p>
                                {invoice.client_address && <p>{invoice.client_address}</p>}
                                <p>{invoice.client_postal_code} {invoice.client_city}</p>
                                <p className="font-semibold mt-1.5">Montant</p>
                                <p className="font-bold text-[9px]">{invoice.devise || 'CHF'} {invoice.total.toFixed(2)}</p>
                              </div>
                            </div>

                            {/* ② QR code (centre ~32%) */}
                            <div className="flex flex-col items-center justify-start" style={{width: '32%'}}>
                              <img src={qrCodeUrl} alt="Swiss QR Code" className="w-28 h-28 border border-black" />
                              <p className="text-[7px] mt-1 text-gray-500 text-center">QR-Facture Suisse</p>
                              {(invoice.devise === 'CHF' || !invoice.devise) && (
                                <div className="mt-2 text-center">
                                  <a
                                    href={`twint://payment?amount=${invoice.total.toFixed(2)}&currency=CHF&message=${encodeURIComponent(invoice.invoice_number)}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white text-[8px] font-semibold rounded-md hover:bg-gray-900 transition-colors"
                                    title="Payer avec TWINT"
                                  >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                                    </svg>
                                    TWINT
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* ③ Section de paiement (droite ~40%) */}
                            <div className="ml-3 flex-1 text-[8px] leading-tight text-gray-700">
                              <p className="text-[10px] font-bold mb-1.5">Section de paiement</p>
                              <div className="space-y-1.5">
                                <div>
                                  <p className="font-semibold">Compte / Payable à</p>
                                  <p className="font-mono text-[7px]">{invoice.iban ? formatIbanDisplay(invoice.iban) : ''}</p>
                                  <p className="font-semibold">{invoice.company_name}</p>
                                  {invoice.company_address && <p>{invoice.company_address}</p>}
                                  <p>{invoice.company_postal_code} {invoice.company_city}</p>
                                </div>
                                <div>
                                  <p className="font-semibold">Référence</p>
                                  <p>{invoice.invoice_number}</p>
                                </div>
                                <div>
                                  <p className="font-semibold">Payable par</p>
                                  <p>{invoice.client_name}</p>
                                  {invoice.client_address && <p>{invoice.client_address}</p>}
                                  <p>{invoice.client_postal_code} {invoice.client_city}</p>
                                </div>
                                <div className="flex gap-6 mt-1">
                                  <div>
                                    <p className="font-semibold">Devise</p>
                                    <p className="font-bold text-[10px]">{invoice.devise || 'CHF'}</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold">Montant</p>
                                    <p className="font-bold text-[12px]">{invoice.total.toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>

    {/* Modal envoi par email */}
    {showEmailModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiMail className="w-5 h-5 text-blue-600" />
              Envoyer la facture par email
            </h3>
            <button
              onClick={() => setShowEmailModal(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md"
              disabled={isSendingEmail}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {emailFeedback ? (
            <div className={`p-4 rounded-lg text-sm font-medium ${
              emailFeedback.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {emailFeedback.type === 'success' ? '✅' : '❌'} {emailFeedback.message}
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-100">
                La facture <strong>{invoice?.invoice_number}</strong> sera envoyée avec le PDF et le QR code de paiement en pièce jointe.
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email du destinataire
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="client@exemple.ch"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  disabled={isSendingEmail}
                />
                {invoice?.client_email && emailTo !== invoice.client_email && (
                  <button
                    type="button"
                    onClick={() => setEmailTo(invoice.client_email!)}
                    className="mt-1 text-xs text-blue-600 hover:underline"
                  >
                    Utiliser l'email du client : {invoice.client_email}
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isSendingEmail}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || !emailTo.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <FiMail className="w-4 h-4" />
                      Envoyer
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
};

export default InvoiceModal;
