-- Migration : Phase 5.1 — Cron automatique pour les factures récurrentes
-- Date : 2026-03-18

-- 1. Ajouter la colonne envoi_auto sur factures_recurrentes
ALTER TABLE factures_recurrentes
  ADD COLUMN IF NOT EXISTS envoi_auto BOOLEAN DEFAULT false;

COMMENT ON COLUMN factures_recurrentes.envoi_auto IS
  'Si true, la facture est générée automatiquement par le cron quotidien.';

-- 2. Index pour optimiser la requête de sélection des récurrences dues
CREATE INDEX IF NOT EXISTS idx_factures_recurrentes_actif_prochaine_emission
  ON factures_recurrentes (actif, prochaine_emission);

-- 3. Activer l'extension pg_cron (disponible nativement sur Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 4. Activer l'extension pg_net pour les appels HTTP depuis pg_cron
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 5. Supprimer le job s'il existe déjà (idempotence)
SELECT cron.unschedule('generate-recurring-invoices')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'generate-recurring-invoices'
);

-- 6. Planifier le job cron : tous les jours à 07h00 UTC (= 08h00 heure suisse)
SELECT cron.schedule(
  'generate-recurring-invoices',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url        := current_setting('app.supabase_url') || '/functions/v1/generate-recurring-invoices',
    headers    := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body       := '{}'::jsonb
  ) AS request_id;
  $$
);
