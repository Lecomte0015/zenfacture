import React, { useState, useEffect } from 'react';
import { KeyIcon, PlusIcon, TrashIcon, DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
import apiKeyService, { CleApi } from '../../services/apiKeyService';
import organisationService from '../../services/organisationService';

const ApiKeyManager: React.FC = () => {
  const [cles, setCles] = useState<CleApi[]>([]);
  const [nouvelleCle, setNouvelleCle] = useState({ nom: '' });
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [organisations, setOrganisations] = useState<{id: string, nom: string}[]>([]);

  // Charger les organisations de l'utilisateur
  useEffect(() => {
    const chargerOrganisations = async () => {
      try {
        const orgs = await organisationService.obtenirOrganisationsUtilisateur();
        setOrganisations(orgs);
        if (orgs.length > 0) {
          setSelectedOrg(orgs[0].id);
        }
      } catch (err) {
        setError('Erreur lors du chargement des organisations');
        console.error(err);
      }
    };

    chargerOrganisations();
  }, []);

  // Charger les clés API de l'organisation sélectionnée
  useEffect(() => {
    const chargerClesApi = async () => {
      if (!selectedOrg) return;
      
      try {
        setLoading(true);
        const clesData = await apiKeyService.obtenirClesApi(selectedOrg);
        setCles(clesData);
      } catch (err) {
        setError('Erreur lors du chargement des clés API');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    chargerClesApi();
  }, [selectedOrg]);

  // Générer une nouvelle clé API
  const genererNouvelleCle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouvelleCle.nom.trim()) {
      setError('Veuillez donner un nom à votre clé API');
      return;
    }

    try {
      setLoading(true);
      const nouvelleCleGeneree = await apiKeyService.genererCleApi(selectedOrg, nouvelleCle.nom);
      setCles([nouvelleCleGeneree, ...cles]);
      setNouvelleCle({ nom: '' });
      setShowNewKeyForm(false);
      setSuccess('Clé API générée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la génération de la clé API');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une clé API
  const supprimerCle = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette clé API ? Cette action est irréversible.')) {
      return;
    }

    try {
      setLoading(true);
      await apiKeyService.supprimerCleApi(id, selectedOrg);
      setCles(cles.filter(cle => cle.id !== id));
      setSuccess('Clé API supprimée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la suppression de la clé API');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Copier une clé dans le presse-papier
  const copierDansPressePapier = (texte: string, id: string) => {
    navigator.clipboard.writeText(texte);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Formater la date
  const formaterDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (organisations.length === 0) {
    return (
      <div className="text-center py-12">
        <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune organisation disponible</h3>
        <p className="mt-1 text-sm text-gray-500">
          Vous devez être membre d'une organisation pour gérer les clés API.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des clés API</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gérez les clés API pour accéder aux fonctionnalités de ZenFacture
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <label htmlFor="organisation" className="block text-sm font-medium text-gray-700 mb-1">
          Organisation
        </label>
        <select
          id="organisation"
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          {organisations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Clés API
            </h3>
            <button
              onClick={() => setShowNewKeyForm(!showNewKeyForm)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              <PlusIcon className="-ml-1 mr-1 h-4 w-4" />
              Nouvelle clé API
            </button>
          </div>
        </div>

        {showNewKeyForm && (
          <div className="p-4 border-b border-gray-200">
            <form onSubmit={genererNouvelleCle} className="space-y-3">
              <div>
                <label htmlFor="keyName" className="block text-sm font-medium text-gray-700">
                  Nom de la clé API
                </label>
                <input
                  type="text"
                  id="keyName"
                  value={nouvelleCle.nom}
                  onChange={(e) => setNouvelleCle({ ...nouvelleCle, nom: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ex: Application mobile"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Donnez un nom descriptif pour identifier cette clé API
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  Générer une clé API
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewKeyForm(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="px-4 py-5 sm:p-6">
          {cles.length === 0 ? (
            <div className="text-center py-8">
              <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune clé API</h3>
              <p className="mt-1 text-sm text-gray-500">
                Commencez par générer une nouvelle clé API pour votre application.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Gardez vos clés API secrètes. Ne les partagez jamais en public ou dans des dépôts de code.
                    </p>
                  </div>
                </div>
              </div>

              {cles.map((cle) => (
                <div key={cle.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{cle.nom}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Créée le {formaterDate(cle.cree_le)}
                        {cle.derniere_utilisation && ` • Dernière utilisation : ${formaterDate(cle.derniere_utilisation)}`}
                      </p>
                    </div>
                    <button
                      onClick={() => supprimerCle(cle.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Supprimer"
                      disabled={loading}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="mt-3 flex rounded-md shadow-sm">
                    <div className="relative flex items-stretch flex-grow focus-within:z-10">
                      <input
                        type="password"
                        value={cle.cle}
                        readOnly
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-l-md pl-3 pr-10 sm:text-sm border-gray-300 bg-gray-100 font-mono text-sm py-2"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => copierDansPressePapier(cle.cle, cle.id)}
                      className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      title="Copier dans le presse-papier"
                    >
                      {copied === cle.id ? (
                        <>
                          <CheckIcon className="h-4 w-4 text-green-500" />
                          <span>Copié !</span>
                        </>
                      ) : (
                        <>
                          <DocumentDuplicateIcon className="h-4 w-4" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Comment utiliser l'API
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Documentation de l'API et exemples d'utilisation
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">En-tête d'authentification</h4>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
            <pre className="text-sm">
              <code>
                <span className="text-blue-300">Authorization</span>: Bearer <span className="text-green-300">VOTRE_CLE_API</span>
              </code>
            </pre>
          </div>

          <h4 className="text-sm font-medium text-gray-900 mt-6 mb-3">Exemple avec cURL</h4>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
            <pre className="text-sm">
              <code>
                <span className="text-green-400"># Créer une facture</span>
                <br />
                <span className="text-blue-300">curl</span> -X POST <span className="text-yellow-300">https://api.zenfacture.com/v1/invoices</span> \
                <br />
                &nbsp;&nbsp;-H <span className="text-green-400">"Content-Type: application/json"</span> \
                <br />
                &nbsp;&nbsp;-H <span className="text-green-400">"Authorization: Bearer VOTRE_CLE_API"</span> \
                <br />
                &nbsp;&nbsp;-d <span className="text-green-400">{'{"client_id": "123", "montant": 100, "devise": "EUR"}'}</span>
                <br /><br />
                <span className="text-green-400"># Récupérer les factures</span>
                <br />
                <span className="text-blue-300">curl</span> <span className="text-yellow-300">https://api.zenfacture.com/v1/invoices</span> \
                <br />
                &nbsp;&nbsp;-H <span className="text-green-400">"Authorization: Bearer VOTRE_CLE_API"</span>
              </code>
            </pre>
          </div>

          <h4 className="text-sm font-medium text-gray-900 mt-6 mb-3">Points de terminaison disponibles</h4>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Méthode
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      GET
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    /v1/invoices
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Récupérer la liste des factures
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      GET
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    /v1/invoices/{'{id}'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Récupérer une facture par son ID
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      POST
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    /v1/invoices
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Créer une nouvelle facture
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      PUT
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    /v1/invoices/{'{id}'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Mettre à jour une facture existante
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      DELETE
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    /v1/invoices/{'{id}'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Supprimer une facture
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;
