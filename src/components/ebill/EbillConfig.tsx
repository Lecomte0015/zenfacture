import React, { useState, useEffect } from 'react';
import { Settings, Zap, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { EbillConfig as EbillConfigType } from '../../services/ebillService';

interface EbillConfigProps {
  config: EbillConfigType | null;
  loading: boolean;
  onSaveConfig: (participantId: string) => Promise<void>;
  onActivate: () => Promise<void>;
  onDeactivate: () => Promise<void>;
}

const EbillConfig: React.FC<EbillConfigProps> = ({
  config,
  loading,
  onSaveConfig,
  onActivate,
  onDeactivate,
}) => {
  const [participantId, setParticipantId] = useState('');
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (config) {
      setParticipantId(config.participant_id || '');
    }
  }, [config]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!participantId.trim()) {
      return;
    }

    try {
      setSaving(true);
      await onSaveConfig(participantId);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      setToggling(true);
      if (config?.actif) {
        await onDeactivate();
      } else {
        await onActivate();
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    } finally {
      setToggling(false);
    }
  };

  const getStatusBadge = () => {
    if (!config) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          <AlertCircle className="w-4 h-4 mr-1" />
          Non configuré
        </span>
      );
    }

    switch (config.statut) {
      case 'actif':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Actif
          </span>
        );
      case 'en_cours':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            En cours
          </span>
        );
      case 'inactif':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="w-4 h-4 mr-1" />
            Inactif
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statut */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Configuration eBill</h3>
              <p className="text-sm text-gray-500">Gérez votre intégration avec le réseau SIX</p>
            </div>
          </div>
          <div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Informations eBill */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Settings className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                Qu'est-ce qu'eBill ?
              </h4>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  eBill est le service de facturation électronique du groupe SIX, largement utilisé en Suisse.
                  Il permet d'envoyer vos factures directement dans l'e-banking de vos clients.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Réception instantanée par le client</li>
                  <li>Paiement simplifié en un clic</li>
                  <li>Réduction des délais de paiement</li>
                  <li>Respect de l'environnement (zéro papier)</li>
                </ul>
                <p className="mt-3 font-medium">
                  Pour utiliser eBill, vous devez disposer d'un ID Participant fourni par le groupe SIX.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire de configuration */}
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div>
            <label htmlFor="participantId" className="block text-sm font-medium text-gray-700 mb-2">
              ID Participant SIX
            </label>
            <input
              type="text"
              id="participantId"
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              placeholder="Ex: 41010560425610001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Votre identifiant unique du réseau eBill SIX (17 chiffres)
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving || !participantId.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Settings className="w-4 h-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
            </button>

            {config && participantId && (
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={toggling}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  config.actif
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                }`}
              >
                <Zap className="w-4 h-4 mr-2" />
                {toggling
                  ? 'Changement en cours...'
                  : config.actif
                  ? 'Désactiver eBill'
                  : 'Activer eBill'
                }
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Informations complémentaires */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Comment obtenir un ID Participant ?
        </h4>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            1. Contactez votre banque ou le groupe SIX directement
          </p>
          <p>
            2. Remplissez le formulaire d'inscription eBill
          </p>
          <p>
            3. Après validation, vous recevrez votre ID Participant
          </p>
          <p className="mt-4">
            <a
              href="https://www.ebill.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              En savoir plus sur eBill →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EbillConfig;
