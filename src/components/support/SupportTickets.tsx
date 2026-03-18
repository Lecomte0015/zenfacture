import React, { useState, useEffect } from 'react';
import { PlusIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import supportService, { Ticket, StatutTicket, PrioriteTicket } from '../../services/supportService';
import organisationService from '../../services/organisationService';

const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicket, setNewTicket] = useState({
    titre: '',
    description: '',
    priorite: 'normale' as PrioriteTicket,
  });
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [organisations, setOrganisations] = useState<{id: string, nom: string}[]>([]);
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [filtrePriorite, setFiltrePriorite] = useState<string>('tous');

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

  // Charger les tickets de l'utilisateur
  useEffect(() => {
    const chargerTickets = async () => {
      if (!selectedOrg) return;
      
      try {
        setLoading(true);
        const ticketsData = await supportService.obtenirTicketsOrganisation(selectedOrg);
        setTickets(ticketsData);
        
        // Sélectionner le premier ticket si aucun n'est sélectionné
        if (ticketsData.length > 0 && !selectedTicket) {
          setSelectedTicket(ticketsData[0]);
        }
      } catch (err) {
        setError('Erreur lors du chargement des tickets');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    chargerTickets();
  }, [selectedOrg]);

  // Filtrer les tickets
  const ticketsFiltres = tickets.filter(ticket => {
    const correspondStatut = filtreStatut === 'tous' || ticket.statut === filtreStatut;
    const correspondPriorite = filtrePriorite === 'tous' || ticket.priorite === filtrePriorite;
    return correspondStatut && correspondPriorite;
  });

  // Créer un nouveau ticket
  const creerTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.titre.trim() || !newTicket.description.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      const ticketCree = await supportService.creerTicket({
        organisationId: selectedOrg,
        ...newTicket
      });
      
      setTickets([ticketCree, ...tickets]);
      setSelectedTicket(ticketCree);
      setNewTicket({ titre: '', description: '', priorite: 'normale' });
      setShowNewTicketForm(false);
      setSuccess('Ticket créé avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du ticket');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un commentaire à un ticket
  const ajouterCommentaire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentaire.trim() || !selectedTicket) return;

    try {
      setLoading(true);
      await supportService.ajouterCommentaire(
        selectedTicket.id,
        commentaire,
        selectedTicket.organisation_id
      );
      
      // Mettre à jour le statut du ticket
      await supportService.mettreAJourStatutTicket(
        selectedTicket.id,
        'en_cours',
        selectedTicket.organisation_id
      );
      
      // Recharger les tickets
      const ticketsData = await supportService.obtenirTicketsOrganisation(selectedOrg);
      setTickets(ticketsData);
      
      // Mettre à jour le ticket sélectionné
      const ticketMisAJour = ticketsData.find(t => t.id === selectedTicket.id);
      if (ticketMisAJour) {
        setSelectedTicket(ticketMisAJour);
      }
      
      setCommentaire('');
      setSuccess('Commentaire ajouté avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de l\'ajout du commentaire');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Changer le statut d'un ticket
  const changerStatutTicket = async (ticketId: string, nouveauStatut: StatutTicket) => {
    try {
      setLoading(true);
      await supportService.mettreAJourStatutTicket(
        ticketId,
        nouveauStatut,
        selectedOrg
      );
      
      // Mettre à jour la liste des tickets
      const ticketsMisAJour = tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, statut: nouveauStatut, mis_a_jour_le: new Date().toISOString() }
          : ticket
      );
      
      setTickets(ticketsMisAJour);
      
      // Mettre à jour le ticket sélectionné s'il est concerné
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({
          ...selectedTicket,
          statut: nouveauStatut,
          mis_a_jour_le: new Date().toISOString()
        });
      }
      
      setSuccess('Statut du ticket mis à jour');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Obtenir la couleur en fonction de la priorité
  const getCouleurPriorite = (priorite: PrioriteTicket) => {
    switch (priorite) {
      case 'basse':
        return 'bg-blue-100 text-blue-800';
      case 'normale':
        return 'bg-green-100 text-green-800';
      case 'elevee':
        return 'bg-yellow-100 text-yellow-800';
      case 'urgente':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtenir l'icône de statut
  const getIconeStatut = (statut: StatutTicket) => {
    switch (statut) {
      case 'ouvert':
        return <ClockIcon className="h-4 w-4 mr-1" />;
      case 'en_cours':
        return <ArrowRightCircleIcon className="h-4 w-4 mr-1 text-blue-500" />;
      case 'resolu':
        return <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />;
      default:
        return null;
    }
  };

  // Obtenir l'icône de priorité
  const getIconePriorite = (priorite: PrioriteTicket) => {
    switch (priorite) {
      case 'basse':
        return <span className="text-blue-500">↓</span>;
      case 'normale':
        return <span className="text-green-500">•</span>;
      case 'elevee':
        return <ExclamationCircleIcon className="h-4 w-4 text-yellow-500" />;
      case 'urgente':
        return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Formater la date
  const formaterDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (organisations.length === 0) {
    return (
      <div className="text-center py-12">
        <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune organisation disponible</h3>
        <p className="mt-1 text-sm text-gray-500">
          Vous devez être membre d'une organisation pour accéder au support.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Support client</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gérez vos demandes de support et suivez l'avancement de vos tickets
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

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Mes tickets de support
            </h3>
            <button
              onClick={() => setShowNewTicketForm(!showNewTicketForm)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              <PlusIcon className="-ml-1 mr-1 h-4 w-4" />
              Nouveau ticket
            </button>
          </div>
        </div>

        {showNewTicketForm && (
          <div className="p-4 border-b border-gray-200">
            <form onSubmit={creerTicket} className="space-y-4">
              <div>
                <label htmlFor="titre" className="block text-sm font-medium text-gray-700">
                  Sujet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="titre"
                  value={newTicket.titre}
                  onChange={(e) => setNewTicket({ ...newTicket, titre: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Décrivez brièvement votre problème"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description détaillée <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Décrivez votre problème en détail. Plus vous serez précis, plus nous pourrons vous aider rapidement."
                  required
                />
              </div>
              
              <div>
                <label htmlFor="priorite" className="block text-sm font-medium text-gray-700">
                  Priorité
                </label>
                <select
                  id="priorite"
                  value={newTicket.priorite}
                  onChange={(e) => setNewTicket({ ...newTicket, priorite: e.target.value as PrioriteTicket })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="elevee">Élevée</option>
                  <option value="urgente" disabled={true}>Urgente (réservée aux entreprises)</option>
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  {loading ? 'Création en cours...' : 'Créer le ticket'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewTicketForm(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setFiltreStatut('tous')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  filtreStatut === 'tous'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tous les tickets
              </button>
              <button
                onClick={() => setFiltreStatut('ouvert')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
                  filtreStatut === 'ouvert'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ClockIcon className="h-4 w-4 mr-1" />
                Ouverts
              </button>
              <button
                onClick={() => setFiltreStatut('en_cours')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
                  filtreStatut === 'en_cours'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ArrowRightCircleIcon className="h-4 w-4 mr-1" />
                En cours
              </button>
              <button
                onClick={() => setFiltreStatut('resolu')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center ${
                  filtreStatut === 'resolu'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Résolus
              </button>
            </nav>
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Liste des tickets */}
          <div className="w-full md:w-1/3 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-900">
                  {ticketsFiltres.length} ticket{ticketsFiltres.length !== 1 ? 's' : ''}
                </h4>
                <div className="relative
                ">
                  <select
                    value={filtrePriorite}
                    onChange={(e) => setFiltrePriorite(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 text-gray-700 py-1 px-3 pr-8 rounded-md leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="tous">Toutes les priorités</option>
                    <option value="basse">Basse</option>
                    <option value="normale">Normale</option>
                    <option value="elevee">Élevée</option>
                    <option value="urgente">Urgente</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {ticketsFiltres.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Aucun ticket trouvé
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {ticketsFiltres.map((ticket) => (
                    <li
                      key={ticket.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        selectedTicket?.id === ticket.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {ticket.titre}
                          </p>
                          <div className="flex mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCouleurPriorite(ticket.priorite)}`}>
                              {getIconePriorite(ticket.priorite)}
                              <span className="ml-1 capitalize">{ticket.priorite}</span>
                            </span>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="text-xs text-gray-500">
                            {formaterDate(ticket.cree_le).split(' ')[0]}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <span className="inline-flex items-center">
                          {getIconeStatut(ticket.statut)}
                          <span className="capitalize">{ticket.statut.replace('_', ' ')}</span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Détails du ticket sélectionné */}
          <div className="w-full md:w-2/3">
            {selectedTicket ? (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedTicket.titre}
                      </h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span>Créé le {formaterDate(selectedTicket.cree_le)}</span>
                        <span className="mx-2">•</span>
                        <span className="capitalize">{selectedTicket.statut.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {selectedTicket.statut !== 'resolu' && (
                        <button
                          onClick={() => changerStatutTicket(selectedTicket.id, 'resolu')}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          disabled={loading}
                        >
                          <CheckCircleIcon className="-ml-1 mr-1 h-4 w-4" />
                          Marquer comme résolu
                        </button>
                      )}
                      {selectedTicket.statut === 'resolu' && (
                        <button
                          onClick={() => changerStatutTicket(selectedTicket.id, 'ouvert')}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          disabled={loading}
                        >
                          <ClockIcon className="-ml-1 mr-1 h-4 w-4" />
                          Rouvrir le ticket
                        </button>
                      )}
                      {selectedTicket.statut !== 'en_cours' && selectedTicket.statut !== 'resolu' && (
                        <button
                          onClick={() => changerStatutTicket(selectedTicket.id, 'en_cours')}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          disabled={loading}
                        >
                          <ArrowRightCircleIcon className="-ml-1 mr-1 h-4 w-4" />
                          Prendre en charge
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {selectedTicket.email_utilisateur || 'Utilisateur inconnu'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {formaterDate(selectedTicket.cree_le)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCouleurPriorite(selectedTicket.priorite)}`}>
                        {getIconePriorite(selectedTicket.priorite)}
                        <span className="ml-1 capitalize">{selectedTicket.priorite}</span>
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-gray-700 whitespace-pre-line">
                      {selectedTicket.description}
                    </div>
                  </div>

                  {/* Commentaires */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Commentaires</h4>
                    <div className="space-y-4">
                      {/* Les commentaires seront affichés ici */}
                      <div className="text-sm text-gray-500 text-center py-4">
                        Aucun commentaire pour le moment.
                      </div>
                    </div>

                    {/* Formulaire d'ajout de commentaire */}
                    <form onSubmit={ajouterCommentaire} className="mt-6">
                      <div>
                        <label htmlFor="commentaire" className="block text-sm font-medium text-gray-700 mb-1">
                          Ajouter un commentaire
                        </label>
                        <textarea
                          id="commentaire"
                          rows={3}
                          value={commentaire}
                          onChange={(e) => setCommentaire(e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                          placeholder="Écrivez votre commentaire ici..."
                        />
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          disabled={loading || !commentaire.trim()}
                        >
                          Envoyer
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun ticket sélectionné</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Sélectionnez un ticket dans la liste ou créez-en un nouveau.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTickets;
