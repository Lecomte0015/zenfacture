import { useState } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

interface MfaChallengeProps {
  /** ID du facteur TOTP vérifié à défier (renvoyé par supabase.auth.mfa.listFactors()) */
  factorId: string | null;
  /** Appelé une fois le code à 6 chiffres validé — débloque l'accès au tableau de bord */
  onVerified: () => void;
}

/**
 * Écran plein écran affiché après un login réussi par mot de passe (AAL1)
 * lorsque le compte a activé la double authentification (AAL2 requis).
 * Sans cet écran, activer la 2FA dans Mon Profil ne protégerait en réalité
 * rien : Supabase ouvre toujours une session dès le mot de passe validé,
 * c'est à l'application de bloquer l'accès tant que le second facteur n'est
 * pas vérifié (voir ProtectedRoute dans App.tsx).
 */
const MfaChallenge = ({ factorId, onVerified }: MfaChallengeProps) => {
  const { logout } = useAuth();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || code.trim().length < 6 || verifying) return;
    setVerifying(true);
    setError('');
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.trim(),
      });
      if (verifyError) throw verifyError;
      onVerified();
    } catch (err: any) {
      setError(err.message || 'Code invalide. Réessayez.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 mb-4">
          <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center">Vérification en deux étapes</h2>
        <p className="mt-2 text-sm text-gray-500 text-center">
          Entrez le code à 6 chiffres généré par votre application d'authentification.
        </p>

        {!factorId ? (
          <div className="mt-6 text-center">
            <p className="text-sm text-red-600">
              Aucun facteur de double authentification vérifié n'a été trouvé sur ce compte.
            </p>
            <button
              onClick={() => logout()}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Se déconnecter
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <button
              type="submit"
              disabled={verifying || code.trim().length < 6}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
            >
              {verifying ? 'Vérification…' : 'Vérifier'}
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Se déconnecter
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default MfaChallenge;
