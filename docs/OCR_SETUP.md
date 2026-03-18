# Configuration OCR / Scanner de Reçus

Ce document explique comment configurer la fonctionnalité de scan OCR de reçus pour ZenFacture.

## Prérequis

1. **Compte Anthropic Claude**
   - Créer un compte sur https://console.anthropic.com/
   - Générer une clé API
   - Ajouter des crédits au compte

2. **Supabase Storage**
   - Bucket `ocr-receipts` créé et configuré comme public

3. **Supabase Database**
   - Table `ocr_scans` créée
   - Table `depenses` créée

## Configuration

### 1. Variables d'environnement

Ajoutez la clé API Anthropic dans votre fichier `.env`:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxx...
```

### 2. Configuration Supabase

#### Créer le bucket de stockage

```sql
-- Créer le bucket pour les images de reçus
INSERT INTO storage.buckets (id, name, public)
VALUES ('ocr-receipts', 'ocr-receipts', true);

-- Politique de sécurité pour permettre les uploads
CREATE POLICY "Les utilisateurs authentifiés peuvent uploader"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ocr-receipts');

-- Politique pour lire les fichiers
CREATE POLICY "Tout le monde peut lire les fichiers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ocr-receipts');
```

#### Créer la table ocr_scans

```sql
CREATE TABLE ocr_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_ocr_scans_organisation ON ocr_scans(organisation_id);
CREATE INDEX idx_ocr_scans_status ON ocr_scans(status);
CREATE INDEX idx_ocr_scans_created ON ocr_scans(created_at DESC);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER update_ocr_scans_updated_at
BEFORE UPDATE ON ocr_scans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE ocr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les scans de leur organisation"
ON ocr_scans FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM utilisateurs_organisations
    WHERE utilisateur_id = auth.uid()
  )
);

CREATE POLICY "Les utilisateurs peuvent créer des scans pour leur organisation"
ON ocr_scans FOR INSERT
TO authenticated
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM utilisateurs_organisations
    WHERE utilisateur_id = auth.uid()
  )
);

CREATE POLICY "Les utilisateurs peuvent mettre à jour les scans de leur organisation"
ON ocr_scans FOR UPDATE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM utilisateurs_organisations
    WHERE utilisateur_id = auth.uid()
  )
);
```

#### Créer/Vérifier la table depenses

```sql
CREATE TABLE IF NOT EXISTS depenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'CHF',
  category TEXT NOT NULL,
  date DATE NOT NULL,
  vat_rate DECIMAL(4, 2),
  notes TEXT,
  status TEXT DEFAULT 'pending',
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_depenses_user ON depenses(user_id);
CREATE INDEX IF NOT EXISTS idx_depenses_organisation ON depenses(organisation_id);
CREATE INDEX IF NOT EXISTS idx_depenses_date ON depenses(date DESC);

-- RLS
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs dépenses"
ON depenses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent créer leurs dépenses"
ON depenses FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs dépenses"
ON depenses FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent supprimer leurs dépenses"
ON depenses FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

### 3. Déployer la fonction Edge

```bash
# Depuis le répertoire racine du projet
supabase functions deploy ocr-scan

# Configurer la clé API Anthropic
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-xxx...
```

### 4. Ajouter la route dans l'application

Dans votre fichier de routes (ex: `App.tsx`):

```tsx
import OcrScanPage from '@/pages/dashboard/OcrScanPage';

// Dans vos routes
<Route path="/dashboard/scan-receipt" element={<OcrScanPage />} />
```

## Utilisation

### Dans votre application

1. **Navigation vers le scanner**:
```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/dashboard/scan-receipt');
```

2. **Utiliser le composant directement**:
```tsx
import { OcrScanner } from '@/components/ocr/OcrScanner';

function MyPage() {
  return (
    <OcrScanner
      onExpenseCreated={() => {
        console.log('Dépense créée!');
        // Rafraîchir la liste des dépenses ou naviguer
      }}
    />
  );
}
```

3. **Utiliser le hook useOcr**:
```tsx
import { useOcr } from '@/hooks/useOcr';

function MyComponent() {
  const { uploadAndScan, isScanning, result, error } = useOcr();

  const handleFileUpload = async (file: File) => {
    try {
      const ocrResult = await uploadAndScan(file);
      console.log('Résultat OCR:', ocrResult);
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
      {error && <p>Erreur: {error}</p>}
    </div>
  );
}
```

## Fonctionnalités

### OcrScanner
- Glisser-déposer d'images
- Sélection de fichiers
- Prévisualisation de l'image
- Indicateur de progression
- Gestion des erreurs
- Navigation après création

### OcrResultEditor
- Formulaire pré-rempli avec les données OCR
- Validation des champs
- Sélection de devise (CHF, EUR, USD)
- Sélection de taux de TVA suisse (8.1%, 3.8%, 2.6%, 0%)
- Catégories prédéfinies
- Champ notes pour informations additionnelles

### Service OCR
- Upload d'images vers Supabase Storage
- Appel à l'API Anthropic Claude Vision
- Extraction structurée des données
- Suivi de l'état du scan
- Historique des scans

## Modèle de données OCR

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

## Catégories disponibles

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

- 8.1% - Taux normal
- 3.8% - Taux réduit
- 2.6% - Hébergement
- 0% - Exonéré

## Limites et considérations

1. **Taille des images**: Maximum 10MB recommandé
2. **Formats supportés**: JPG, PNG, JPEG, WebP, GIF
3. **Coûts API**: Chaque scan consomme des tokens Anthropic
4. **Précision**: L'OCR peut nécessiter des corrections manuelles
5. **Langues**: Optimisé pour le français et les reçus suisses

## Dépannage

### L'image ne se charge pas
- Vérifier que le bucket `ocr-receipts` est public
- Vérifier les politiques de sécurité sur le bucket

### Erreur lors du scan
- Vérifier que la clé API Anthropic est configurée
- Vérifier que la fonction Edge est déployée
- Consulter les logs: `supabase functions logs ocr-scan`

### La dépense n'est pas créée
- Vérifier que la table `depenses` existe
- Vérifier les politiques RLS sur la table
- Vérifier que l'utilisateur a une organisation

## Support

Pour toute question ou problème, consultez:
- Documentation Supabase: https://supabase.com/docs
- Documentation Anthropic: https://docs.anthropic.com/
- Logs des fonctions Edge: `supabase functions logs`
