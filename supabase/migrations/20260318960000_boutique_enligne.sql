-- Migration: Connecteur Boutiques en ligne (Phase 7.5)
-- Date: 2026-03-18
-- Plateformes supportées : Shopify, WooCommerce, PrestaShop, Magento, Custom (API REST)

CREATE TABLE IF NOT EXISTS boutique_connexions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  nom               TEXT NOT NULL,
  plateforme        TEXT NOT NULL CHECK (plateforme IN ('shopify','woocommerce','prestashop','magento','custom')),
  url_boutique      TEXT NOT NULL,
  api_key           TEXT,
  api_secret        TEXT,
  access_token      TEXT,
  webhook_secret    TEXT,
  statut            TEXT NOT NULL DEFAULT 'inactif' CHECK (statut IN ('actif','inactif','erreur')),
  derniere_synchro  TIMESTAMPTZ,
  config            JSONB NOT NULL DEFAULT '{}',
  -- Options de synchronisation
  auto_facture      BOOLEAN NOT NULL DEFAULT TRUE,
  auto_stock        BOOLEAN NOT NULL DEFAULT FALSE,
  statut_commande   TEXT NOT NULL DEFAULT 'paid' CHECK (statut_commande IN ('any','pending','paid','fulfilled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boutique_commandes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id     UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  connexion_id        UUID NOT NULL REFERENCES boutique_connexions(id) ON DELETE CASCADE,
  commande_externe_id TEXT NOT NULL,
  numero_commande     TEXT NOT NULL,
  statut              TEXT NOT NULL,
  client_nom          TEXT,
  client_email        TEXT,
  client_adresse      JSONB,
  lignes              JSONB NOT NULL DEFAULT '[]',
  total_ht            NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_tva           NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_ttc           NUMERIC(12,2) NOT NULL DEFAULT 0,
  devise              TEXT NOT NULL DEFAULT 'CHF',
  invoice_id          UUID REFERENCES factures(id) ON DELETE SET NULL,
  synchro_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  commande_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boutique_connexions_org ON boutique_connexions(organisation_id);
CREATE INDEX IF NOT EXISTS idx_boutique_commandes_connexion ON boutique_commandes(connexion_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_boutique_commandes_org ON boutique_commandes(organisation_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_boutique_commandes_unique ON boutique_commandes(connexion_id, commande_externe_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_boutique_connexions_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_boutique_connexions_updated_at
  BEFORE UPDATE ON boutique_connexions
  FOR EACH ROW EXECUTE FUNCTION update_boutique_connexions_updated_at();

-- RLS
ALTER TABLE boutique_connexions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_commandes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boutique_connexions_org" ON boutique_connexions
  FOR ALL USING (
    organisation_id IN (SELECT public.get_user_org_ids())
  );

CREATE POLICY "boutique_commandes_org" ON boutique_commandes
  FOR ALL USING (
    organisation_id IN (SELECT public.get_user_org_ids())
  );
