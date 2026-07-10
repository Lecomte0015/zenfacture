/**
 * Service d'envoi d'emails transactionnels / marketing via l'Edge Function
 * `send-email` (Resend). Voir supabase/functions/send-email/index.ts pour les
 * templates et le détail des types supportés.
 *
 * Ce service est volontairement "fire and forget" côté appelant pour les
 * emails non-critiques (bienvenue, marketing) : un échec d'envoi ne doit
 * jamais bloquer un flux produit (ex: inscription).
 */
import { supabase } from '@/lib/supabaseClient';

interface SendEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Email de bienvenue, envoyé juste après une inscription réussie.
 * Ne lève jamais d'exception : un échec est loggé mais n'impacte pas
 * l'inscription elle-même (le compte est déjà créé à ce stade).
 */
export const sendWelcomeEmail = async (to: string, recipientName?: string): Promise<SendEmailResult> => {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { type: 'welcome', to, recipientName },
    });
    if (error) {
      console.error('[transactionalEmailService] Échec envoi email de bienvenue:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('[transactionalEmailService] Erreur envoi email de bienvenue:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
  }
};

export interface MarketingEmailParams {
  to: string;
  recipientName?: string;
  subject: string;
  heading: string;
  /** Corps du message. Le texte brut est accepté (les retours à la ligne sont convertis en <br>). */
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

/**
 * Email marketing / annonce ponctuelle, déclenché manuellement par un admin
 * depuis AdminUsersPage (envoi ciblé ou en diffusion).
 */
export const sendMarketingEmail = async (params: MarketingEmailParams): Promise<SendEmailResult> => {
  try {
    const { to, recipientName, subject, heading, bodyHtml, ctaLabel, ctaUrl } = params;
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'marketing',
        to,
        recipientName,
        subject,
        heading,
        bodyHtml: bodyHtml.replace(/\n/g, '<br>'),
        ctaLabel,
        ctaUrl,
      },
    });
    if (error) {
      console.error('[transactionalEmailService] Échec envoi email marketing:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('[transactionalEmailService] Erreur envoi email marketing:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
  }
};
