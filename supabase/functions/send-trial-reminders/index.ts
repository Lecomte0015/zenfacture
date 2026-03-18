import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Récupérer les utilisateurs en période d'essai
    const { data: users, error } = await supabaseClient
      .from('profils')
      .select('id, email, name, trial_end_date, trial_reminder_sent, trial_ended_notification_sent')
      .not('trial_end_date', 'is', null)
      .is('trial_ended_notification_sent', false);

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    const now = new Date();
    const results = [];

    for (const user of users) {
      const trialEndDate = new Date(user.trial_end_date);
      const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Ne pas envoyer de rappel si la période d'essai est déjà terminée
      if (daysRemaining < 0) {
        // Envoyer une notification de fin d'essai si pas déjà fait
        if (!user.trial_ended_notification_sent) {
          await sendTrialEndedEmail(supabaseClient, user);
          
          // Mettre à jour le statut de notification
          await supabaseClient
            .from('profils')
            .update({ trial_ended_notification_sent: true })
            .eq('id', user.id);
          
          results.push(`Sent trial ended email to ${user.email}`);
        }
        continue;
      }

      // Vérifier si un rappel doit être envoyé (2, 5, 10 jours avant la fin)
      const reminderDays = [2, 5, 10];
      const shouldSendReminder = reminderDays.includes(daysRemaining) && 
                               !user.trial_reminder_sent?.includes(daysRemaining);

      if (shouldSendReminder) {
        await sendTrialReminderEmail(supabaseClient, user, daysRemaining);
        
        // Mettre à jour les rappels envoyés
        const updatedReminders = [...(user.trial_reminder_sent || []), daysRemaining];
        await supabaseClient
          .from('profils')
          .update({ trial_reminder_sent: updatedReminders })
          .eq('id', user.id);
        
        results.push(`Sent ${daysRemaining}-day reminder to ${user.email}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Trial reminders processed',
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (err) {
    console.error('Error in send-trial-reminders function:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Fonction pour envoyer un e-mail de rappel d'essai
async function sendTrialReminderEmail(supabaseClient: any, user: any, daysRemaining: number) {
  const subject = daysRemaining === 1 
    ? 'Votre essai gratuit se termine demain !' 
    : `Il vous reste ${daysRemaining} jours d'essai gratuit`;
  
  const html = `
    <p>Bonjour ${user.name || 'cher utilisateur'},</p>
    
    <p>${daysRemaining === 1 
      ? 'Votre essai gratuit de Zenfacture se termine demain !' 
      : `Il vous reste ${daysRemaining} jours pour profiter de votre essai gratuit de Zenfacture.`}
    </p>
    
    <p>Passez à un abonnement payant pour continuer à profiter de toutes les fonctionnalités :</p>
    
    <p>
      <a href="${Deno.env.get('SITE_URL')}/pricing" 
         style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">
        Voir les abonnements
      </a>
    </p>
    
    <p>À bientôt,<br>L'équipe Zenfacture</p>
  `;

  const { data, error } = await supabaseClient.functions.invoke('send-email', {
    body: {
      to: user.email,
      subject,
      html,
    },
  });

  if (error) {
    console.error('Error sending trial reminder email:', error);
    throw error;
  }

  return data;
}

// Fonction pour envoyer un e-mail de fin d'essai
async function sendTrialEndedEmail(supabaseClient: any, user: any) {
  const subject = 'Votre essai gratuit est terminé';
  
  const html = `
    <p>Bonjour ${user.name || 'cher utilisateur'},</p>
    
    <p>Votre essai gratuit de Zenfacture est maintenant terminé.</p>
    
    <p>Pour continuer à utiliser nos services, veuillez souscrire à un abonnement :</p>
    
    <p>
      <a href="${Deno.env.get('SITE_URL')}/pricing" 
         style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">
        Choisir un abonnement
      </a>
    </p>
    
    <p>Si vous avez des questions, n'hésitez pas à répondre à cet e-mail.</p>
    
    <p>Cordialement,<br>L'équipe Zenfacture</p>
  `;

  const { data, error } = await supabaseClient.functions.invoke('send-email', {
    body: {
      to: user.email,
      subject,
      html,
    },
  });

  if (error) {
    console.error('Error sending trial ended email:', error);
    throw error;
  }

  return data;
}
