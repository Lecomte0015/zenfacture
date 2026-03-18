import { useState } from 'react';
import { uploadReceiptImage, scanReceipt, OcrResult } from '@/services/ocrService';
import { useOrganisation } from '@/context/OrganisationContext';

interface UseOcrReturn {
  isScanning: boolean;
  result: OcrResult | null;
  error: string | null;
  uploadAndScan: (file: File) => Promise<OcrResult>;
  resetScan: () => void;
}

export function useOcr(): UseOcrReturn {
  const { organisationId } = useOrganisation();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadAndScan = async (file: File): Promise<OcrResult> => {
    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      if (!organisationId) {
        throw new Error('Organisation introuvable');
      }

      // Upload image
      const imageUrl = await uploadReceiptImage(file);

      // Scan receipt
      const ocrResult = await scanReceipt(imageUrl, organisationId);

      setResult(ocrResult);
      return ocrResult;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Une erreur est survenue lors du scan';
      setError(errorMessage);
      throw err;
    } finally {
      setIsScanning(false);
    }
  };

  const resetScan = () => {
    setResult(null);
    setError(null);
    setIsScanning(false);
  };

  return {
    isScanning,
    result,
    error,
    uploadAndScan,
    resetScan,
  };
}
