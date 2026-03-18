# Composants OCR / Scanner de Reçus

Ce module fournit des composants React pour scanner et extraire automatiquement les informations de reçus en utilisant l'IA (Anthropic Claude Vision).

## Composants

### OcrScanner

Composant principal pour scanner des reçus.

**Props:**
- `onExpenseCreated?: () => void` - Callback appelé après la création réussie d'une dépense

**Utilisation:**
```tsx
import { OcrScanner } from '@/components/ocr';

function MyPage() {
  return (
    <OcrScanner
      onExpenseCreated={() => {
        console.log('Dépense créée avec succès!');
      }}
    />
  );
}
```

**Fonctionnalités:**
- Glisser-déposer d'images
- Sélection de fichiers
- Prévisualisation de l'image
- Indicateur de chargement pendant le scan
- Gestion des erreurs
- Transition automatique vers l'éditeur après le scan

### OcrResultEditor

Composant pour éditer et valider les résultats OCR avant de créer la dépense.

**Props:**
- `result: OcrResult` - Les données extraites par l'OCR
- `onSave: () => void` - Callback appelé après la sauvegarde réussie
- `onCancel: () => void` - Callback appelé lors de l'annulation

**Utilisation:**
```tsx
import { OcrResultEditor } from '@/components/ocr';

function MyComponent({ ocrResult }) {
  return (
    <OcrResultEditor
      result={ocrResult}
      onSave={() => console.log('Sauvegardé!')}
      onCancel={() => console.log('Annulé')}
    />
  );
}
```

**Fonctionnalités:**
- Formulaire pré-rempli avec les données OCR
- Validation des champs requis
- Sélection de devise (CHF, EUR, USD)
- Sélection de taux de TVA suisse
- Catégories de dépenses prédéfinies
- Champ notes optionnel

## Hook useOcr

Hook personnalisé pour gérer le processus de scan OCR.

**Retourne:**
```typescript
{
  isScanning: boolean;           // État du scan en cours
  result: OcrResult | null;      // Résultat du scan
  error: string | null;          // Message d'erreur éventuel
  uploadAndScan: (file: File) => Promise<OcrResult>;  // Fonction pour uploader et scanner
  resetScan: () => void;         // Réinitialiser l'état
}
```

**Utilisation:**
```tsx
import { useOcr } from '@/hooks/useOcr';

function MyComponent() {
  const { uploadAndScan, isScanning, result, error, resetScan } = useOcr();

  const handleFileUpload = async (file: File) => {
    try {
      const ocrResult = await uploadAndScan(file);
      console.log('Résultat:', ocrResult);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />
      {isScanning && <p>Scan en cours...</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      {error && <p className="text-red-600">{error}</p>}
      <button onClick={resetScan}>Réinitialiser</button>
    </div>
  );
}
```

## Service ocrService

Service pour interagir avec l'API OCR.

**Fonctions:**

### uploadReceiptImage(file: File): Promise<string>
Upload une image de reçu vers Supabase Storage.

```tsx
import { uploadReceiptImage } from '@/services/ocrService';

const imageUrl = await uploadReceiptImage(file);
```

### scanReceipt(imageUrl: string, organisationId: string): Promise<OcrResult>
Scanne un reçu et retourne les données extraites.

```tsx
import { scanReceipt } from '@/services/ocrService';

const result = await scanReceipt(imageUrl, organisationId);
```

### getScans(organisationId: string): Promise<OcrScan[]>
Récupère l'historique des scans pour une organisation.

```tsx
import { getScans } from '@/services/ocrService';

const scans = await getScans(organisationId);
```

## Types

### OcrResult
```typescript
interface OcrResult {
  montant: number;        // Montant total
  devise: string;         // CHF, EUR, USD
  date: string;          // Format YYYY-MM-DD
  fournisseur: string;   // Nom du fournisseur
  categorie: string;     // Catégorie de dépense
  taux_tva: string;      // Taux TVA (8.1, 3.8, 2.6, 0)
  description: string;   // Description des articles
}
```

### OcrScan
```typescript
interface OcrScan {
  id: string;
  organisation_id: string;
  image_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: OcrResult;
  error?: string;
  created_at: string;
  updated_at: string;
}
```

## Exemple complet

```tsx
import React from 'react';
import { OcrScanner } from '@/components/ocr';
import { useNavigate } from 'react-router-dom';

export default function ScanReceiptPage() {
  const navigate = useNavigate();

  const handleExpenseCreated = () => {
    // Rediriger vers la page des dépenses
    navigate('/dashboard/expenses');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <OcrScanner onExpenseCreated={handleExpenseCreated} />
    </div>
  );
}
```

## Configuration requise

Avant d'utiliser ces composants, assurez-vous que:

1. Le bucket Supabase `ocr-receipts` est créé et configuré
2. La fonction Edge `ocr-scan` est déployée
3. La clé API Anthropic est configurée dans les secrets Supabase
4. Les tables `ocr_scans` et `depenses` existent dans la base de données

Voir [OCR_SETUP.md](/docs/OCR_SETUP.md) pour les instructions détaillées.

## Catégories de dépenses

Les catégories disponibles sont:
- Fournitures de bureau
- Matériel informatique
- Frais de déplacement
- Repas & Restauration
- Formation
- Abonnements
- Téléphonie
- Marketing
- Loyer
- Assurances
- Autres

## Taux de TVA suisse

Les taux TVA supportés sont:
- 8.1% (taux normal)
- 3.8% (taux réduit)
- 2.6% (hébergement)
- 0% (exonéré)
