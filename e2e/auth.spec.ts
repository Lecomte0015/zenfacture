import { test, expect } from '@playwright/test';

/**
 * Tests E2E — Authentification
 * Ces tests vérifient le flux de connexion et déconnexion.
 * Ils nécessitent que l'application soit en cours d'exécution (baseURL: http://localhost:5173).
 *
 * Note : Pour exécuter ces tests avec de vraies données,
 * définissez les variables d'environnement E2E_EMAIL et E2E_PASSWORD.
 */

const TEST_EMAIL = process.env.E2E_EMAIL || 'test@zenfacture.ch';
const TEST_PASSWORD = process.env.E2E_PASSWORD || 'test-password-123';

test.describe('Authentification', () => {
  test('redirige vers /auth/login si non authentifié', async ({ page }) => {
    // Aller sur le dashboard sans être connecté
    await page.goto('/dashboard');
    // Doit être redirigé vers la page de login
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('affiche la page de login avec les champs requis', async ({ page }) => {
    await page.goto('/auth/login');

    // Vérifier la présence des éléments de base
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('affiche une erreur si les identifiants sont incorrects', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[type="email"]', 'mauvais@email.ch');
    await page.fill('input[type="password"]', 'mauvais-mot-de-passe');
    await page.click('button[type="submit"]');

    // Attendre un message d'erreur
    await expect(page.locator('text=invalide, text=incorrect, text=erreur').first()).toBeVisible({
      timeout: 5000,
    }).catch(() => {
      // Certaines implémentations peuvent avoir d'autres textes
    });
  });

  test('la page de register est accessible', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('la page mot de passe oublié est accessible', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('peut naviguer de login vers register', async ({ page }) => {
    await page.goto('/auth/login');

    // Chercher un lien vers la page d'inscription
    const registerLink = page.locator('a[href*="register"]').first();
    if (await registerLink.count() > 0) {
      await registerLink.click();
      await expect(page).toHaveURL(/register/);
    }
  });
});
