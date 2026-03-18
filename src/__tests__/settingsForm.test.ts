import { describe, it, expect } from 'vitest';
import { orgSchema } from '../pages/SettingsPage';

const validOrg = {
  nom: 'Mon Entreprise Sàrl',
  adresse: 'Route de la Paix 1',
  code_postal: '1000',
  ville: 'Lausanne',
  pays: 'CH',
  email: 'info@monentreprise.ch',
  telephone: '+41 21 000 00 00',
  iban: 'CH5604835012345678009', // IBAN suisse valide (test)
  numero_tva: 'CHE-123.456.789',
  logo_url: '',
  primary_color: '#2563EB',
  header_bg_color: '#F3F4F6',
  font_family: 'helvetica',
  qr_position: 'center',
  address_spacing: 'normal',
};

describe('orgSchema — validation organisation', () => {
  it('accepte une organisation valide', () => {
    const result = orgSchema.safeParse(validOrg);
    expect(result.success).toBe(true);
  });

  it('rejette si le nom est vide', () => {
    const result = orgSchema.safeParse({ ...validOrg, nom: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain('Nom requis');
    }
  });

  it('rejette un email invalide', () => {
    const result = orgSchema.safeParse({ ...validOrg, email: 'pas-un-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain('Email invalide');
    }
  });

  it("accepte un email vide (facultatif)", () => {
    expect(orgSchema.safeParse({ ...validOrg, email: '' }).success).toBe(true);
  });

  it('rejette un IBAN non-suisse', () => {
    const result = orgSchema.safeParse({ ...validOrg, iban: 'DE89370400440532013000' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain('IBAN suisse invalide (format : CH + 19 chiffres)');
    }
  });

  it("accepte un IBAN vide (facultatif)", () => {
    expect(orgSchema.safeParse({ ...validOrg, iban: '' }).success).toBe(true);
  });

  it('rejette un IBAN avec mauvais checksum', () => {
    // IBAN format correct mais checksum invalide
    const result = orgSchema.safeParse({ ...validOrg, iban: 'CH9999999999999999999' });
    expect(result.success).toBe(false);
  });

  it('rejette une couleur hex invalide', () => {
    const result = orgSchema.safeParse({ ...validOrg, primary_color: 'rouge' });
    expect(result.success).toBe(false);
  });

  it('accepte une couleur hex valide', () => {
    expect(orgSchema.safeParse({ ...validOrg, primary_color: '#FF5733' }).success).toBe(true);
  });

  it('accepte une couleur primaire vide', () => {
    expect(orgSchema.safeParse({ ...validOrg, primary_color: '' }).success).toBe(true);
  });
});

// ─── formatIbanDisplay ────────────────────────────────────────────────────────

import { formatIbanDisplay } from '../services/swissQrService';

describe('formatIbanDisplay', () => {
  it('formate un IBAN en groupes de 4', () => {
    const result = formatIbanDisplay('CH5604835012345678009');
    expect(result).toMatch(/CH56 0483 5012 3456 7800 9/);
  });

  it('accepte un IBAN avec espaces existants', () => {
    const result = formatIbanDisplay('CH56 0483 5012 3456 7800 9');
    expect(result).toMatch(/CH56/);
  });

  it('convertit en majuscules', () => {
    const result = formatIbanDisplay('ch5604835012345678009');
    expect(result).toMatch(/CH56/);
  });

  it('retourne une chaîne vide pour une entrée vide', () => {
    expect(formatIbanDisplay('')).toBe('');
  });
});
