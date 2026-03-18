import { describe, it, expect } from 'vitest';
import { getMonthName, formatSwissDate, getDaysDifference } from '../utils/dateUtils';

describe('getMonthName', () => {
  it('retourne le nom correct pour chaque mois', () => {
    const expected = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];
    expected.forEach((name, index) => {
      expect(getMonthName(index)).toBe(name);
    });
  });

  it("retourne une chaîne vide pour un index hors bornes", () => {
    expect(getMonthName(12)).toBe('');
    expect(getMonthName(-1)).toBe('');
  });
});

describe('formatSwissDate', () => {
  it('formate une date ISO string en format suisse', () => {
    // 2024-03-15 → 15.03.2024
    const result = formatSwissDate('2024-03-15');
    expect(result).toMatch(/15[.\-/]03[.\-/]2024|15\.03\.2024/);
  });

  it('formate un objet Date en format suisse', () => {
    const date = new Date(2024, 11, 25); // 25 décembre 2024
    const result = formatSwissDate(date);
    expect(result).toMatch(/25/);
    expect(result).toMatch(/2024/);
  });

  it("n'utilise pas de slash (remplacé par point)", () => {
    const result = formatSwissDate('2024-01-01');
    expect(result).not.toContain('/');
  });
});

describe('getDaysDifference', () => {
  it('calcule 1 jour de différence', () => {
    const d1 = new Date(2024, 0, 1); // 1er jan 2024
    const d2 = new Date(2024, 0, 2); // 2 jan 2024
    expect(getDaysDifference(d1, d2)).toBe(1);
  });

  it('calcule 30 jours de différence', () => {
    const d1 = new Date(2024, 0, 1);
    const d2 = new Date(2024, 0, 31);
    expect(getDaysDifference(d1, d2)).toBe(30);
  });

  it('retourne 0 pour deux dates identiques', () => {
    const d = new Date(2024, 5, 15);
    expect(getDaysDifference(d, d)).toBe(0);
  });

  it("calcule l'ordre inversé (valeur absolue)", () => {
    const d1 = new Date(2024, 0, 10);
    const d2 = new Date(2024, 0, 1);
    expect(getDaysDifference(d1, d2)).toBe(9);
  });

  it('calcule correctement sur plusieurs mois', () => {
    const d1 = new Date(2024, 0, 1);   // 1 jan
    const d2 = new Date(2024, 11, 31); // 31 déc (année bissextile 2024)
    const diff = getDaysDifference(d1, d2);
    expect(diff).toBe(365); // 2024 is a leap year: 366 - 1 = 365
  });
});
