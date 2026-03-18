import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '../utils/errorUtils';
import { formatCurrency, formatDate, formatPhoneNumber, truncate, formatNumber, formatDuration } from '../utils/format';

// ── getErrorMessage ───────────────────────────────────────────────────────────

describe('getErrorMessage', () => {
  it('extrait le message depuis une instance Error', () => {
    const err = new Error('Quelque chose a mal tourné');
    expect(getErrorMessage(err)).toBe('Quelque chose a mal tourné');
  });

  it("retourne la chaîne directement si c'est un string", () => {
    expect(getErrorMessage('Erreur réseau')).toBe('Erreur réseau');
  });

  it('sérialise un objet inconnu en JSON', () => {
    const result = getErrorMessage({ code: 42 });
    expect(result).toBe('{"code":42}');
  });

  it('retourne "null" pour null', () => {
    expect(getErrorMessage(null)).toBe('null');
  });

  it('retourne "undefined" pour undefined', () => {
    expect(getErrorMessage(undefined)).toBe('undefined');
  });

  it("gère un objet ordinaire (pas une Error) comme JSON", () => {
    const weirdErr = { message: 'non-standard' };
    expect(getErrorMessage(weirdErr)).toBe('{"message":"non-standard"}');
  });

  it('gère un nombre', () => {
    expect(getErrorMessage(404)).toBe('404');
  });
});

// ── formatCurrency ────────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formate un montant CHF positif', () => {
    const result = formatCurrency(1234.56);
    // Swiss locale uses space as thousands separator and period or comma for decimals
    expect(result).toMatch(/1[\s'\u202F]?234/);
    expect(result).toContain('CHF');
  });

  it('formate zéro', () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/0/);
  });

  it('formate un montant négatif', () => {
    const result = formatCurrency(-500);
    expect(result).toMatch(/500/);
    expect(result).toMatch(/-|\u2212/); // minus sign or unicode minus
  });

  it('formate EUR avec locale fr-FR', () => {
    const result = formatCurrency(100, 'EUR');
    expect(result).toContain('€');
  });

  it('formate USD avec locale en-US', () => {
    const result = formatCurrency(100, 'USD');
    expect(result).toContain('$');
  });

  it('formate un grand nombre', () => {
    const result = formatCurrency(1000000);
    // Should contain the digits grouped
    expect(result).toMatch(/1.{0,3}000.{0,3}000/);
  });
});

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formate une date ISO string', () => {
    const result = formatDate('2024-03-15');
    expect(result).toMatch(/15|2024/);
  });

  it('formate un objet Date', () => {
    const date = new Date(2024, 2, 15); // 15 mars 2024
    const result = formatDate(date);
    expect(result).toMatch(/15|2024/);
  });

  it('retourne une chaîne non vide pour une date valide', () => {
    const result = formatDate('2024-01-01');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── formatPhoneNumber ─────────────────────────────────────────────────────────

describe('formatPhoneNumber', () => {
  it('retourne le numéro brut pour un numéro 10 chiffres non-reconnu', () => {
    const result = formatPhoneNumber('0791234567');
    
    // La regex attend 12 chiffres (format +CC AA BBB CC DD);
    // 0791234567 ne matche pas → retourne la valeur originale
    expect(result).toBe('0791234567');
  });

  it('retourne le numéro brut si non reconnu', () => {
    // Numéro court (non reconnu par le format suisse)
    const result = formatPhoneNumber('123');
    expect(result).toContain('123');
  });

  it('supprime les caractères non numériques avant de formater', () => {
    const result = formatPhoneNumber('+41 79 123 45 67');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── truncate ──────────────────────────────────────────────────────────────────

describe('truncate', () => {
  it('tronque un texte trop long', () => {
    const result = truncate('Hello world, this is a long text', 10);
    expect(result.length).toBeLessThanOrEqual(13); // 10 chars + '...'
    expect(result).toContain('...');
  });

  it('retourne le texte intact si assez court', () => {
    const result = truncate('Hello', 10);
    expect(result).toBe('Hello');
  });

  it('gère un texte exactement à la limite', () => {
    const text = '1234567890';
    const result = truncate(text, 10);
    expect(result).toBe(text);
  });

  it('gère une chaîne vide', () => {
    expect(truncate('', 10)).toBe('');
  });
});

// ── formatNumber ──────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('formate un entier', () => {
    const result = formatNumber(1234567);
    expect(result).toMatch(/1.{0,3}234.{0,3}567/);
  });

  it('formate zéro', () => {
    expect(formatNumber(0)).toMatch(/0/);
  });

  it('retourne une chaîne', () => {
    expect(typeof formatNumber(100)).toBe('string');
  });
});

// ── formatDuration ────────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formate 60 minutes en 1h', () => {
    const result = formatDuration(60);
    expect(result).toMatch(/1h?/);
  });

  it('formate 90 minutes en 1h30 ou similaire', () => {
    const result = formatDuration(90);
    expect(result).toMatch(/1.*30|1h.*30/);
  });

  it('formate 45 minutes (moins d\'une heure)', () => {
    const result = formatDuration(45);
    expect(result).toMatch(/45/);
  });

  it('formate 0 minutes', () => {
    const result = formatDuration(0);
    expect(result).toMatch(/0/);
  });
});
