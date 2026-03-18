import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, UserPlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import organisationService, { RoleUtilisateur } from '../../services/organisationService';

interface MembreOrganisation extends Omit<organisationService.MembreOrganisation, 'role'> {
  role: string;
  email: string;
  isEditing?: boolean;
  newRole?: RoleUtilisateur;
}

const OrganisationManager: React.FC = () => {
  const [organisations, setOrganisations] = useState<organisationService.Organisation[]>([]);
  const [membres, setMembres] = useState<MembreOrganisation[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [invitationEmail, setInvitationEmail] = useState('');
  const [invitationRole, setInvitationRole] = useState<RoleUtilisateur>('membre');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [showNewOrgForm, setShowNewOrgForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const navigate = useNavigate();

  // Charger les organisations de l'utilisateur
  useEffect(() => {
    const chargerOrganisations = async () => {
      try {
        setLoading(true);
        const orgs = await organisationService.obtenirOrganisationsUtilisateur();
        setOrganisations(orgs);
        if (orgs.length > 0 && !selectedOrg) {
          setSelectedOrg(orgs[0].id);
        }
      } catch (err) {
        setError('Erreur lors du chargement des organisations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    chargerOrganisations();
  }, []);

  // Charger les membres d'une organisation
  useEffect(() => {
    const chargerMembres = async () => {
      if (!selectedOrg) return;

      try {
        setLoading(true);
        const membresData = await organisationService.obtenirMembres(selectedOrg);
        setMembres(membresData.map(m => ({
          ...m,
          isEditing: false,
          newRole: m.role
        })));
      } catch (err) {
        setError('Erreur lors du chargement des membres');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    chargerMembres();
  }, [selectedOrg]);

  // Créer une nouvelle organisation
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) {
      setError('Le nom de l\'organisation est requis');
      return;
    }

    try {
      setLoading(true);
      const nouvelleOrg = await organisationService.creerOrganisation(newOrgName);
      setOrganisations([...organisations, nouvelleOrg]);
      setSelectedOrg(nouvelleOrg.id);
      setNewOrgName('');
      setShowNewOrgForm(false);
      setSuccess('Organisation créée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la création de l\'organisation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Inviter un membre
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationEmail.trim()) {
      setError('L\'email est requis');
      return;
    }

    try {
      setLoading(true);
      await organisationService.inviterUtilisateur(selectedOrg, invitationEmail, invitationRole);
      setInvitationEmail('');
      setShowInviteForm(false);
      setSuccess('Invitation envoyée avec succès');
      setTimeout(() => setSuccess(''), 3000);
      
      // Recharger la liste des membres
      const membresData = await organisationService.obtenirMembres(selectedOrg);
      setMembres(membresData.map(m => ({
        ...m,
        isEditing: false,
        newRole: m.role
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi de l\'invitation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour le rôle d'un membre
  const handleUpdateRole = async (membreId: string, newRole: RoleUtilisateur) => {
    try {
      setLoading(true);
      await organisationService.mettreAJourRoleMembre(selectedOrg, membreId, newRole);
      
      // Mettre à jour l'interface utilisateur
      setMembres(membres.map(m => 
        m.id === membreId 
          ? { ...m, role: newRole, isEditing: false } 
          : m
      ));
      
      setSuccess('Rôle mis à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la mise à jour du rôle');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un membre
  const handleRemoveMember = async (membreId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      return;
    }

    try {
      setLoading(true);
      await organisationService.supprimerMembre(selectedOrg, membreId);
      
      // Mettre à jour l'interface utilisateur
      setMembres(membres.filter(m => m.id !== membreId));
      
      setSuccess('Membre supprimé avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du membre');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Basculer en mode édition pour un membre
  const toggleEditMode = (membreId: string) => {
    setMembres(membres.map(m => 
      m.id === membreId 
        ? { ...m, isEditing: !m.isEditing, newRole: m.role as RoleUtilisateur }
        : m
    ));
  };

  // Annuler l'édition
  const cancelEdit = (membreId: string) => {
    setMembres(membres.map(m => 
      m.id === membreId 
        ? { ...m, isEditing: false }
        : m
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des organisations</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gérez vos organisations et les membres de votre équipe
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste des organisations */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Mes organisations
                </h3>
                <button
                  onClick={() => setShowNewOrgForm(!showNewOrgForm)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="-ml-1 mr-1 h-4 w-4" />
                  Nouvelle
                </button>
              </div>
            </div>

            {showNewOrgForm && (
              <div className="p-4 border-b border-gray-200">
                <form onSubmit={handleCreateOrg} className="space-y-3">
                  <div>
                    <label htmlFor="orgName" className="block text-sm font-medium text-gray-700">
                      Nom de l'organisation
                    </label>
                    <input
                      type="text"
                      id="orgName"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Nom de l'organisation"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      Créer
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewOrgForm(false)}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="divide-y divide-gray-200">
              {organisations.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Aucune organisation trouvée. Créez votre première organisation pour commencer.
                </div>
              ) : (
                organisations.map((org) => (
                  <div
                    key={org.id}
                    className={`px-4 py-4 hover:bg-gray-50 cursor-pointer ${selectedOrg === org.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedOrg(org.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{org.nom}</h4>
                        <p className="text-xs text-gray-500">
                          Créé le {new Date(org.cree_le).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedOrg === org.id && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Sélectionné
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Détails de l'organisation sélectionnée */}
        <div className="lg:col-span-2">
          {selectedOrg ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {organisations.find(o => o.id === selectedOrg)?.nom || 'Organisation'}
                  </h3>
                  <button
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <UserPlusIcon className="-ml-1 mr-1 h-4 w-4" />
                    Inviter un membre
                  </button>
                </div>
              </div>

              {showInviteForm && (
                <div className="p-4 border-b border-gray-200">
                  <form onSubmit={handleInviteMember} className="space-y-3">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email du membre à inviter
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="email"
                          id="email"
                          value={invitationEmail}
                          onChange={(e) => setInvitationEmail(e.target.value)}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="email@exemple.com"
                        />
                        <select
                          value={invitationRole}
                          onChange={(e) => setInvitationRole(e.target.value as RoleUtilisateur)}
                          className="-ml-px relative inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-md hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="admin">Administrateur</option>
                          <option value="membre">Membre</option>
                          <option value="lecteur">Lecteur</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={loading}
                      >
                        Envoyer l'invitation
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInviteForm(false)}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="px-4 py-5 sm:p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Membres de l'équipe</h4>
                
                {membres.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Aucun membre dans cette organisation. Utilisez le bouton ci-dessus pour inviter des membres.
                  </div>
                ) : (
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Membre
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rôle
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date d'ajout
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {membres.map((membre) => (
                          <tr key={membre.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {membre.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {membre.isEditing ? (
                                <select
                                  value={membre.newRole}
                                  onChange={(e) => 
                                    setMembres(membres.map(m => 
                                      m.id === membre.id 
                                        ? { ...m, newRole: e.target.value as RoleUtilisateur } 
                                        : m
                                    ))
                                  }
                                  className="border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="admin">Administrateur</option>
                                  <option value="membre">Membre</option>
                                  <option value="lecteur">Lecteur</option>
                                </select>
                              ) : (
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  membre.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : membre.role === 'membre'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {membre.role === 'admin' 
                                    ? 'Administrateur' 
                                    : membre.role === 'membre' 
                                      ? 'Membre' 
                                      : 'Lecteur'}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(membre.cree_le).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {membre.isEditing ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleUpdateRole(membre.id, membre.newRole!)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Valider"
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => cancelEdit(membre.id)}
                                    className="text-gray-600 hover:text-gray-900"
                                    title="Annuler"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => toggleEditMode(membre.id)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Modifier le rôle"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveMember(membre.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Supprimer"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
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
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune organisation sélectionnée</h3>
              <p className="mt-1 text-sm text-gray-500">
                Sélectionnez une organisation dans la liste ou créez-en une nouvelle pour commencer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganisationManager;
