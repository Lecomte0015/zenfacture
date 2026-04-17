-- Migration: Commandes Fournisseurs / Purchase Orders (Phase 8.3)

CREATE TABLE IF NOT EXISTS fournisseurs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  numero           TEXT,
  nom              TEXT NOT NULL,
  contact          TEXT,
  email            TEXT,
  telephone        TEXT,
  adresse          TEXT,
  code_postal      TEXT,
  ville            TEXT,
  pays             TEXT NOT NULL DEFAULT 'Suisse',
  iban             TEXT,
  tva_numero       TEXT,
  delai_paiement   INTEGER NOT NULL DEFAULT 30,  -- jours
  notes            TEXT,
  actif            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commandes_fournisseurs (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id        UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  fournisseur_id         UUID NOT NULL REFERENCES fournisseurs(id) ON DELETE RESTRICT,
  numero                 TEXT NOT NULL,
  statut                 TEXT NOT NULL DEFAULT 'brouillon'
                         CHECK (statut IN ('brouillon','envoye','partiel','recu','annule')),
  date_commande          DATE NOT NULL DEFAULT CURRENT_DATE,
  date_livraison_prevue  DATE,
  date_reception         DATE,
  total_ht               NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_tva              NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_ttc              NUMERIC(12,2) NOT NULL DEFAULT 0,
  devise                 TEXT NOT NULL DEFAULT 'CHF',
  adresse_livraison      TEXT,
  notes                  TEXT,
  conditions             TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commandes_fournisseurs_lignes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id         UUID NOT NULL REFERENCES commandes_fournisseurs(id) ON DELETE CASCADE,
  article_id          UUID,  -- Référence optionnelle stock_articles
  reference           TEXT,
  description         TEXT NOT NULL,
  quantite_commandee  NUMERIC(12,3) NOT NULL,
  quantite_recue      NUMERIC(12,3) NOT NULL DEFAULT 0,
  unite               TEXT NOT NULL DEFAULT 'pcs',
  prix_unitaire       NUMERIC(12,4) NOT NULL,
  taux_tva            NUMERIC(5,2) NOT NULL DEFAULT 7.7,
  remise_pct          NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_ht            NUMERIC(12,2) NOT NULL,
  ordre               INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_fournisseurs_org          ON fournisseurs(organisation_id);
CREATE INDEX IF NOT EXISTS idx_commandes_four_org        ON commandes_fournisseurs(organisation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commandes_four_four       ON commandes_fournisseurs(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_commandes_four_lignes_cmd ON commandes_fournisseurs_lignes(commande_id);

CREATE OR REPLACE FUNCTION update_fournisseurs_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fournisseurs_updated_at
  BEFORE UPDATE ON fournisseurs
  FOR EACH ROW EXECUTE FUNCTION update_fournisseurs_updated_at();

CREATE TRIGGER trg_commandes_fournisseurs_updated_at
  BEFORE UPDATE ON commandes_fournisseurs
  FOR EACH ROW EXECUTE FUNCTION update_fournisseurs_updated_at();

ALTER TABLE fournisseurs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes_fournisseurs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes_fournisseurs_lignes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fournisseurs_org" ON fournisseurs
  FOR ALL USING (organisation_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "commandes_fournisseurs_org" ON commandes_fournisseurs
  FOR ALL USING (organisation_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "commandes_fournisseurs_lignes_org" ON commandes_fournisseurs_lignes
  FOR ALL USING (
    commande_id IN (
      SELECT id FROM commandes_fournisseurs
      WHERE organisation_id IN (SELECT public.get_user_org_ids())
    )
  );
