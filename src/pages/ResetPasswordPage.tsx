import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Vérifier si on a un token dans l'URL (pour les liens de réinitialisation)
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    const verifyResetLink = async () => {
      if (type === 'recovery' && accessToken && refreshToken) {
        try {
          // En mode développement, on simule la réussite
          if (import.meta.env.DEV) {
            setIsValidLink(true);
            setMessage('Veuillez définir votre nouveau mot de passe.');
            return;
          }
          
          // En production, on vérifie le token avec Supabase
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) throw error;
          
          // Si on arrive ici, le lien est valide
          setIsValidLink(true);
          setMessage('Veuillez définir votre nouveau mot de passe.');
        } catch (err: any) {
          setError('Le lien de réinitialisation est invalide ou a expiré.');
          console.error('Erreur de vérification du lien:', err);
        }
      } else if (location.state?.fromForgotPassword) {
        // Si on vient de la page "Mot de passe oublié"
        setMessage('Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.');
      } else {
        setError('Lien de réinitialisation invalide.');
      }
    };

    verifyResetLink();
  }, [searchParams, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Les mots de passe ne correspondent pas');
    }
    
    if (password.length < 6) {
      return setError('Le mot de passe doit contenir au moins 6 caractères');
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      // En mode développement, on simule la mise à jour
      if (import.meta.env.DEV) {
        console.log('Simulation de la mise à jour du mot de passe');
        // Simulation d'un délai pour le chargement
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // En production, on utilise la méthode updateUser
        const { error } = await supabase.auth.updateUser({
          password: password,
        });
        
        if (error) throw error;
      }
      
      // Message de succès
      setMessage('Votre mot de passe a été réinitialisé avec succès. Redirection...');
      
      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.' 
          } 
        });
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe.');
      console.error('Erreur de réinitialisation du mot de passe:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Si le lien n'est pas valide, on affiche un message d'erreur
  if (!isValidLink && !location.state?.fromForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Lien de réinitialisation invalide
            </h2>
          </div>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              {error || 'Le lien de réinitialisation est invalide ou a expiré.'}
            </AlertDescription>
          </Alert>
          
          <div className="text-center">
            <Button asChild variant="link">
              <Link to="/forgot-password">Demander un nouveau lien</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            {message && message.includes('réinitialisé') ? 'Mot de passe mis à jour' : 'Définir un nouveau mot de passe'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {message || 'Entrez votre nouveau mot de passe ci-dessous'}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && message.includes('réinitialisé') ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Réinitialisation réussie</AlertTitle>
            <AlertDescription>
              Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers la page de connexion.
            </AlertDescription>
          </Alert>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Traitement en cours...' : 'Réinitialiser le mot de passe'}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Button asChild variant="link" className="text-sm">
            <Link to="/login">Retour à la connexion</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
