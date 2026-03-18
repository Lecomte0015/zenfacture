import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Check } from 'lucide-react';
import { Permission, DEFAULT_ROLE_PERMISSIONS, PERMISSION_LABELS, PERMISSION_DESCRIPTIONS } from '@/types/permissions';
import { useTeamMembers } from '@/hooks/useTeamMembers';

type Role = 'admin' | 'editor' | 'viewer' | 'custom';

const TeamInvitePage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('editor');
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showCustomPermissions, setShowCustomPermissions] = useState(false);

  // Mettre à jour les permissions personnalisées quand le rôle change
  useEffect(() => {
    if (role !== 'custom') {
      setCustomPermissions([...DEFAULT_ROLE_PERMISSIONS[role as keyof typeof DEFAULT_ROLE_PERMISSIONS] || []]);
    }
  }, [role]);

  const togglePermission = (permission: Permission) => {
    setCustomPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const { addTeamMember } = useTeamMembers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Veuillez entrer une adresse email');
      return;
    }

    // Vérifier les permissions si le rôle est personnalisé
    if (role === 'custom' && customPermissions.length === 0) {
      setError('Veuillez sélectionner au moins une permission');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      // Déterminer les permissions en fonction du rôle
      const permissions = role === 'custom' 
        ? customPermissions 
        : [...DEFAULT_ROLE_PERMISSIONS[role as keyof typeof DEFAULT_ROLE_PERMISSIONS]];
      
      const memberName = name || email.split('@')[0];
      const memberRole = role === 'custom' ? 'custom' : role;

      const result = await addTeamMember(email, memberName, memberRole, permissions);
      
      if (result.success) {
        // Réinitialiser le formulaire après un court délai
        setSuccess(true);
        setTimeout(() => {
          setEmail('');
          setName('');
          setRole('editor');
          setCustomPermissions([]);
          setSuccess(false);
          // Rediriger vers la liste des membres
          window.location.href = '/dashboard/team';
        }, 1500);
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
      
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi de l\'invitation:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'envoi de l\'invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Retour à l'équipe
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Inviter un membre d'équipe</h1>
          <p className="mt-1 text-sm text-gray-500">
            Invitez de nouveaux membres à rejoindre votre équipe et à collaborer sur vos factures.
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Détails de l'invitation</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
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
              <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">Invitation envoyée avec succès !</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse email *
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="email@exemple.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nom complet (optionnel)
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Jean Dupont"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Rôle
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => {
                    const newRole = e.target.value as Role;
                    setRole(newRole);
                    setShowCustomPermissions(newRole === 'custom');
                  }}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="admin">Administrateur</option>
                  <option value="editor">Éditeur</option>
                  <option value="viewer">Lecteur</option>
                  <option value="custom">Personnalisé</option>
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  {role === 'admin' && 'Accès complet à toutes les fonctionnalités, y compris la gestion des paramètres et de l\'équipe.'}
                  {role === 'editor' && 'Peut créer et modifier des factures et des clients, mais ne peut pas gérer les paramètres ou l\'équipe.'}
                  {role === 'viewer' && 'Peut uniquement consulter les factures et les clients, sans possibilité de modification.'}
                  {role === 'custom' && 'Définissez des permissions personnalisées ci-dessous.'}
                </p>
              </div>

              {(role === 'custom' || showCustomPermissions) && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Permissions personnalisées</h4>
                  <div className="space-y-3">
                    {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                      const permission = key as Permission;
                      const isChecked = customPermissions.includes(permission);
                      return (
                        <div key={permission} className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id={`permission-${permission}`}
                              name={`permission-${permission}`}
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(permission)}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor={`permission-${permission}`} className="font-medium text-gray-700">
                              {label}
                            </label>
                            <p className="text-gray-500">{PERMISSION_DESCRIPTIONS[permission]}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  <Send className={`mr-2 h-4 w-4 ${isSubmitting ? 'animate-pulse' : ''}`} />
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer l\'invitation'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeamInvitePage;
