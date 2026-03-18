import React, { useState } from 'react';
import {
  DollarSign,
  Mail,
  Database,
  Key,
  Save
} from 'lucide-react';

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    // Taux de change
    usd_to_chf: '0.92',
    eur_to_chf: '0.95',

    // Email
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: '',
    smtp_from: 'noreply@zenfacture.ch',

    // Système
    maintenance_mode: false,
    trial_days: '14',
    max_invoices_starter: '100',
    max_invoices_business: 'unlimited',

    // Features
    enable_ebill: true,
    enable_api: true,
    enable_fiduciaire: true,
  });

  const handleSave = () => {
    alert('Configuration sauvegardée (simulation)');
    // TODO: Sauvegarder dans la base de données
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuration système</h1>
        <p className="text-gray-600 mt-2">
          Paramètres globaux de la plateforme ZenFacture
        </p>
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
                  setSettings({ ...settings, usd_to_chf: e.target.value })
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
                  setSettings({ ...settings, eur_to_chf: e.target.value })
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
                value={settings.smtp_host}
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
                value={settings.smtp_port}
                onChange={(e) =>
                  setSettings({ ...settings, smtp_port: e.target.value })
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
                value={settings.smtp_from}
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
                  setSettings({ ...settings, trial_days: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max factures plan Starter
              </label>
              <input
                type="number"
                value={settings.max_invoices_starter}
                onChange={(e) =>
                  setSettings({ ...settings, max_invoices_starter: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
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
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-5 h-5 mr-2" />
          Enregistrer la configuration
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
