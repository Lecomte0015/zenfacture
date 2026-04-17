-- Migration: Gestion du stock (Phase 6.2)
-- Date: 2026-03-18

-- Table des articles en stock (liés aux produits existants)
CREATE TABLE IF NOT EXISTS stock_articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  produit_id      UUID REFERENCES produits(id) ON DELETE SET NULL,
  nom             TEXT NOT NULL,
  reference       TEXT,
  description     TEXT,
  quantite        NUMERIC(12,3) NOT NULL DEFAULT 0,
  quantite_min    NUMERIC(12,3) NOT NULL DEFAULT 0,
  quantite_max    NUMERIC(12,3),
  unite           TEXT NOT NULL DEFAULT 'pièce',
  cout_unitaire   NUMERIC(12,2) NOT NULL DEFAULT 0,
  emplacement     TEXT,
  categorie       TEXT,
  actif           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des mouvements de stock
CREATE TABLE IF NOT EXISTS stock_mouvements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  article_id      UUID NOT NULL REFERENCES stock_articles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('entree','sortie','ajustement','transfert','retour')),
  quantite        NUMERIC(12,3) NOT NULL,
  quantite_avant  NUMERIC(12,3) NOT NULL,
  quantite_apres  NUMERIC(12,3) NOT NULL,
  cout_unitaire   NUMERIC(12,2),
  reference_doc   TEXT,
  motif           TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_articles_org ON stock_articles(organisation_id);
CREATE INDEX IF NOT EXISTS idx_stock_articles_produit ON stock_articles(produit_id);
CREATE INDEX IF NOT EXISTS idx_stock_mouvements_article ON stock_mouvements(article_id);
CREATE INDEX IF NOT EXISTS idx_stock_mouvements_org ON stock_mouvements(organisation_id);
CREATE INDEX IF NOT EXISTS idx_stock_mouvements_date ON stock_mouvements(created_at DESC);

-- RLS
ALTER TABLE stock_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_mouvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_articles_org" ON stock_articles
  FOR ALL USING (
    organisation_id IN (SELECT public.get_user_org_ids())
  );

CREATE POLICY "stock_mouvements_org" ON stock_mouvements
  FOR ALL USING (
    organisation_id IN (SELECT public.get_user_org_ids())
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_stock_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_articles_updated_at
  BEFORE UPDATE ON stock_articles
  FOR EACH ROW EXECUTE FUNCTION update_stock_articles_updated_at();
