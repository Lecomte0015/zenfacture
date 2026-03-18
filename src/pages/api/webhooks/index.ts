import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialisation du client Supabase avec la clé de service (à stocker dans les variables d'environnement)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Type pour les événements de webhook
type WebhookEvent = 'user.created' | 'user.updated' | 'user.deleted' | 'subscription.created' | 'subscription.updated' | 'subscription.deleted';

// Type pour les données utilisateur
type UserData = {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
};

// Gestion des webhooks
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vérification de la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Vérification du token d'authentification (à implémenter)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { event, data } = req.body as { event: WebhookEvent; data: any };

  try {
    switch (event) {
      case 'user.created':
        await handleUserCreated(data as UserData);
        break;
      case 'user.updated':
        await handleUserUpdated(data as UserData);
        break;
      case 'user.deleted':
        await handleUserDeleted(data as { id: string });
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(data as { user_id: string; plan: string });
        break;
      default:
        console.log(`Événement non géré: ${event}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

// Gestion de la création d'un utilisateur
async function handleUserCreated(user: UserData) {
  // Création du profil utilisateur dans la table 'profils'
  const { error } = await supabaseAdmin
    .from('profils')
    .insert([
      {
        id: user.id,
        email: user.email,
        nom: user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        plan_abonnement: 'essentiel', // Plan par défaut
        date_creation: new Date().toISOString(),
        date_mise_a_jour: new Date().toISOString(),
      },
    ]);

  if (error) {
    console.error("Erreur lors de la création du profil utilisateur:", error);
    throw error;
  }

  console.log(`Profil créé pour l'utilisateur ${user.id}`);
}

// Gestion de la mise à jour d'un utilisateur
async function handleUserUpdated(user: UserData) {
  const { error } = await supabaseAdmin
    .from('profils')
    .update({
      email: user.email,
      nom: user.user_metadata?.name || '',
      avatar_url: user.user_metadata?.avatar_url || null,
      date_mise_a_jour: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error("Erreur lors de la mise à jour du profil utilisateur:", error);
    throw error;
  }

  console.log(`Profil mis à jour pour l'utilisateur ${user.id}`);
}

// Gestion de la suppression d'un utilisateur
async function handleUserDeleted(data: { id: string }) {
  // Note: En production, envisagez une suppression logique plutôt qu'une suppression physique
  const { error } = await supabaseAdmin
    .from('profils')
    .delete()
    .eq('id', data.id);

  if (error) {
    console.error("Erreur lors de la suppression du profil utilisateur:", error);
    throw error;
  }

  console.log(`Profil supprimé pour l'utilisateur ${data.id}`);
}

// Gestion de la mise à jour d'un abonnement
async function handleSubscriptionUpdated(data: { user_id: string; plan: string }) {
  const { error } = await supabaseAdmin
    .from('profils')
    .update({
      plan_abonnement: data.plan,
      date_mise_a_jour: new Date().toISOString(),
    })
    .eq('id', data.user_id);

  if (error) {
    console.error("Erreur lors de la mise à jour de l'abonnement:", error);
    throw error;
  }

  console.log(`Abonnement mis à jour pour l'utilisateur ${data.user_id} (${data.plan})`);
}
