/**
 * Retourne le nom du mois en français
 * @param monthIndex Index du mois (0-11)
 * @returns Le nom du mois en français avec la première lettre en majuscule
 */
export const getMonthName = (monthIndex: number): string => {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return months[monthIndex] || '';
};

/**
 * Formate une date au format suisse (JJ.MM.AAAA)
 * @param date Date à formater (objet Date ou chaîne de caractères)
 * @returns La date formatée en chaîne de caractères
 */
export const formatSwissDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '.');
};

/**
 * Calcule la différence en jours entre deux dates
 * @param date1 Première date
 * @param date2 Deuxième date
 * @returns La différence en jours (nombre entier)
 */
export const getDaysDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
