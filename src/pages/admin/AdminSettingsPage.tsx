import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Mail,
  Database,
  Key,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  getPlatformSettings,
  updatePlatformSettings,
  PlatformSettings
} from '@/services/platformSettingsService';
import { logAdminAction } from '@/services/adminAuditService';

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'success' | 'error'>('idle');
  const [unlimitedBusiness, setUnlimitedBusiness] = useState(true);

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
