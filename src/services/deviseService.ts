const DEVISES_SUPPORTEES = ['CHF', 'EUR', 'USD'] as const;
export type DeviseCode = typeof DEVISES_SUPPORTEES[number];

export interface DeviseInfo {
  code: DeviseCode;
  symbole: string;
  nom: string;
}

export const DEVISES: Record<DeviseCode, DeviseInfo> = {
  CHF: { code: 'CHF', symbole: 'CHF', nom: 'Franc suisse' },
  EUR: { code: 'EUR', symbole: '€', nom: 'Euro' },
  USD: { code: 'USD', symbole: '$', nom: 'Dollar américain' },
};

interface TauxDeChange {
  [key: string]: number;
}

let tauxCache: { taux: TauxDeChange; date: string } | null = null;

export const getTauxDeChange = async (): Promise<TauxDeChange> => {
  // Utiliser le cache si disponible et récent (< 1h)
  if (tauxCache) {
    const cacheAge = Date.now() - new Date(tauxCache.date).getTime();
    if (cacheAge < 3600000) return tauxCache.taux;
  }

  try {
    // API ECB pour les taux EUR
    const response = await fetch(
      'https://api.frankfurter.app/latest?from=CHF&to=EUR,USD'
    );

    if (!response.ok) throw new Error('Erreur API taux de change');

    const data = await response.json();

    const taux: TauxDeChange = {
      CHF: 1,
      EUR: data.rates?.EUR || 0.94,
      USD: data.rates?.USD || 1.12,
    };

    tauxCache = { taux, date: new Date().toISOString() };
    return taux;
  } catch (error) {
    console.error('Erreur lors de la récupération des taux de change:', error);
    // Taux de secours approximatifs
    return { CHF: 1, EUR: 0.94, USD: 1.12 };
  }
};

export const convertirMontant = async (
  montant: number,
  deDevise: DeviseCode,
  versDevise: DeviseCode
): Promise<number> => {
  if (deDevise === versDevise) return montant;

  const taux = await getTauxDeChange();

  // Convertir en CHF d'abord, puis vers la devise cible
  const enCHF = deDevise === 'CHF' ? montant : montant / taux[deDevise];
  const resultat = versDevise === 'CHF' ? enCHF : enCHF * taux[versDevise];

  return Math.round(resultat * 100) / 100;
};

export const formaterMontant = (montant: number, devise: DeviseCode = 'CHF'): string => {
  const locale = devise === 'CHF' ? 'fr-CH' : devise === 'EUR' ? 'fr-FR' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: devise,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(montant);
};
