import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X, AlertCircle } from 'lucide-react';
import { useOcr } from '@/hooks/useOcr';
import { OcrResultEditor } from './OcrResultEditor';

interface OcrScannerProps {
  onExpenseCreated?: () => void;
}

export const OcrScanner: React.FC<OcrScannerProps> = ({ onExpenseCreated }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isScanning, result, error, uploadAndScan, resetScan } = useOcr();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) return;

    try {
      await uploadAndScan(selectedFile);
    } catch (err) {
      console.error('Erreur lors du scan:', err);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    resetScan();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExpenseSaved = () => {
    handleCancel();
    if (onExpenseCreated) {
      onExpenseCreated();
    }
  };

  // If we have a result, show the editor
  if (result) {
    return (
      <OcrResultEditor
        result={result}
        onSave={handleExpenseSaved}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="h-8 w-8 text-blue-600" />
            Scanner un reçu
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Téléchargez une photo ou une image de votre reçu pour extraire automatiquement les informations
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Drop Zone */}
        {!previewUrl && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm font-medium text-gray-900">
              Glissez-déposez une image ici
            </p>
            <p className="mt-2 text-sm text-gray-500">ou</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Upload className="h-5 w-5 mr-2" />
              Sélectionner un fichier
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <p className="mt-4 text-xs text-gray-500">
              PNG, JPG, JPEG jusqu'à 10MB
            </p>
          </div>
        )}

        {/* Preview and Scan */}
        {previewUrl && (
          <div className="space-y-6">
            <div className="relative">
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Aperçu du reçu"
                  className="w-full h-auto max-h-96 object-contain bg-gray-50"
                />
              </div>
              {!isScanning && (
                <button
                  onClick={handleCancel}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              )}
            </div>

            {isScanning ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Analyse en cours...
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Extraction des informations du reçu
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Annuler
                </button>
                <button
                  onClick={handleScan}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Scanner
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
