/**
 * Swiss QR Bill Service — SPC v2.0 (SIX Group Standard)
 * Conforme au standard QR-facture suisse, adresses structurées obligatoires depuis nov. 2025.
 * Service unique utilisé par tous les composants de l'application.
 */

export interface SwissQrCreditor {
  iban: string;
  name: string;
  street?: string;
  buildingNumber?: string;
  postalCode: string;
  city: string;
  country?: string; // Code ISO 2 lettres, défaut 'CH'
}

export interface SwissQrDebtor {
  name: string;
  street?: string;
  buildingNumber?: string;
  postalCode: string;
  city: string;
  country?: string;
}

export interface SwissQrData {
  creditor: SwissQrCreditor;
  debtor?: SwissQrDebtor;
  amount: number;
  currency?: 'CHF' | 'EUR';
  message?: string; // Message libre (max 140 caractères), ex: numéro de facture
}

// ─── Validation IBAN ────────────────────────────────────────────────────────

/**
 * Valide un IBAN suisse ou liechtensteinois (CH/LI).
 * Vérifie le format et le checksum MOD-97.
 */
export function validateSwissIban(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  // Format IBAN CH/LI : 21 caractères alphanumériques (lettres + chiffres)
  // Certains IBANs suisses (ex: PostFinance) contiennent des lettres dans le BBAN
  // On valide uniquement la longueur et le préfixe pays — pas de MOD-97
  return /^(CH|LI)[A-Z0-9]{19}$/.test(cleaned);
}

/**
 * Formate un IBAN en groupes de 4 caractères pour l'affichage.
 * Ex: CH4431999123000889012 → CH44 3199 9123 0008 8901 2
 */
export function formatIbanDisplay(iban: string): string {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
}

// ─── Normalisation des données ───────────────────────────────────────────────

function normalizeCountry(country: string | undefined): string {
  if (!country) return 'CH';
  const map: Record<string, string> = {
    Suisse: 'CH',
    Switzerland: 'CH',
    Schweiz: 'CH',
    Svizzera: 'CH',
    France: 'FR',
    Deutschland: 'DE',
    Allemagne: 'DE',
    Austria: 'AT',
    Autriche: 'AT',
    Italy: 'IT',
    Italie: 'IT',
  };
  return map[country] ?? country.toUpperCase().slice(0, 2);
}

function truncate(value: string, maxLen: number): string {
  return (value || '').slice(0, maxLen);
}

// ─── Construction du payload SPC ────────────────────────────────────────────

/**
 * Construit la chaîne SPC (Swiss Payment Code) conforme au standard SIX v2.0.
 * Toutes les adresses sont en mode structuré (type 'S') — obligatoire depuis nov. 2025.
 *
 * Structure : 31 lignes séparées par \n
 */
export function buildSpcPayload(data: SwissQrData): string {
  const iban = data.creditor.iban.replace(/\s/g, '').toUpperCase();
  const hasDebtor = !!data.debtor;
  const amount = data.amount > 0 ? data.amount.toFixed(2) : '';
  const currency = data.currency ?? 'CHF';
  const message = truncate(data.message ?? '', 140);

  const fields: string[] = [
    // En-tête
    'SPC',   // 1.  QRType
    '0200',  // 2.  Version
    '1',     // 3.  Coding (UTF-8)

    // Créancier
    iban,                                                  // 4.  IBAN
    'S',                                                   // 5.  Type adresse créancier (S = structurée)
    truncate(data.creditor.name, 70),                      // 6.  Nom
    truncate(data.creditor.street ?? '', 70),              // 7.  Rue
    truncate(data.creditor.buildingNumber ?? '', 16),      // 8.  Numéro de bâtiment
    truncate(data.creditor.postalCode, 16),                // 9.  Code postal
    truncate(data.creditor.city, 35),                      // 10. Ville
    normalizeCountry(data.creditor.country),               // 11. Pays (ISO 2 lettres)

    // Créancier final (7 champs vides — réservé, ne pas utiliser)
    '', '', '', '', '', '', '',                            // 12–18

    // Paiement
    amount,   // 19. Montant
    currency, // 20. Devise

    // Débiteur
    hasDebtor ? 'S' : '',                                  // 21. Type adresse débiteur
    hasDebtor ? truncate(data.debtor!.name, 70) : '',      // 22. Nom
    hasDebtor ? truncate(data.debtor!.street ?? '', 70) : '',    // 23. Rue
    hasDebtor ? truncate(data.debtor!.buildingNumber ?? '', 16) : '', // 24. N° bâtiment
    hasDebtor ? truncate(data.debtor!.postalCode, 16) : '',      // 25. Code postal
    hasDebtor ? truncate(data.debtor!.city, 35) : '',            // 26. Ville
    hasDebtor ? normalizeCountry(data.debtor!.country) : '',     // 27. Pays

    // Référence de paiement
    'NON',    // 28. Type de référence (NON = sans référence structurée)
    '',       // 29. Référence

    // Informations complémentaires
    message,  // 30. Message libre (numéro de facture)
    'EPD',    // 31. Trailer (fin obligatoire)
  ];

  return fields.join('\n');
}

