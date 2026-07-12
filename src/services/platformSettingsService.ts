import { supabase } from '@/lib/supabaseClient';
import { compressImage } from '@/utils/imageCompression';

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
  /** Hero de la page d'accueil (site public) — voir migration
   * 20260712000000_hero_settings.sql */
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_cta_label: string | null;
  hero_cta_url: string | null;
  hero_secondary_cta_label: string | null;
  hero_secondary_cta_url: string | null;
  hero_bg_color: string | null;
  hero_text_color: string | null;
  hero_button_bg_color: string | null;
  hero_button_text_color: string | null;
  hero_image_url: string | null;
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

/** Sous-ensemble public du hero — voir public.get_homepage_hero() */
export interface HomepageHero {
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_cta_label: string | null;
  hero_cta_url: string | null;
  hero_secondary_cta_label: string | null;
  hero_secondary_cta_url: string | null;
  hero_bg_color: string | null;
  hero_text_color: string | null;
  hero_button_bg_color: string | null;
  hero_button_text_color: string | null;
  hero_image_url: string | null;
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
  hero_title: null,
  hero_subtitle: null,
  hero_cta_label: null,
  hero_cta_url: null,
  hero_secondary_cta_label: null,
  hero_secondary_cta_url: null,
  hero_bg_color: null,
  hero_text_color: null,
  hero_button_bg_color: null,
  hero_button_text_color: null,
  hero_image_url: null,
};

/** Valeurs affichées sur HomePage.tsx tant que l'admin n'a rien personnalisé
 * (aucune ligne en base, ou colonnes hero_* encore NULL) — reprennent le
 * contenu qui était en dur dans HomePage.tsx avant cette fonctionnalité. */
export const DEFAULT_HERO: HomepageHero = {
  hero_title: 'La facturation suisse,\nenfin simple.',
  hero_subtitle: "Créez des factures professionnelles avec QR-bill conforme, envoyez-les par email et encaissez vos paiements — depuis une interface pensée pour les PME et indépendants suisses.",
  hero_cta_label: 'Commencer gratuitement — 30 jours',
  hero_cta_url: '/auth/register',
  hero_secondary_cta_label: 'Voir les tarifs',
  hero_secondary_cta_url: '/tarifs',
  hero_bg_color: '#0c0a09',
  hero_text_color: '#ffffff',
  hero_button_bg_color: '#ea580c',
  hero_button_text_color: '#ffffff',
  hero_image_url: null,
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
  // Compression côté navigateur avant upload : une bannière n'a besoin ni de
  // très haute résolution ni d'un poids de plusieurs Mo pour un simple bandeau.
  const optimized = await compressImage(file, { maxWidth: 1600, maxHeight: 500 });
  const ext = optimized.name.split('.').pop() || 'jpg';
  const path = `banner-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('platform-banners')
    .upload(path, optimized, { upsert: true, contentType: optimized.type });

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

/**
 * Upload l'image de fond du hero de la page d'accueil dans le bucket public
 * `platform-hero` (écriture réservée aux admins par RLS storage — voir
 * migration 20260712000000_hero_settings.sql) et retourne son URL publique.
 * N'écrit PAS `platform_settings.hero_image_url` elle-même : appelez
 * `updatePlatformSettings({ hero_image_url })` ensuite.
 */
export const uploadHeroImage = async (file: File): Promise<string> => {
  // Compression côté navigateur avant upload : sans cette étape, une photo
  // envoyée telle quelle depuis un téléphone (souvent 3-8 Mo) est ensuite
  // servie telle quelle sur la page d'accueil à chaque visite — c'est la
  // cause la plus fréquente d'un hero qui met du temps à s'afficher.
  const optimized = await compressImage(file, { maxWidth: 1920, maxHeight: 1080 });
  const ext = optimized.name.split('.').pop() || 'jpg';
  const path = `hero-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('platform-hero')
    .upload(path, optimized, { upsert: true, contentType: optimized.type });

  if (uploadError) {
    console.error("Erreur lors de l'upload de l'image du hero :", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from('platform-hero').getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Récupère le hero de la page d'accueil via la fonction SECURITY DEFINER
 * `public.get_homepage_hero()` — accessible à tous (visiteurs non connectés
 * inclus), contrairement au reste de `platform_settings`. Retourne
 * `DEFAULT_HERO` (contenu d'origine de HomePage.tsx) tant que l'admin n'a
 * rien personnalisé, pour ne jamais afficher une page vide.
 */
export const getHomepageHero = async (): Promise<HomepageHero> => {
  const { data, error } = await supabase.rpc('get_homepage_hero');

  if (error) {
    console.error('Erreur lors du chargement du hero :', error);
    return DEFAULT_HERO;
  }

  const row = (Array.isArray(data) ? data[0] : data) as HomepageHero | undefined;
  if (!row) return DEFAULT_HERO;

  // Complète chaque champ individuellement avec la valeur par défaut : la
  // ligne peut exister (autres réglages déjà sauvegardés) sans que l'admin
  // ait encore rempli les champs hero_*.
  return {
    hero_title: row.hero_title ?? DEFAULT_HERO.hero_title,
    hero_subtitle: row.hero_subtitle ?? DEFAULT_HERO.hero_subtitle,
    hero_cta_label: row.hero_cta_label ?? DEFAULT_HERO.hero_cta_label,
    hero_cta_url: row.hero_cta_url ?? DEFAULT_HERO.hero_cta_url,
    hero_secondary_cta_label: row.hero_secondary_cta_label ?? DEFAULT_HERO.hero_secondary_cta_label,
    hero_secondary_cta_url: row.hero_secondary_cta_url ?? DEFAULT_HERO.hero_secondary_cta_url,
    hero_bg_color: row.hero_bg_color ?? DEFAULT_HERO.hero_bg_color,
    hero_text_color: row.hero_text_color ?? DEFAULT_HERO.hero_text_color,
    hero_button_bg_color: row.hero_button_bg_color ?? DEFAULT_HERO.hero_button_bg_color,
    hero_button_text_color: row.hero_button_text_color ?? DEFAULT_HERO.hero_button_text_color,
    hero_image_url: row.hero_image_url ?? DEFAULT_HERO.hero_image_url,
  };
};
