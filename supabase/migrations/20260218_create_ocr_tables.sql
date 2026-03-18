-- Migration: Create OCR tables and storage bucket
-- Date: 2026-02-18
-- Description: Sets up the database infrastructure for OCR receipt scanning feature

-- =====================================================
-- STORAGE BUCKET SETUP
-- =====================================================

-- Create bucket for OCR receipt images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ocr-receipts', 'ocr-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for OCR receipts bucket
DO $$
BEGIN
  -- Policy: Authenticated users can upload to ocr-receipts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Authenticated users can upload OCR receipts'
  ) THEN
    CREATE POLICY "Authenticated users can upload OCR receipts"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'ocr-receipts');
  END IF;

  -- Policy: Public read access to OCR receipts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Public can read OCR receipts'
  ) THEN
    CREATE POLICY "Public can read OCR receipts"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'ocr-receipts');
  END IF;

  -- Policy: Users can delete their own uploads
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can delete their OCR receipts'
  ) THEN
    CREATE POLICY "Users can delete their OCR receipts"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'ocr-receipts');
  END IF;
END $$;

-- =====================================================
-- OCR SCANS TABLE
-- =====================================================

-- Create table for OCR scan records
CREATE TABLE IF NOT EXISTS ocr_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE ocr_scans IS 'Stores OCR scan records for receipt processing';

-- Add comments to columns
COMMENT ON COLUMN ocr_scans.organisation_id IS 'Reference to the organisation that owns this scan';
COMMENT ON COLUMN ocr_scans.image_url IS 'URL of the uploaded receipt image';
COMMENT ON COLUMN ocr_scans.status IS 'Current status of the OCR scan process';
COMMENT ON COLUMN ocr_scans.result IS 'JSON object containing extracted OCR data';
COMMENT ON COLUMN ocr_scans.error IS 'Error message if the scan failed';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ocr_scans_organisation ON ocr_scans(organisation_id);
CREATE INDEX IF NOT EXISTS idx_ocr_scans_status ON ocr_scans(status);
CREATE INDEX IF NOT EXISTS idx_ocr_scans_created ON ocr_scans(created_at DESC);

-- =====================================================
-- DEPENSES TABLE UPDATES
-- =====================================================

-- Ensure depenses table has all required columns
DO $$
BEGIN
  -- Add currency column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'depenses' AND column_name = 'currency'
  ) THEN
    ALTER TABLE depenses ADD COLUMN currency TEXT DEFAULT 'CHF';
  END IF;

  -- Add vat_rate column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'depenses' AND column_name = 'vat_rate'
  ) THEN
    ALTER TABLE depenses ADD COLUMN vat_rate DECIMAL(4, 2);
  END IF;

  -- Add notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'depenses' AND column_name = 'notes'
  ) THEN
    ALTER TABLE depenses ADD COLUMN notes TEXT;
  END IF;

  -- Add receipt_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'depenses' AND column_name = 'receipt_url'
  ) THEN
    ALTER TABLE depenses ADD COLUMN receipt_url TEXT;
  END IF;
END $$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ocr_scans table
DROP TRIGGER IF EXISTS update_ocr_scans_updated_at ON ocr_scans;
CREATE TRIGGER update_ocr_scans_updated_at
BEFORE UPDATE ON ocr_scans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on ocr_scans table
ALTER TABLE ocr_scans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view scans from their organisation" ON ocr_scans;
DROP POLICY IF EXISTS "Users can create scans for their organisation" ON ocr_scans;
DROP POLICY IF EXISTS "Users can update scans from their organisation" ON ocr_scans;

-- Policy: Users can view scans from their organisation
CREATE POLICY "Users can view scans from their organisation"
ON ocr_scans FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM utilisateurs_organisations
    WHERE utilisateur_id = auth.uid()
  )
);

-- Policy: Users can create scans for their organisation
CREATE POLICY "Users can create scans for their organisation"
ON ocr_scans FOR INSERT
TO authenticated
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM utilisateurs_organisations
    WHERE utilisateur_id = auth.uid()
  )
);

-- Policy: Users can update scans from their organisation
CREATE POLICY "Users can update scans from their organisation"
ON ocr_scans FOR UPDATE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM utilisateurs_organisations
    WHERE utilisateur_id = auth.uid()
  )
);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify table was created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ocr_scans') THEN
    RAISE EXCEPTION 'Table ocr_scans was not created successfully';
  END IF;

  RAISE NOTICE 'OCR tables and storage setup completed successfully';
END $$;
