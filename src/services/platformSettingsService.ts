import { supabase } from '@/lib/supabaseClient';

/**
 * Configuration globale de la plateforme, persistée dans la table singleton
 * `platform_settings` (voir migration 20260710000300_admin_settings_and_audit_log.sql).
 *
 * `max_invoices_business` utilise 0 comme valeur sentinelle pour "illimité"
 * (cohérent avec PLANS.pro/entreprise -> invoices.limit = Infinity dans
 * useTrial.ts, qu'on ne peut pas stocker tel quel dans une colonne INTEGER).
 */
export interface PlatformSettings {
  usd_to_chf: number;
  eur_to_chf: number;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_from: string | null;
  maintenance_mode: boolean;
  trial_days: number;
  max_invoices_starter: number;
  max_invoices_business: number;
  enable_ebill: boolean;
  enable_api: boolean;
  enable_fiduciaire: boolean;
  updated_at?: string;
  updated_by?: string | null;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  usd_to_chf: 0.9,
  eur_to_chf: 0.95,
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_user: '',
  smtp_from: 'noreply@zenfacture.ch',
  maintenance_mode: false,
  trial_days: 14,
  max_invoices_starter: 20,
  max_invoices_business: 0,
  enable_ebill: false,
  enable_api: false,
  enable_fiduciaire: false,
};

/**
 * Récupère la configuration plateforme (ligne singleton id=true).
 * Si la ligne n'existe pas encore (migration pas encore appliquée sur cet
 * environnement), retourne les valeurs par défaut sans planter la page.
 */
export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .eq('id', true)
    .maybeSingle();

  if (error) {
    console.error('Erreur lors du chargement de la configuration plateforme :', error);
    throw error;
  }

  if (!data) {
    return DEFAULT_SETTINGS;
  }

  return data as unknown as PlatformSettings;
};

/**
 * Met à jour la configuration plateforme (ligne singleton id=true).
 * Restreint aux admins/super_admins par la policy RLS
 * `platform_settings_update_admin` (public.is_admin()).
 */
export const updatePlatformSettings = async (
  updates: Partial<PlatformSettings>
): Promise<PlatformSettings> => {
  const { data, error } = await supabase
    .from('platform_settings')
    .update(updates)
    .eq('id', true)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la sauvegarde de la configuration plateforme :', error);
    throw error;
  }

  return data as unknown as PlatformSettings;
};
