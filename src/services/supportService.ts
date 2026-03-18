import { supabase } from '../lib/supabaseClient';

type StatutTicket = 'ouvert' | 'en_cours' | 'resolu';
type PrioriteTicket = 'basse' | 'normale' | 'elevee' | 'urgente';

export interface Ticket {
  id: string;
  utilisateur_id: string;
  organisation_id: string;
  titre: string;
  description: string;
  statut: StatutTicket;
  priorite: PrioriteTicket;
  cree_le: string;
  mis_a_jour_le: string;
  // Champs supplémentaires pour l'affichage
  email_utilisateur?: string;
  nom_organisation?: string;
}

export const supportService = {
  // Créer un nouveau ticket
  async creerTicket(ticket: {
    organisationId: string;
    titre: string;
    description: string;
    priorite: PrioriteTicket;
  }): Promise<Ticket> {
    const { data: plan } = await supabase
      .from('profils')
      .select('plan_abonnement')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();

    // Vérifier les restrictions de priorité selon le plan
    if (
      (plan.plan_abonnement === 'essentiel' && ticket.priorite !== 'normale') ||
      (plan.plan_abonnement === 'pro' && ticket.priorite === 'urgente')
    ) {
      throw new Error('Cette priorité n\'est pas disponible avec votre abonnement actuel');
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          utilisateur_id: (await supabase.auth.getUser()).data.user?.id,
          organisation_id: ticket.organisationId,
          titre: ticket.titre,
          description: ticket.description,
          statut: 'ouvert',
          priorite: ticket.priorite,
        },
      ])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  // Obtenir les tickets d'un utilisateur
  async obtenirTicketsUtilisateur(): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        utilisateur:profils(email),
        organisation:organisations(nom)
      `)
      .eq('utilisateur_id', (await supabase.auth.getUser()).data.user?.id)
      .order('cree_le', { ascending: false });

    if (error) throw error;

    return (data || []).map((ticket: any) => ({
      ...ticket,
      email_utilisateur: ticket.utilisateur?.email,
      nom_organisation: ticket.organisation?.nom,
    }));
  },

  // Obtenir les tickets d'une organisation (pour les administrateurs)
  async obtenirTicketsOrganisation(organisationId: string): Promise<Ticket[]> {
    // Vérifier les droits d'administration
    const { data: checkAdmin, error: adminError } = await supabase
      .from('utilisateurs_organisations')
      .select('role')
      .eq('organisation_id', organisationId)
      .eq('utilisateur_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (adminError || !checkAdmin || !['admin', 'membre'].includes(checkAdmin.role)) {
      throw new Error('Action non autorisée : droits insuffisants');
    }

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        utilisateur:profils(email),
        organisation:organisations(nom)
      `)
      .eq('organisation_id', organisationId)
      .order('cree_le', { ascending: false });

    if (error) throw error;

    return (data || []).map((ticket: any) => ({
      ...ticket,
      email_utilisateur: ticket.utilisateur?.email,
      nom_organisation: ticket.organisation?.nom,
    }));
  },

  // Mettre à jour le statut d'un ticket
  async mettreAJourStatutTicket(
    ticketId: string,
    statut: StatutTicket,
    organisationId: string
  ): Promise<void> {
    // Vérifier les droits (propriétaire du ticket ou admin de l'organisation)
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('utilisateur_id, organisation_id')
      .eq('id', ticketId)
      .single();

    if (ticketError) throw ticketError;

    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (ticket.utilisateur_id !== userId) {
      // Vérifier si l'utilisateur est admin de l'organisation
      const { data: checkAdmin, error: adminError } = await supabase
        .from('utilisateurs_organisations')
        .select('role')
        .eq('organisation_id', organisationId)
        .eq('utilisateur_id', userId)
        .single();

      if (adminError || !checkAdmin || checkAdmin.role !== 'admin') {
        throw new Error('Action non autorisée : droits insuffisants');
      }
    }

    const { error } = await supabase
      .from('tickets')
      .update({ 
        statut,
        mis_a_jour_le: new Date().toISOString() 
      })
      .eq('id', ticketId);

    if (error) throw error;
  },

  // Ajouter un commentaire à un ticket
  async ajouterCommentaire(
    ticketId: string,
    contenu: string,
    organisationId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('commentaires_tickets')
      .insert([
        {
          ticket_id: ticketId,
          utilisateur_id: (await supabase.auth.getUser()).data.user?.id,
          contenu,
          organisation_id: organisationId,
        },
      ]);

    if (error) throw error;

    // Mettre à jour la date de mise à jour du ticket
    await this.mettreAJourStatutTicket(ticketId, 'en_cours', organisationId);
  },

  // Obtenir les commentaires d'un ticket
  async obtenirCommentaires(ticketId: string): Promise<Array<{
    id: string;
    contenu: string;
    cree_le: string;
    utilisateur: {
      id: string;
      email: string;
    };
  }>> {
    const { data, error } = await supabase
      .from('commentaires_tickets')
      .select(`
        id,
        contenu,
        cree_le,
        utilisateur:profils(id, email)
      `)
      .eq('ticket_id', ticketId)
      .order('cree_le', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Obtenir les statistiques des tickets
  async obtenirStatistiques(organisationId: string): Promise<{
    total: number;
    ouverts: number;
    en_cours: number;
    resolus: number;
  }> {
    const { count: total, error: totalError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('organisation_id', organisationId);

    const { count: ouverts, error: ouvertsError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('organisation_id', organisationId)
      .eq('statut', 'ouvert');

    const { count: enCours, error: enCoursError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('organisation_id', organisationId)
      .eq('statut', 'en_cours');

    const { count: resolus, error: resolusError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('organisation_id', organisationId)
      .eq('statut', 'resolu');

    if (totalError || ouvertsError || enCoursError || resolusError) {
      throw totalError || ouvertsError || enCoursError || resolusError;
    }

    return {
      total: total || 0,
      ouverts: ouverts || 0,
      en_cours: enCours || 0,
      resolus: resolus || 0,
    };
  },
};

export default supportService;
