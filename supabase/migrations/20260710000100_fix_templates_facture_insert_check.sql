-- Migration : Corrige la policy INSERT de templates_facture (est_systeme non vérifié)
-- Contexte (audit sécurité 2026-07-08) : les policies SELECT/UPDATE/DELETE de
-- templates_facture vérifient bien `est_systeme = false`, mais la policy INSERT
-- (créée dans 20260218100000_phase2_fonctionnalites.sql sous le nom
-- "templates_insert", et redéfinie à l'identique sous le nom
-- "templates_facture_insert" dans 99999999999999_EXECUTE_MOI_EN_PREMIER.sql)
-- ne vérifie que organisation_id, sans exclure est_systeme. Un utilisateur pouvait
-- donc insérer une ligne avec est_systeme = true, la rendant visible par toutes
-- les organisations (pollution du catalogue système partagé). Impact limité
-- (pas de fuite de données sensibles), mais corrigé ici par prudence.
--
-- On supprime les deux noms de policy possibles (selon l'ordre d'application
-- historique des migrations) et on recrée une version unique avec la
-- vérification manquante.

DROP POLICY IF EXISTS "templates_insert" ON public.templates_facture;
DROP POLICY IF EXISTS "templates_facture_insert" ON public.templates_facture;

CREATE POLICY "templates_facture_insert" ON public.templates_facture FOR INSERT WITH CHECK (
  est_systeme = false
  AND organisation_id IN (SELECT public.get_user_org_ids())
);
