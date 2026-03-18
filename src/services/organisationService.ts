import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

type RoleUtilisateur = 'admin' | 'membre' | 'lecteur';

export interface Organisation {
  id: string;
  nom: string;
  proprietaire_id: string;
  cree_le: string;
  mis_a_jour_le: string;
}

export interface MembreOrganisation {
  id: string;
  organisation_id: string;
  utilisateur_id: string;
  role: RoleUtilisateur;
  email?: string; // Optionnel : pour l'affichage de l'email de l'utilisateur
  cree_le: string;
}

export const organisationService = {
  // Créer une nouvelle organisation
  async creerOrganisation(nom: string): Promise<Organisation> {
    const { data, error } = await supabase
      .rpc('creer_organisation', { nom_organisation: nom });
    
    if (error) throw error;
    return data;
  },

  // Obtenir les organisations d'un utilisateur
  async obtenirOrganisationsUtilisateur(): Promise<Organisation[]> {
    const { data, error } = await supabase
      .from('organisations')
      .select('*')
      .eq('proprietaire_id', (await supabase.auth.getUser()).data.user?.id);
    
    if (error) throw error;
    return data || [];
  },

  // Inviter un utilisateur dans une organisation
  async inviterUtilisateur(
    organisationId: string, 
    email: string, 
    role: RoleUtilisateur = 'membre'
  ): Promise<void> {
    // Vérifier si l'utilisateur a les droits d'administration
    const { data: checkAdmin, error: adminError } = await supabase
      .from('utilisateurs_organisations')
      .select('role')
      .eq('organisation_id', organisationId)
      .eq('utilisateur_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (adminError || !checkAdmin || checkAdmin.role !== 'admin') {
      throw new Error('Action non autorisée : droits insuffisants');
    }

    // Envoyer l'invitation par email (à implémenter avec votre service d'email)
    const { error } = await supabase.functions.invoke('envoyer-invitation', {
      body: { email, organisationId, role }
    });

    if (error) throw error;
  },

  // Obtenir les membres d'une organisation
  async obtenirMembres(organisationId: string): Promise<MembreOrganisation[]> {
    const { data, error } = await supabase
      .from('utilisateurs_organisations')
      .select(`
        *,
        utilisateur:profils(email)
      `)
      .eq('organisation_id', organisationId);
    
    if (error) throw error;
    
    // Formater les données pour inclure l'email de l'utilisateur
    return data.map(membre => ({
      ...membre,
      email: (membre as any).utilisateur?.email
    }));
  },

  // Mettre à jour le rôle d'un membre
  async mettreAJourRoleMembre(
    organisationId: string, 
    utilisateurId: string, 
    role: RoleUtilisateur
  ): Promise<void> {
    // Vérifier si l'utilisateur a les droits d'administration
    const { data: checkAdmin, error: adminError } = await supabase
      .from('utilisateurs_organisations')
      .select('role')
      .eq('organisation_id', organisationId)
      .eq('utilisateur_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (adminError || !checkAdmin || checkAdmin.role !== 'admin') {
      throw new Error('Action non autorisée : droits insuffisants');
    }

    // Mettre à jour le rôle
    const { error } = await supabase
      .from('utilisateurs_organisations')
      .update({ role })
      .eq('organisation_id', organisationId)
      .eq('utilisateur_id', utilisateurId);

    if (error) throw error;
  },

  // Supprimer un membre d'une organisation
  async supprimerMembre(organisationId: string, utilisateurId: string): Promise<void> {
    // Vérifier si l'utilisateur a les droits d'administration
    const { data: checkAdmin, error: adminError } = await supabase
      .from('utilisateurs_organisations')
      .select('role')
      .eq('organisation_id', organisationId)
      .eq('utilisateur_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (adminError || !checkAdmin || checkAdmin.role !== 'admin') {
      throw new Error('Action non autorisée : droits insuffisants');
    }

    // Ne pas permettre de se supprimer soi-même
    if (utilisateurId === (await supabase.auth.getUser()).data.user?.id) {
      throw new Error('Vous ne pouvez pas vous retirer vous-même. Transférez d\'abord la propriété.');
    }

    // Supprimer le membre
    const { error } = await supabase
      .from('utilisateurs_organisations')
      .delete()
      .eq('organisation_id', organisationId)
      .eq('utilisateur_id', utilisateurId);

    if (error) throw error;
  },

  // Vérifier si l'utilisateur a un rôle spécifique dans une organisation
  async verifierRole(
    organisationId: string, 
    roles: RoleUtilisateur[]
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('utilisateurs_organisations')
      .select('role')
      .eq('organisation_id', organisationId)
      .eq('utilisateur_id', (await supabase.auth.getUser()).data.user?.id)
      .in('role', roles)
      .single();

    if (error || !data) return false;
    return true;
  },

  // Obtenir le rôle de l'utilisateur dans une organisation
  async obtenirRoleUtilisateur(organisationId: string): Promise<RoleUtilisateur | null> {
    const { data, error } = await supabase
      .from('utilisateurs_organisations')
      .select('role')
      .eq('organisation_id', organisationId)
      .eq('utilisateur_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (error || !data) return null;
    return data.role;
  }
};

export default organisationService;
