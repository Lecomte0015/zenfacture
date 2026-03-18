import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Calcule la prochaine date d'émission selon la fréquence.
 */
function calculerProchaineEmission(dateBase: Date, frequence: string): string {
  const date = new Date(dateBase);
  switch (frequence) {
    case 'hebdomadaire':
      date.setDate(date.getDate() + 7);
      break;
    case 'mensuel':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'trimestriel':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'semestriel':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'annuel':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString().split('T')[0];
}

/**
 * Génère un numéro de facture au format REC-YYYYMMDD-XXXX.
 */
function genererNumeroFacture(today: Date): string {
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const xxxx = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `REC-${yyyy}${mm}${dd}-${xxxx}`;
}

serve(async (req) => {
  // Gestion CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Calculer la date d'échéance : aujourd'hui + 30 jours
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // Récupérer toutes les récurrences actives dont la prochaine émission est due
    const { data: recurrences, error: recurrencesError } = await supabaseAdmin
      .from('factures_recurrentes')
      .select('*')
      .eq('actif', true)
      .lte('prochaine_emission', todayStr)
      .or(`date_fin.is.null,date_fin.gte.${todayStr}`);

    if (recurrencesError) {
      console.error('Erreur lors de la récupération des récurrences:', recurrencesError);
      throw recurrencesError;
    }

    if (!recurrences || recurrences.length === 0) {
      return new Response(
        JSON.stringify({ success: true, generated: 0, errors: [], message: 'Aucune récurrence à traiter.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let generated = 0;
    const errors: string[] = [];

    for (const rec of recurrences) {
      try {
        // 1. Récupérer les infos du client si disponible
        let clientNom = 'Client';
        let clientEmail: string | null = null;
        let clientEntreprise: string | null = null;
        let clientAdresse: string | null = null;
        let clientVille: string | null = null;
        let clientCodePostal: string | null = null;
        let clientPays: string | null = null;
        let clientTelephone: string | null = null;
        let clientTva: string | null = null;

        if (rec.client_id) {
          const { data: client, error: clientError } = await supabaseAdmin
            .from('clients')
            .select('*')
            .eq('id', rec.client_id)
            .single();

          if (clientError) {
            console.warn(`Client introuvable pour récurrence ${rec.id}:`, clientError.message);
          } else if (client) {
            clientNom = client.nom || client.prenom
              ? [client.prenom, client.nom].filter(Boolean).join(' ')
              : (client.entreprise || 'Client');
            clientEmail = client.email || null;
            clientEntreprise = client.entreprise || null;
            clientAdresse = client.adresse || null;
            clientVille = client.ville || null;
            clientCodePostal = client.code_postal || null;
            clientPays = client.pays || null;
            clientTelephone = client.telephone || null;
            clientTva = client.numero_tva || null;
          }
        }

        // 2. Récupérer le user_id depuis l'organisation
        const { data: org, error: orgError } = await supabaseAdmin
          .from('organisations')
          .select('id, nom, user_id')
          .eq('id', rec.organisation_id)
          .single();

        if (orgError || !org) {
          const msg = `Organisation introuvable pour récurrence ${rec.id}: ${orgError?.message || 'inconnue'}`;
          console.error(msg);
          errors.push(msg);
          continue;
        }

        const userId = org.user_id;
        const nomOrganisation = org.nom || 'Organisation';

        // 3. Générer le numéro de facture
        const invoiceNumber = genererNumeroFacture(today);

        // 4. Insérer la nouvelle facture
        const { error: insertError } = await supabaseAdmin
          .from('invoices')
          .insert([{
            user_id: userId,
            invoice_number: invoiceNumber,
            client_name: clientNom,
            client_company: clientEntreprise,
            client_address: clientAdresse,
            client_city: clientVille,
            client_postal_code: clientCodePostal,
            client_country: clientPays,
            client_email: clientEmail,
            client_phone: clientTelephone,
            client_vat: clientTva,
            company_name: nomOrganisation,
            company_address: '',
            company_city: '',
            company_postal_code: '',
            company_country: 'CH',
            company_vat: null,
            company_email: null,
            company_phone: null,
            date: todayStr,
            due_date: dueDateStr,
            status: 'draft',
            items: rec.articles || [],
            subtotal: rec.sous_total || 0,
            tax_amount: rec.total_tva || 0,
            total: rec.total || 0,
            notes: rec.notes || null,
          }]);

        if (insertError) {
          const msg = `Erreur insertion facture pour récurrence ${rec.id}: ${insertError.message}`;
          console.error(msg);
          errors.push(msg);
          continue;
        }

        // 5. Mettre à jour la récurrence : derniere_emission et prochaine_emission
        const prochaineEmission = calculerProchaineEmission(today, rec.frequence);

        const { error: updateError } = await supabaseAdmin
          .from('factures_recurrentes')
          .update({
            derniere_emission: todayStr,
            prochaine_emission: prochaineEmission,
            mis_a_jour_le: new Date().toISOString(),
          })
          .eq('id', rec.id);

        if (updateError) {
          const msg = `Erreur mise à jour récurrence ${rec.id}: ${updateError.message}`;
          console.error(msg);
          errors.push(msg);
          continue;
        }

        generated++;
        console.log(`Facture ${invoiceNumber} générée pour récurrence ${rec.id} (${rec.nom})`);
      } catch (err) {
        const msg = `Erreur inattendue pour récurrence ${rec.id}: ${String(err)}`;
        console.error(msg);
        errors.push(msg);
      }
    }

    return new Response(
      JSON.stringify({ success: true, generated, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Erreur générale dans generate-recurring-invoices:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
