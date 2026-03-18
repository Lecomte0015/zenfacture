import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertCircle, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email) {
      return setError('Veuillez entrer votre adresse email');
    }

    setIsLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
      
      setMessage('📩 Un lien de réinitialisation a été envoyé à votre adresse email.');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'envoi de l\'email de réinitialisation.');
      console.error('Erreur de réinitialisation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Mot de passe oublié ?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Entrez votre adresse email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message ? (
          <Alert className="mb-6">
            <Mail className="h-5 w-5" />
            <AlertTitle className="font-medium">Email envoyé</AlertTitle>
            <AlertDescription className="mt-2">
              {message}
              <div className="mt-3 text-sm text-gray-600">
                <p>Si vous ne voyez pas l'email, vérifiez votre dossier de courrier indésirable.</p>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  disabled={isLoading}
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
              </Button>
              
              <div className="text-center text-sm">
                <Link 
                  to="/login" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Retour à la connexion
                </Link>
              </div>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Button asChild variant="link" className="text-sm">
            <a href="/login">Retour à la connexion</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
