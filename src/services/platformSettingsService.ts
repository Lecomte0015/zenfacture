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
  /** Bannière d'annonce (site public + dashboard client) — voir migration
   * 20260710000400_announcement_banner.sql */
  banner_enabled: boolean;
  banner_text: string | null;
  banner_image_url: string | null;
  banner_link_url: string | null;
  banner_link_label: string | null;
  updated_at?: string;
  updated_by?: string | null;
}

/** Sous-ensemble public de la bannière — voir public.get_announcement_banner() */
export interface AnnouncementBanner {
  banner_enabled: boolean;
  banner_text: string | null;
  banner_image_url: string | null;
  banner_link_url: string | null;
  banner_link_label: string | null;
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
  banner_enabled: false,
  banner_text: null,
  banner_image_url: null,
  banner_link_url: null,
  banner_link_label: null,
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

/**
 * Upload l'image de fond de la bannière d'annonce dans le bucket public
 * `platform-banners` (écriture réservée aux admins par RLS storage — voir
 * migration 20260710000400_announcement_banner.sql) et retourne son URL
 * publique. N'écrit PAS `platform_settings.banner_image_url` elle-même :
 * appelez `updatePlatformSettings({ banner_image_url })` ensuite.
 */
export const uploadBannerImage = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop() || 'png';
  const path = `banner-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('platform-banners')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error("Erreur lors de l'upload de l'image de bannière :", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from('platform-banners').getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Récupère la bannière d'annonce publique via la fonction SECURITY DEFINER
 * `public.get_announcement_banner()` — accessible à tous (visiteurs non
 * connectés inclus), contrairement au reste de `platform_settings`.
 */
export const getAnnouncementBanner = async (): Promise<AnnouncementBanner | null> => {
  const { data, error } = await supabase.rpc('get_announcement_banner');

  if (error) {
    console.error('Erreur lors du chargement de la bannière :', error);
    return null;
  }

  // Les fonctions RETURNS TABLE renvoient un tableau (0 ou 1 ligne ici)
  const row = Array.isArray(data) ? data[0] : data;
  return (row as AnnouncementBanner) ?? null;
};
