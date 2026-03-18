/**
 * Formate un montant dans la devise spécifiée (CHF par défaut)
 */
export const formatCurrency = (amount: number, currency: string = 'CHF'): string => {
  const locale = currency === 'CHF' ? 'fr-CH' : currency === 'EUR' ? 'fr-FR' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formate une date en français
 */
export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('fr-CH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
};

/**
 * Formate un numéro de téléphone
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // Supprime tous les caractères non numériques
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  
  // Format suisse : +41 79 123 45 67
  const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{2})(\d{2})$/);
  
  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
  }
  
  return phoneNumber; // Retourne le numéro original si le format ne correspond pas
};

/**
 * Tronque un texte avec des points de suspension si nécessaire
 */
export const truncate = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Formate un nombre avec des séparateurs de milliers
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-CH').format(num);
};

/**
 * Formate une durée en minutes en format lisible (ex: 2h 30min)
 */
export const formatDuration = (minutes: number): string => {
  if (!minutes) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${remainingMinutes}min`;
  }
};
