import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Shield, AlertCircle, Loader } from 'lucide-react';
import { AccesFiduciaire, getAccessByToken, updateLastConnection } from '../../services/fiduciaireService';
import FiduciaireDashboard from './FiduciaireDashboard';

const FiduciairePortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [access, setAccess] = useState<AccesFiduciaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Token invalide');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const accessData = await getAccessByToken(token);

        if (!accessData) {
          setError('Accès non trouvé ou révoqué');
          setLoading(false);
          return;
        }

        setAccess(accessData);

        // Mettre à jour la dernière connexion
        await updateLastConnection(accessData.id);
      } catch (err) {
        console.error('Erreur lors de la validation du token:', err);
        setError('Erreur lors de la validation de l\'accès');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vérification de l'accès...</p>
        </div>
      </div>
    );
  }

  if (error || !access) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
            <p className="text-gray-600 mb-6">
              {error || 'Le lien d\'accès est invalide ou a expiré.'}
            </p>
            <p className="text-sm text-gray-500">
              Veuillez contacter l'organisation qui vous a fourni ce lien pour obtenir un nouvel accès.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">ZenFacture</h1>
                <p className="text-sm text-gray-600">Portail Fiduciaire</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{access.nom_fiduciaire}</p>
              <p className="text-xs text-gray-500">Accès en lecture seule</p>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <main>
        <FiduciaireDashboard
          organisationId={access.organisation_id}
          permissions={access.permissions}
          accessInfo={access}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-center text-sm text-gray-500">
            Propulsé par <span className="font-medium">ZenFacture</span> - Portail Fiduciaire
          </p>
        </div>
      </footer>
    </div>
  );
};

export default FiduciairePortal;