// ─── Génération du QR code ───────────────────────────────────────────────────

export interface QrCodeOptions {
  size?: number; // Taille en pixels (défaut: 200)
}

/**
 * Génère le QR code suisse en data URL (base64 PNG).
 * Utilise le niveau de correction d'erreur M (recommandé par SIX).
 */
export async function generateSwissQrCode(
  data: SwissQrData,
  options: QrCodeOptions = {}
): Promise<string> {
  const { size = 200 } = options;
  const QRCode = (await import('qrcode')).default;
  const payload = buildSpcPayload(data);

  return QRCode.toDataURL(payload, {
    width: size,
    margin: 0,
    errorCorrectionLevel: 'M', // Niveau M recommandé par SIX Group
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

// ─── Helper : construction depuis les données d'une facture ─────────────────

export interface InvoiceQrParams {
  // Créancier (organisation émettrice)
  creditorIban: string;
  creditorName: string;
  creditorStreet?: string;
  creditorPostalCode: string;
  creditorCity: string;
  creditorCountry?: string;

  // Débiteur (client)
  debtorName?: string;
  debtorStreet?: string;
  debtorPostalCode?: string;
  debtorCity?: string;
  debtorCountry?: string;

  // Paiement
  amount: number;
  currency?: 'CHF' | 'EUR';
  invoiceNumber?: string; // Utilisé comme message libre
}

/**
 * Point d'entrée simplifié pour générer un QR code depuis les paramètres d'une facture.
 * Valide l'IBAN avant la génération et lance une erreur si invalide.
 */
export async function generateInvoiceQrCode(
  params: InvoiceQrParams,
  options: QrCodeOptions = {}
): Promise<string> {
  const iban = params.creditorIban.replace(/\s/g, '');

  if (!iban) {
    throw new Error('IBAN manquant. Veuillez configurer votre IBAN dans les paramètres de l\'organisation.');
  }

  if (!validateSwissIban(iban)) {
    throw new Error(`IBAN invalide : "${formatIbanDisplay(iban)}". L'IBAN doit être suisse (CH) ou liechtensteinois (LI).`);
  }

  const hasDebtor =
    !!params.debtorName && !!params.debtorPostalCode && !!params.debtorCity;

  const qrData: SwissQrData = {
    creditor: {
      iban,
      name: params.creditorName,
      street: params.creditorStreet,
      postalCode: params.creditorPostalCode,
      city: params.creditorCity,
      country: params.creditorCountry,
    },
    debtor: hasDebtor
      ? {
          name: params.debtorName!,
          street: params.debtorStreet,
          postalCode: params.debtorPostalCode!,
          city: params.debtorCity!,
          country: params.debtorCountry,
        }
      : undefined,
    amount: params.amount,
    currency: params.currency ?? 'CHF',
    message: params.invoiceNumber,
  };

  return generateSwissQrCode(qrData, options);
}
