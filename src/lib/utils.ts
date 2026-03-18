import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'CHF',
  }).format(amount);
}

export function getRemainingDays(endDate: Date | string) {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = Math.max(0, end.getTime() - now.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isTrialExpired(endDate: Date | string | null) {
  if (!endDate) return false;
  return new Date() > new Date(endDate);
}

export function getTrialProgress(startDate: Date | string, endDate: Date | string) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  
  const total = end - start;
  const elapsed = now - start;
  
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}
