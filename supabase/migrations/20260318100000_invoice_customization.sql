-- ============================================================
-- Migration: Personnalisation avancée des factures
-- Police, position QR, espacement adresses
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS font_family     TEXT DEFAULT 'helvetica',
  ADD COLUMN IF NOT EXISTS qr_position     TEXT DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS address_spacing TEXT DEFAULT 'normal';

-- Valeurs valides (documentation)
-- font_family     : 'helvetica' | 'times' | 'courier'
-- qr_position     : 'left' | 'center' | 'right'
-- address_spacing : 'compact' | 'normal' | 'spacious'

SELECT 'Migration invoice_customization appliquée avec succès ✓' AS status;
