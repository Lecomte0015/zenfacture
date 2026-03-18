/**
 * Service d'envoi d'emails — ZenFacture
 * Appelle la Edge Function Supabase `send-email` (via Resend).
 *
 * Configuration requise (secrets Supabase) :
 *   RESEND_API_KEY  — https://resend.com → API Keys
 *   APP_FROM_EMAIL  — Domaine vérifié sur Resend (ex: factures@zenfacture.ch)
 *   APP_FROM_NAME   — Nom de l'expéditeur (ex: ZenFacture)
 */

import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendInvoiceEmailParams {
  /** Email du destinataire */
  to: string;
  /** Nom du destinataire (pour la personnalisation) */
  recipientName?: string;
  /** Nom de l'entreprise émettrice */
  senderName: string;
  /** Numéro de la facture */
  invoiceNumber: string;
  /** Montant total formaté (ex: "1 250.00") */
  amount: string;
  /** Devise (ex: "CHF") */
  currency: string;
  /** Date d'échéance ISO */
  dueDate: string;
  /** Notes/remarques optionnelles */
  notes?: string;
  /** PDF en base64 pour pièce jointe (optionnel) */
  pdfBase64?: string;
}

export interface SendReminderEmailParams {
  to: string;
  recipientName?: string;
  senderName: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  dueDate: string;
  /** Niveau de rappel : 1, 2 ou 3 */
  level?: 1 | 2 | 3;
}

export interface EmailResult {
  success: boolean;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function invokeEmailFunction(body: Record<string, unknown>): Promise<EmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', { body });

    if (error) {
      return { success: false, error: error.message || 'Erreur lors de l\'appel à la fonction email' };
    }
    if (data?.error) {
      return { success: false, error: data.error };
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau';
    return { success: false, error: message };
  }
}

// ─── API publique ─────────────────────────────────────────────────────────────

/**
 * Envoie une facture par email au client.
 * Le PDF est optionnel — si fourni, il est attaché en pièce jointe.
 */
export async function sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<EmailResult> {
  return invokeEmailFunction({ type: 'invoice', ...params });
}

/**
 * Envoie un rappel de paiement pour une facture en retard.
 */
export async function sendReminderEmail(params: SendReminderEmailParams): Promise<EmailResult> {
  return invokeEmailFunction({ type: 'reminder', ...params });
}

/**
 * Génère le PDF d'une facture en base64 pour l'attacher à un email.
 * Utilise la même logique que handleDownloadPdf dans InvoiceModal.
 * Retourne null si jsPDF n'est pas disponible ou si une erreur survient.
 */
