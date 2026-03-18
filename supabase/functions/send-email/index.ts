/**
 * Edge Function : send-email
 * Envoi d'emails transactionnels via Resend (https://resend.com).
 *
 * Variables d'environnement requises :
 *   RESEND_API_KEY  — Clé API Resend (obtenir sur resend.com)
 *   APP_FROM_EMAIL  — Adresse d'expédition vérifiée sur Resend (ex: factures@zenfacture.ch)
 *   APP_FROM_NAME   — Nom de l'expéditeur (ex: ZenFacture)
 *
 * Types d'email supportés :
 *   - "invoice"  : Envoi d'une facture avec PDF en pièce jointe
 *   - "reminder" : Rappel de paiement
 *   - "generic"  : Email générique (to + subject + html)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('APP_FROM_EMAIL') ?? 'factures@zenfacture.ch';
const FROM_NAME = Deno.env.get('APP_FROM_NAME') ?? 'ZenFacture';

// ─── Templates HTML ──────────────────────────────────────────────────────────

function templateInvoice(params: {
  recipientName: string;
  senderName: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  dueDate: string;
  notes?: string;
}): string {
  const { recipientName, senderName, invoiceNumber, amount, currency, dueDate, notes } = params;
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Facture ${invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">ZenFacture</h1>
              <p style="margin:4px 0 0;color:#93c5fd;font-size:14px;">Facturation suisse simplifiée</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;">Bonjour ${recipientName},</p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;">
                Veuillez trouver ci-joint la facture <strong>${invoiceNumber}</strong> de <strong>${senderName}</strong>.
              </p>

              <!-- Montant -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 4px;color:#0284c7;font-size:12px;text-transform:uppercase;letter-spacing:.5px;font-weight:600;">Montant à payer</p>
                    <p style="margin:0;color:#0c4a6e;font-size:28px;font-weight:700;">${amount} ${currency}</p>
                    <p style="margin:6px 0 0;color:#0369a1;font-size:13px;">Échéance : <strong>${dueDate}</strong></p>
                  </td>
                </tr>
              </table>

              ${notes ? `<p style="margin:0 0 24px;color:#6b7280;font-size:14px;font-style:italic;background:#f9fafb;padding:16px;border-radius:6px;border-left:3px solid #d1d5db;">${notes}</p>` : ''}

              <p style="margin:0 0 8px;color:#374151;font-size:14px;">
                Le QR code de paiement suisse est inclus dans le PDF ci-joint.<br>
                Vous pouvez le scanner directement depuis votre application bancaire.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                Cet email a été envoyé via <strong>ZenFacture</strong> au nom de <strong>${senderName}</strong>.<br>
                Pour toute question, contactez directement l'émetteur de cette facture.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function templateReminder(params: {
  recipientName: string;
  senderName: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  dueDate: string;
  level: number; // 1, 2 ou 3
}): string {
  const { recipientName, senderName, invoiceNumber, amount, currency, dueDate, level } = params;
  const levelText = level === 1
    ? 'premier rappel'
    : level === 2
    ? 'deuxième rappel'
    : 'dernier rappel avant procédure';
  const urgency = level >= 3 ? '#dc2626' : level === 2 ? '#d97706' : '#2563eb';

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Rappel facture ${invoiceNumber}</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <tr>
            <td style="background:${urgency};padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Rappel de paiement — ${levelText}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;">Bonjour ${recipientName},</p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;">
                Nous vous rappelons que la facture <strong>${invoiceNumber}</strong> de <strong>${senderName}</strong>
                est en attente de paiement.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 4px;color:#dc2626;font-size:12px;text-transform:uppercase;font-weight:600;">Montant dû</p>
                    <p style="margin:0;color:#7f1d1d;font-size:28px;font-weight:700;">${amount} ${currency}</p>
                    <p style="margin:6px 0 0;color:#b91c1c;font-size:13px;">Échéance dépassée depuis le <strong>${dueDate}</strong></p>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#374151;font-size:14px;">
                Merci d'effectuer le paiement dans les meilleurs délais afin d'éviter des frais supplémentaires.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                Email envoyé via <strong>ZenFacture</strong> au nom de <strong>${senderName}</strong>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Handler principal ────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'RESEND_API_KEY non configurée. Ajoutez-la dans les secrets Supabase.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { type = 'generic' } = body;

    let emailPayload: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      attachments?: { filename: string; content: string }[];
    };

    if (type === 'invoice') {
      const { to, recipientName, senderName, invoiceNumber, amount, currency, dueDate, notes, pdfBase64 } = body;
      if (!to || !invoiceNumber) {
        return new Response(JSON.stringify({ error: 'Champs requis manquants : to, invoiceNumber' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const dueDateFormatted = dueDate
        ? new Date(dueDate).toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '-';

      emailPayload = {
        from: `${senderName || FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: `Facture ${invoiceNumber} — ${amount} ${currency}`,
        html: templateInvoice({ recipientName: recipientName || to, senderName: senderName || FROM_NAME, invoiceNumber, amount, currency, dueDate: dueDateFormatted, notes }),
        attachments: pdfBase64
          ? [{ filename: `facture-${invoiceNumber}.pdf`, content: pdfBase64 }]
          : undefined,
      };

    } else if (type === 'reminder') {
      const { to, recipientName, senderName, invoiceNumber, amount, currency, dueDate, level = 1 } = body;
      if (!to || !invoiceNumber) {
        return new Response(JSON.stringify({ error: 'Champs requis manquants : to, invoiceNumber' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const dueDateFormatted = dueDate
        ? new Date(dueDate).toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '-';

      emailPayload = {
        from: `${senderName || FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: `[Rappel ${level}/3] Facture ${invoiceNumber} en attente de paiement`,
        html: templateReminder({ recipientName: recipientName || to, senderName: senderName || FROM_NAME, invoiceNumber, amount, currency, dueDate: dueDateFormatted, level }),
      };

    } else {
      // Email générique — utilisé par send-reminders et send-trial-reminders existants
      const { to, subject, html } = body;
      if (!to || !subject || !html) {
        return new Response(JSON.stringify({ error: 'Champs requis manquants : to, subject, html' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      emailPayload = { from: `${FROM_NAME} <${FROM_EMAIL}>`, to: [to], subject, html };
    }

    // Appel API Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Erreur Resend:', result);
      return new Response(JSON.stringify({ error: result.message || 'Erreur Resend' }), {
        status: resendResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('Erreur send-email:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
