import React, { useEffect, useRef, useState } from 'react';
import {
  DollarSign,
  Mail,
  Database,
  Key,
  Save,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  X,
  Upload
} from 'lucide-react';
import {
  getPlatformSettings,
  updatePlatformSettings,
  uploadBannerImage,
  uploadHeroImage,
  DEFAULT_HERO,
  PlatformSettings
} from '@/services/platformSettingsService';
import { logAdminAction } from '@/services/adminAuditService';

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'success' | 'error'>('idle');
  const [unlimitedBusiness, setUnlimitedBusiness] = useState(true);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getPlatformSettings();
      setSettings(data);
      setUnlimitedBusiness(data.max_invoices_business === 0);
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration :', error);
      setSaveState('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setSaveState('idle');
    try {
      const payload: Partial<PlatformSettings> = {
        ...settings,
        max_invoices_business: unlimitedBusiness ? 0 : settings.max_invoices_business,
      };
      const updated = await updatePlatformSettings(payload);
      setSettings(updated);
      await logAdminAction('update_settings', 'platform_settings', null, payload as Record<string, unknown>);
      setSaveState('success');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration :', error);
      setSaveState('error');
    } finally {
      setSaving(false);
    }
  };

  const handleBannerImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    setUploadingBanner(true);
    try {
      const url = await uploadBannerImage(file);
      setSettings({ ...settings, banner_image_url: url });
    } catch (error) {
      console.error("Erreur lors de l'upload de l'image de bannière :", error);
      setSaveState('error');
    } finally {
      setUploadingBanner(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    }
  };

  const handleHeroImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    setUploadingHero(true);
    try {
      const url = await uploadHeroImage(file);
      setSettings({ ...settings, hero_image_url: url });
    } catch (error) {
      console.error("Erreur lors de l'upload de l'image du hero :", error);
      setSaveState('error');
    } finally {
      setUploadingHero(false);
      if (heroFileInputRef.current) heroFileInputRef.current.value = '';
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuration système</h1>
          <p className="text-gray-600 mt-2">
            Paramètres globaux de la plateforme ZenFacture
          </p>
        </div>
        {saveState === 'success' && (
          <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-lg">
            <CheckCircle className="w-5 h-5 mr-2" />
            Configuration enregistrée
          </div>
        )}
        {saveState === 'error' && (
          <div className="flex items-center text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            <AlertCircle className="w-5 h-5 mr-2" />
            Erreur lors de l'enregistrement
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taux de change */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Taux de change</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                USD vers CHF
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.usd_to_chf}
                onChange={(e) =>
                  setSettings({ ...settings, usd_to_chf: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                EUR vers CHF
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.eur_to_chf}
                onChange={(e) =>
                  setSettings({ ...settings, eur_to_chf: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Email SMTP */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Mail className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Configuration Email</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serveur SMTP
              </label>
              <input
                type="text"
                value={settings.smtp_host || ''}
                onChange={(e) =>
                  setSettings({ ...settings, smtp_host: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port SMTP
              </label>
              <input
                type="number"
                value={settings.smtp_port ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, smtp_port: parseInt(e.target.value, 10) || null })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email expéditeur
              </label>
              <input
                type="email"
                value={settings.smtp_from || ''}
                onChange={(e) =>
                  setSettings({ ...settings, smtp_from: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Limites Système */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Database className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Limites système</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée essai gratuit (jours)
              </label>
              <input
                type="number"
                value={settings.trial_days}
                onChange={(e) =>
                  setSettings({ ...settings, trial_days: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max factures plan Essentiel
              </label>
              <input
                type="number"
                value={settings.max_invoices_starter}
                onChange={(e) =>
                  setSettings({ ...settings, max_invoices_starter: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max factures plans Pro / Entreprise
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  disabled={unlimitedBusiness}
                  value={unlimitedBusiness ? '' : settings.max_invoices_business}
                  placeholder={unlimitedBusiness ? 'Illimité' : ''}
                  onChange={(e) =>
                    setSettings({ ...settings, max_invoices_business: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                />
                <label className="flex items-center whitespace-nowrap text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={unlimitedBusiness}
                    onChange={(e) => setUnlimitedBusiness(e.target.checked)}
                    className="w-4 h-4 mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Illimité
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <label className="text-sm font-medium text-gray-700">
                Mode maintenance
              </label>
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) =>
                  setSettings({ ...settings, maintenance_mode: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Key className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Features actives</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Module eBill</p>
                <p className="text-xs text-gray-500">Envoi de factures via eBill</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enable_ebill}
                onChange={(e) =>
                  setSettings({ ...settings, enable_ebill: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">API Access</p>
                <p className="text-xs text-gray-500">Accès API pour intégrations</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enable_api}
                onChange={(e) =>
                  setSettings({ ...settings, enable_api: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Portail fiduciaire</p>
                <p className="text-xs text-gray-500">Accès pour les fiduciaires</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enable_fiduciaire}
                onChange={(e) =>
                  setSettings({ ...settings, enable_fiduciaire: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bannière d'annonce */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <ImageIcon className="w-5 h-5 text-pink-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Bannière d'annonce</h3>
            </div>
            <label className="flex items-center text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={settings.banner_enabled}
                onChange={(e) => setSettings({ ...settings, banner_enabled: e.target.checked })}
                className="w-5 h-5 mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              Activée
            </label>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Affichée en haut du site public et du dashboard client (offre spéciale, maintenance prévue...).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texte de la bannière
                </label>
                <textarea
                  rows={3}
                  value={settings.banner_text || ''}
                  onChange={(e) => setSettings({ ...settings, banner_text: e.target.value })}
                  placeholder="Ex : Offre de lancement : -20% sur le plan annuel jusqu'au 31 juillet !"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lien (optionnel)
                  </label>
                  <input
                    type="text"
                    value={settings.banner_link_url || ''}
                    onChange={(e) => setSettings({ ...settings, banner_link_url: e.target.value })}
                    placeholder="/tarifs"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Libellé du lien
                  </label>
                  <input
                    type="text"
                    value={settings.banner_link_label || ''}
                    onChange={(e) => setSettings({ ...settings, banner_link_label: e.target.value })}
                    placeholder="En profiter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image de fond (optionnelle)
              </label>
              {settings.banner_image_url ? (
                <div className="relative">
                  <img
                    src={settings.banner_image_url}
                    alt="Aperçu bannière"
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, banner_image_url: null })}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-1 shadow"
                    aria-label="Retirer l'image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => bannerFileInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                >
                  {uploadingBanner ? (
                    <span className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></span>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mb-2" />
                      <span className="text-sm">Choisir une image</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={bannerFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleBannerImageChange}
                className="hidden"
              />
              {settings.banner_image_url && (
                <button
                  type="button"
                  onClick={() => bannerFileInputRef.current?.click()}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Changer l'image
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hero de la page d'accueil */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center mb-4">
            <ImageIcon className="w-5 h-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Bannière hero (page d'accueil)</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Grand visuel en haut de la page d'accueil publique. Laissez un champ vide pour garder le
            texte par défaut (affiché en placeholder ci-dessous).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
                <textarea
                  rows={2}
                  value={settings.hero_title || ''}
                  onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                  placeholder={DEFAULT_HERO.hero_title || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre</label>
                <textarea
                  rows={3}
                  value={settings.hero_subtitle || ''}
                  onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                  placeholder={DEFAULT_HERO.hero_subtitle || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bouton principal</label>
                  <input
                    type="text"
                    value={settings.hero_cta_label || ''}
                    onChange={(e) => setSettings({ ...settings, hero_cta_label: e.target.value })}
                    placeholder={DEFAULT_HERO.hero_cta_label || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lien du bouton</label>
                  <input
                    type="text"
                    value={settings.hero_cta_url || ''}
                    onChange={(e) => setSettings({ ...settings, hero_cta_url: e.target.value })}
                    placeholder={DEFAULT_HERO.hero_cta_url || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bouton secondaire</label>
                  <input
                    type="text"
                    value={settings.hero_secondary_cta_label || ''}
                    onChange={(e) => setSettings({ ...settings, hero_secondary_cta_label: e.target.value })}
                    placeholder={DEFAULT_HERO.hero_secondary_cta_label || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lien du bouton</label>
                  <input
                    type="text"
                    value={settings.hero_secondary_cta_url || ''}
                    onChange={(e) => setSettings({ ...settings, hero_secondary_cta_url: e.target.value })}
                    placeholder={DEFAULT_HERO.hero_secondary_cta_url || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Couleur de fond</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.hero_bg_color || DEFAULT_HERO.hero_bg_color || '#0c0a09'}
                      onChange={(e) => setSettings({ ...settings, hero_bg_color: e.target.value })}
                      className="h-10 w-12 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">
                      {settings.hero_bg_color || DEFAULT_HERO.hero_bg_color}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">Visible uniquement sans image de fond.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Couleur du texte</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.hero_text_color || DEFAULT_HERO.hero_text_color || '#ffffff'}
                      onChange={(e) => setSettings({ ...settings, hero_text_color: e.target.value })}
                      className="h-10 w-12 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">
                      {settings.hero_text_color || DEFAULT_HERO.hero_text_color}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Couleur du bouton</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.hero_button_bg_color || DEFAULT_HERO.hero_button_bg_color || '#ea580c'}
                      onChange={(e) => setSettings({ ...settings, hero_button_bg_color: e.target.value })}
                      className="h-10 w-12 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">
                      {settings.hero_button_bg_color || DEFAULT_HERO.hero_button_bg_color}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Couleur du texte du bouton</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.hero_button_text_color || DEFAULT_HERO.hero_button_text_color || '#ffffff'}
                      onChange={(e) => setSettings({ ...settings, hero_button_text_color: e.target.value })}
                      className="h-10 w-12 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">
                      {settings.hero_button_text_color || DEFAULT_HERO.hero_button_text_color}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image de fond (optionnelle)
              </label>
              {settings.hero_image_url ? (
                <div className="relative">
                  <img
                    src={settings.hero_image_url}
                    alt="Aperçu hero"
                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, hero_image_url: null })}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-1 shadow"
                    aria-label="Retirer l'image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => heroFileInputRef.current?.click()}
                  disabled={uploadingHero}
                  className="w-full h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                >
                  {uploadingHero ? (
                    <span className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></span>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mb-2" />
                      <span className="text-sm">Choisir une image</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={heroFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleHeroImageChange}
                className="hidden"
              />
              {settings.hero_image_url && (
                <button
                  type="button"
                  onClick={() => heroFileInputRef.current?.click()}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Changer l'image
                </button>
              )}
              <p className="mt-2 text-[11px] text-gray-400">
                Sans image, la couleur de fond ci-contre est utilisée à la place.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