export async function generatePdfBase64(invoiceData: {
  invoice_number: string;
  company_name?: string;
  company_address?: string;
  company_postal_code?: string;
  company_city?: string;
  company_country?: string;
  company_vat?: string;
  client_name: string;
  client_address?: string;
  client_postal_code?: string;
  client_city?: string;
  client_country?: string;
  date: string;
  due_date: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; vatRate: number; total: number }>;
  subtotal: number;
  tax_amount: number;
  total: number;
  devise?: string;
  iban?: string;
  qrCodeDataUrl?: string;
  company_logo_url?: string;
  primary_color?: string;
  header_bg_color?: string;
}): Promise<string | null> {
  try {
    const { default: jsPDF } = await import('jspdf');
    const { formatIbanDisplay } = await import('./swissQrService');

    // Helpers couleurs
    const hexToRgb = (hex: string): [number, number, number] => {
      const h = (hex || '').replace('#', '');
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return [isNaN(r) ? 37 : r, isNaN(g) ? 99 : g, isNaN(b) ? 235 : b];
    };
    const loadImageAsDataUrl = (url: string): Promise<string> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
          canvas.getContext('2d')?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('logo load failed'));
        img.src = url;
      });

    const primaryRgb = hexToRgb(invoiceData.primary_color || '#2563EB');
    const headerBgRgb = hexToRgb(invoiceData.header_bg_color || '#F3F4F6');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const marginL = 20;
    const marginR = 20;
    const contentW = pageW - marginL - marginR;
    let y = 20;
    const ln = (n = 1) => { y += n; };

    const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

    // Logo
    if (invoiceData.company_logo_url) {
      try {
        const logoDataUrl = await loadImageAsDataUrl(invoiceData.company_logo_url);
        doc.addImage(logoDataUrl, 'PNG', pageW - marginR - 50, y - 5, 50, 20);
      } catch { /* logo indisponible */ }
    }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text(invoiceData.company_name || '', marginL, y);
    doc.setFontSize(invoiceData.company_logo_url ? 14 : 22);
    doc.setTextColor(...primaryRgb);
    doc.text('FACTURE', pageW - marginR, invoiceData.company_logo_url ? y + 17 : y, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    ln(6); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    if (invoiceData.company_address) doc.text(invoiceData.company_address, marginL, y);
    doc.text(`N° ${invoiceData.invoice_number}`, pageW - marginR, y, { align: 'right' });
    ln(4);
    doc.text(`${invoiceData.company_postal_code || ''} ${invoiceData.company_city || ''}`.trim(), marginL, y);
    doc.text(`Date : ${fmt(invoiceData.date)}`, pageW - marginR, y, { align: 'right' });
    ln(4);
    doc.text(invoiceData.company_country || 'Suisse', marginL, y);
    doc.text(`Échéance : ${fmt(invoiceData.due_date)}`, pageW - marginR, y, { align: 'right' });
    if (invoiceData.company_vat) { ln(4); doc.text(`IDE: CHE-${invoiceData.company_vat}`, marginL, y); }

    ln(12);
    doc.setDrawColor(...primaryRgb); doc.setLineWidth(0.5);
    doc.line(marginL, y, marginL, y + 22);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(invoiceData.client_name, marginL + 3, y + 4);
    doc.setFont('helvetica', 'normal');
    if (invoiceData.client_address) doc.text(invoiceData.client_address, marginL + 3, y + 9);
    doc.text(`${invoiceData.client_postal_code || ''} ${invoiceData.client_city || ''}`.trim(), marginL + 3, y + 14);
    doc.text(invoiceData.client_country || 'Suisse', marginL + 3, y + 19);
    doc.setDrawColor(0, 0, 0);
    ln(30);

    const colX = [marginL, marginL + 80, marginL + 105, marginL + 128, marginL + 155];
    doc.setFillColor(...headerBgRgb);
    doc.rect(marginL, y, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('DESCRIPTION', colX[0] + 1, y + 4.5);
    doc.text('QTÉ', colX[1], y + 4.5, { align: 'right' });
    doc.text('PRIX UNIT.', colX[2], y + 4.5, { align: 'right' });
    doc.text('TVA', colX[3], y + 4.5, { align: 'right' });
    doc.text('MONTANT', colX[4] + 15, y + 4.5, { align: 'right' });
    ln(8);

    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    for (const item of invoiceData.items) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.text(doc.splitTextToSize(item.description, 75), colX[0], y);
      doc.text(String(item.quantity), colX[1], y, { align: 'right' });
      doc.text(`${(item.unitPrice || 0).toFixed(2)}`, colX[2], y, { align: 'right' });
      doc.text(`${(item.vatRate || 0).toFixed(1)}%`, colX[3], y, { align: 'right' });
      doc.text(`${(item.total || 0).toFixed(2)}`, colX[4] + 15, y, { align: 'right' });
      doc.setDrawColor(220, 220, 220);
      doc.line(marginL, y + 2, marginL + contentW, y + 2);
      doc.setDrawColor(0, 0, 0);
      ln(7);
    }

    ln(4);
    const totX = marginL + contentW - 60;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text('Sous-total :', totX, y);
    doc.text(`${(invoiceData.subtotal || 0).toFixed(2)} ${invoiceData.devise || 'CHF'}`, marginL + contentW, y, { align: 'right' });
    ln(5); doc.text('TVA :', totX, y);
    doc.text(`${(invoiceData.tax_amount || 0).toFixed(2)} ${invoiceData.devise || 'CHF'}`, marginL + contentW, y, { align: 'right' });
    ln(2); doc.setLineWidth(0.4); doc.line(totX, y, marginL + contentW, y); ln(5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('Total :', totX, y);
    doc.setTextColor(...primaryRgb);
    doc.text(`${(invoiceData.total || 0).toFixed(2)} ${invoiceData.devise || 'CHF'}`, marginL + contentW, y, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docAny = doc as any;

    if (invoiceData.qrCodeDataUrl && invoiceData.iban) {
      const qrY = 230;
      doc.setLineWidth(0.3); docAny.setLineDashPattern([2, 2], 0);
      doc.line(marginL, qrY, marginL + contentW, qrY);
      docAny.setLineDashPattern([], 0);

      doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
      doc.text('Récépissé', marginL, qrY + 5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
      doc.text('Compte / Payable à', marginL, qrY + 10);
      doc.text(formatIbanDisplay(invoiceData.iban), marginL, qrY + 14);
      doc.text(invoiceData.company_name || '', marginL, qrY + 18);
      doc.text(`${invoiceData.company_postal_code || ''} ${invoiceData.company_city || ''}`.trim(), marginL, qrY + 22);
      doc.text('Payable par', marginL, qrY + 28);
      doc.text(invoiceData.client_name, marginL, qrY + 32);
      doc.text(`${invoiceData.client_postal_code || ''} ${invoiceData.client_city || ''}`.trim(), marginL, qrY + 36);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
      doc.text('Montant', marginL, qrY + 42);
      doc.text(`${invoiceData.devise || 'CHF'} ${(invoiceData.total || 0).toFixed(2)}`, marginL, qrY + 47);

      docAny.setLineDashPattern([2, 2], 0);
      doc.line(marginL + 52, qrY, marginL + 52, qrY + 55);
      docAny.setLineDashPattern([], 0);

      doc.addImage(invoiceData.qrCodeDataUrl, 'PNG', marginL + 57, qrY + 3, 46, 46);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
      doc.text('QR-Facture Suisse', marginL + 80, qrY + 52, { align: 'center' });

      const pyX = marginL + 110;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
      doc.text('Section de paiement', pyX, qrY + 5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
      doc.text('Compte / Payable à', pyX, qrY + 10);
      doc.text(formatIbanDisplay(invoiceData.iban), pyX, qrY + 14);
      doc.text(invoiceData.company_name || '', pyX, qrY + 18);
      doc.text(`${invoiceData.company_postal_code || ''} ${invoiceData.company_city || ''}`.trim(), pyX, qrY + 22);
      doc.text('Référence', pyX, qrY + 28);
      doc.text(invoiceData.invoice_number, pyX, qrY + 32);
      doc.text('Payable par', pyX, qrY + 38);
      doc.text(invoiceData.client_name, pyX, qrY + 42);
      doc.text(`${invoiceData.client_postal_code || ''} ${invoiceData.client_city || ''}`.trim(), pyX, qrY + 46);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text(`${invoiceData.devise || 'CHF'}  ${(invoiceData.total || 0).toFixed(2)}`, pyX, qrY + 53);
    }

    // Retourner en base64 (sans le préfixe data URI)
    return doc.output('datauristring').split(',')[1];
  } catch (err) {
    console.error('Erreur génération PDF base64:', err);
    return null;
  }
}
