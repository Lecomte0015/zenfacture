import React, { useState } from 'react';
import { UserCheck, Mail, Copy, Trash2, Key, Shield, CheckCircle, XCircle } from 'lucide-react';
import { AccesFiduciaire } from '../../services/fiduciaireService';

interface FiduciaireAccessProps {
  accesses: AccesFiduciaire[];
  onCreateAccess: (email: string, nom: string, permissions: AccesFiduciaire['permissions']) => Promise<void>;
  onRevokeAccess: (accessId: string) => Promise<void>;
  loading: boolean;
}

const FiduciaireAccess: React.FC<FiduciaireAccessProps> = ({
  accesses,
  onCreateAccess,
  onRevokeAccess,
  loading
}) => {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [permissions, setPermissions] = useState({
    factures: true,
    depenses: true,
    comptabilite: true,
    tva: true
  });
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !nom) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateAccess(email, nom, permissions);

      // Réinitialiser le formulaire
      setEmail('');
      setNom('');
      setPermissions({
        factures: true,
        depenses: true,
        comptabilite: true,
        tva: true
      });
      setShowForm(false);
    } catch (error) {
      console.error('Erreur lors de la création de l\'accès:', error);
      alert('Erreur lors de la création de l\'accès');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyToken = (token: string) => {
    const portalUrl = `${window.location.origin}/fiduciaire/${token}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevoke = async (accessId: string, nom: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir révoquer l'accès de ${nom} ?`)) {
      try {
        await onRevokeAccess(accessId);
      } catch (error) {
        console.error('Erreur lors de la révocation:', error);
        alert('Erreur lors de la révocation de l\'accès');
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleDateString('fr-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Accès Fiduciaire</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gérez les accès de vos fiduciaires à vos données comptables
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          Inviter un fiduciaire
        </button>
      </div>

      {/* Formulaire d'invitation */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nouvel accès fiduciaire</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email du fiduciaire *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="fiduciaire@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du fiduciaire *
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Cabinet Dupont SA"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Permissions
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'factures', label: 'Factures' },
                  { key: 'depenses', label: 'Dépenses' },
                  { key: 'comptabilite', label: 'Comptabilité' },
                  { key: 'tva', label: 'TVA' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions[key as keyof typeof permissions]}
                      onChange={(e) => setPermissions(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Création...' : 'Créer l\'accès'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des accès */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Chargement des accès...
          </div>
        ) : accesses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Aucun accès fiduciaire créé</p>
            <p className="text-sm mt-1">Invitez un fiduciaire pour commencer</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fiduciaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accesses.map((access) => (
                  <tr key={access.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{access.nom_fiduciaire}</div>
                        <div className="text-sm text-gray-500">{access.email_fiduciaire}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(access.permissions)
                          ? access.permissions
                          : Object.entries(access.permissions).filter(([_, v]) => v).map(([k]) => k)
                        ).map(perm => (
                          <span
                            key={perm}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {perm.charAt(0).toUpperCase() + perm.slice(1)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(access.derniere_connexion)}
                    </td>
                    <td className="px-6 py-4">
                      {access.actif ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Révoqué
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {access.actif && (
                        <>
                          <button
                            onClick={() => handleCopyToken(access.token_acces)}
                            className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Copier le lien du portail"
                          >
                            {copiedToken === access.token_acces ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Copié
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-1" />
                                Copier lien
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRevoke(access.id, access.nom_fiduciaire)}
                            className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Révoquer l'accès"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Révoquer
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FiduciaireAccess;
