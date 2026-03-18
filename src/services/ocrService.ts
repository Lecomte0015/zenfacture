import { supabase } from '@/lib/supabase';

export interface OcrResult {
  montant: number;
  devise: string;
  date: string;
  fournisseur: string;
  categorie: string;
  taux_tva: string;
  description: string;
}

export interface OcrScan {
  id: string;
  organisation_id: string;
  image_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: OcrResult;
  error?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Uploads a receipt image to Supabase Storage
 * @param file - The image file to upload
 * @returns The public URL of the uploaded image
 */
export async function uploadReceiptImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from('ocr-receipts')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Erreur lors du téléchargement de l'image: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('ocr-receipts')
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Scans a receipt image using OCR
 * @param imageUrl - The URL of the image to scan
 * @param organisationId - The organisation ID
 * @returns The OCR scan result
 */
export async function scanReceipt(
  imageUrl: string,
  organisationId: string
): Promise<OcrResult> {
  // Create OCR scan record
  const { data: scanData, error: scanError } = await supabase
    .from('ocr_scans')
    .insert({
      organisation_id: organisationId,
      image_url: imageUrl,
      status: 'pending',
    })
    .select()
    .single();

  if (scanError) {
    throw new Error(`Erreur lors de la création de l'enregistrement: ${scanError.message}`);
  }

  try {
    // Update status to processing
    await supabase
      .from('ocr_scans')
      .update({ status: 'processing' })
      .eq('id', scanData.id);

    // Call Supabase Edge Function for OCR processing
    const { data: ocrResult, error: ocrError } = await supabase.functions.invoke(
      'ocr-scan',
      {
        body: { image_url: imageUrl },
      }
    );

    if (ocrError) {
      // Update status to failed
      await supabase
        .from('ocr_scans')
        .update({
          status: 'failed',
          error: ocrError.message,
        })
        .eq('id', scanData.id);

      throw new Error(`Erreur lors du scan OCR: ${ocrError.message}`);
    }

    // Update status to completed with result
    await supabase
      .from('ocr_scans')
      .update({
        status: 'completed',
        result: ocrResult,
      })
      .eq('id', scanData.id);

    return ocrResult as OcrResult;
  } catch (error) {
    // Update status to failed
    await supabase
      .from('ocr_scans')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', scanData.id);

    throw error;
  }
}

/**
 * Gets all OCR scans for an organisation
 * @param organisationId - The organisation ID
 * @returns List of OCR scans
 */
export async function getScans(organisationId: string): Promise<OcrScan[]> {
  const { data, error } = await supabase
    .from('ocr_scans')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erreur lors de la récupération des scans: ${error.message}`);
  }

  return data || [];
}
