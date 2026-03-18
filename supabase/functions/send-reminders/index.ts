import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Créer un client Supabase avec la clé de service
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Récupérer tous les rappels à envoyer aujourd'hui
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Formater les dates pour la requête
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const todayStr = formatDate(today);
    const tomorrowStr = formatDate(tomorrow);

    // Récupérer les rappels échéants aujourd'hui ou demain
    const { data: reminders, error: remindersError } = await supabaseAdminClient
      .from('reminders')
      .select('*, user:users(email, full_name)')
      .lte('due_date', tomorrowStr)
      .gte('due_date', todayStr)
      .eq('notification_sent', false);

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError);
      throw remindersError;
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No reminders to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Envoyer les emails de rappel
    for (const reminder of reminders) {
      try {
        const { error: emailError } = await supabaseAdminClient.functions.invoke('send-email', {
          body: {
            to: reminder.user.email,
            subject: `Rappel: ${reminder.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>${reminder.title}</h2>
                <p>Bonjour ${reminder.user.full_name || ''},</p>
                <p>Ceci est un rappel pour :</p>
                <p><strong>${reminder.title}</strong></p>
                <p>${reminder.description || ''}</p>
                <p><strong>Date d'échéance :</strong> ${new Date(reminder.due_date).toLocaleDateString('fr-FR')}</p>
                <p>Connectez-vous à votre compte pour plus de détails.</p>
                <p>Cordialement,<br>L'équipe ZenFacture</p>
              </div>
            `,
          },
        });

        if (emailError) {
          console.error(`Error sending email for reminder ${reminder.id}:`, emailError);
          continue;
        }

        // Marquer le rappel comme notifié
        const { error: updateError } = await supabaseAdminClient
          .from('reminders')
          .update({ notification_sent: true })
          .eq('id', reminder.id);

        if (updateError) {
          console.error(`Error updating reminder ${reminder.id}:`, updateError);
        }
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Reminders processed successfully',
        count: reminders.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in send-reminders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
