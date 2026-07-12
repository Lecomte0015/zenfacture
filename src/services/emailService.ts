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
    const { data, error } = await supabase.functions.invoke('resend-email', { body });

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
  company_email?: string;
  company_phone?: string;
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
  notes?: string;
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
    const lightPrimary: [number, number, number] = [
      Math.round(primaryRgb[0] * 0.12 + 225),
      Math.round(primaryRgb[1] * 0.12 + 225),
      Math.round(primaryRgb[2] * 0.12 + 225),
    ];
    const headerBandRgb: [number, number, number] = [
      Math.round(primaryRgb[0] * 0.16 + 213),
      Math.round(primaryRgb[1] * 0.16 + 213),
      Math.round(primaryRgb[2] * 0.16 + 213),
    ];

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const marginL = 20;
    const marginR = 20;
    const contentW = pageW - marginL - marginR;
    let y = 20;
    const ln = (n = 1) => { y += n; };

    const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

    // Bandeau d'en-tête coloré (identité visuelle, pleine largeur)
    doc.setFillColor(...headerBandRgb);
    doc.rect(0, 0, pageW, 46, 'F');

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
    ln(5);

    // Total mis en valeur dans un encadré teinté
    const totBoxH = 13;
    doc.setFillColor(...lightPrimary);
    doc.roundedRect(totX - 4, y, marginL + contentW - (totX - 4), totBoxH, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.setTextColor(...primaryRgb);
    doc.text('Total', totX, y + 8.5);
    doc.text(`${(invoiceData.total || 0).toFixed(2)} ${invoiceData.devise || 'CHF'}`, marginL + contentW, y + 8.5, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y += totBoxH + 6;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docAny = doc as any;
    const hasBill = !!(invoiceData.qrCodeDataUrl && invoiceData.iban);
    const pageH = 297;
    const billHeight = 105;
    const footerHeight = 22;
    const reserved = hasBill ? billHeight + footerHeight : footerHeight + 12;
    const availableBottom = pageH - reserved;

    // Conditions de paiement + remarques
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    if (invoiceData.due_date) {
      doc.text(`Conditions de paiement : dû avant le ${fmt(invoiceData.due_date)}.`, marginL, y);
      y += 4.5;
    }
    if (invoiceData.notes) {
      const noteLines = doc.splitTextToSize(`Remarques : ${invoiceData.notes}`, contentW);
      doc.text(noteLines, marginL, y);
      y += noteLines.length * 4.5;
    }

    // Conditions générales par défaut — uniquement si la place le permet
    // réellement, pour ne jamais provoquer un saut de page inutile.
    doc.setFontSize(7.5);
    const cgvText = "Conditions générales : sauf accord contraire écrit, le montant de cette facture est dû net dans le délai indiqué ci-dessus. Passé ce délai, des intérêts moratoires de 5% l'an pourront être appliqués de plein droit, sans mise en demeure préalable. Pour toute question relative à cette facture, merci de nous contacter aux coordonnées ci-dessous.";
    const cgvLines = doc.splitTextToSize(cgvText, contentW);
    const cgvBlockHeight = 4 + cgvLines.length * 3.6;
    if (y + cgvBlockHeight + 6 < availableBottom - 8) {
      y += 4;
      doc.setTextColor(150, 150, 150);
      doc.text(cgvLines, marginL, y);
      y += cgvLines.length * 3.6;
    }
    doc.setTextColor(0, 0, 0);
    y += 6;

    if (y > pageH - reserved - 6) {
      doc.addPage();
    }

    const footerTop = pageH - reserved;
    const contactParts = [invoiceData.company_email, invoiceData.company_phone].filter(Boolean) as string[];

    // Bannière "Merci" teintée
    doc.setFillColor(...lightPrimary);
    doc.rect(0, footerTop, pageW, footerHeight, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.setTextColor(...primaryRgb);
    doc.text('Merci pour votre confiance !', pageW / 2, footerTop + 9, { align: 'center' });
    if (contactParts.length) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text(contactParts.join('  •  '), pageW / 2, footerTop + 16, { align: 'center' });
    }
    doc.setTextColor(0, 0, 0);

    if (hasBill && invoiceData.iban) {
      const billTop = pageH - billHeight;

      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.setTextColor(90, 90, 90);
      doc.text('Séparer avant le paiement', pageW / 2, billTop - 3, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.setLineWidth(0.3); docAny.setLineDashPattern([1.5, 1.5], 0);
      doc.line(0, billTop, pageW, billTop);
      doc.line(62, billTop, 62, pageH);
      docAny.setLineDashPattern([], 0);

      // ── Récépissé (0–62mm) ──
      const rX = 5;
      let rY = billTop + 10;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text('Récépissé', rX, rY);

      rY = billTop + 19;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6);
      doc.text('Compte / Payable à', rX, rY); rY += 3.5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(formatIbanDisplay(invoiceData.iban), rX, rY); rY += 3.5;
      doc.text(invoiceData.company_name || '', rX, rY); rY += 3.5;
      doc.text(`${invoiceData.company_postal_code || ''} ${invoiceData.company_city || ''}`.trim(), rX, rY);
      rY += 6;

      doc.setFont('helvetica', 'bold'); doc.setFontSize(6);
      doc.text('Payable par', rX, rY); rY += 3.5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(invoiceData.client_name || '', rX, rY); rY += 3.5;
      doc.text(`${invoiceData.client_postal_code || ''} ${invoiceData.client_city || ''}`.trim(), rX, rY);

      const rBottomY = billTop + 88;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6);
      doc.text('Monnaie', rX, rBottomY);
      doc.text('Montant', rX + 18, rBottomY);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(invoiceData.devise || 'CHF', rX, rBottomY + 4);
      doc.text((invoiceData.total || 0).toFixed(2), rX + 18, rBottomY + 4);

      doc.setFont('helvetica', 'bold'); doc.setFontSize(6);
      doc.text('Point de dépôt', 62 - 5, billTop + 96, { align: 'right' });

      // ── Section paiement (62–210mm) ──
      const pX = 67;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text('Section paiement', pX, billTop + 10);

      const qrTop = billTop + 17;
      const qrSize = 46;
      doc.addImage(invoiceData.qrCodeDataUrl, 'PNG', pX, qrTop, qrSize, qrSize);

      const amtY = qrTop + qrSize + 6;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text('Monnaie', pX, amtY);
      doc.text('Montant', pX + 22, amtY);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.text(invoiceData.devise || 'CHF', pX, amtY + 5);
      doc.text((invoiceData.total || 0).toFixed(2), pX + 22, amtY + 5);

      const infoX = pX + qrSize + 5;
      let infoY = billTop + 10;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text('Compte / Payable à', infoX, infoY); infoY += 4;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.text(formatIbanDisplay(invoiceData.iban), infoX, infoY); infoY += 4;
      doc.text(invoiceData.company_name || '', infoX, infoY); infoY += 4;
      doc.text(`${invoiceData.company_postal_code || ''} ${invoiceData.company_city || ''}`.trim(), infoX, infoY);
      infoY += 7;

      if (invoiceData.invoice_number) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        doc.text('Informations supplémentaires', infoX, infoY); infoY += 4;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(invoiceData.invoice_number, infoX, infoY);
        infoY += 7;
      }

      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text('Payable par', infoX, infoY); infoY += 4;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.text(invoiceData.client_name || '', infoX, infoY); infoY += 4;
      doc.text(`${invoiceData.client_postal_code || ''} ${invoiceData.client_city || ''}`.trim(), infoX, infoY);
    }

    // Retourner en base64 (sans le préfixe data URI)
    return doc.output('datauristring').split(',')[1];
  } catch (err) {
    console.error('Erreur génération PDF base64:', err);
    return null;
  }
}
