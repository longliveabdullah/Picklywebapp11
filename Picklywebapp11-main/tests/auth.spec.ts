import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function acceptSignupAndOnboardingTerms(page: Page) {
  await page.getByTestId('signup-terms-checkbox').click();
  await page.click('button[type="submit"]');
  await page.waitForURL('**/onboarding/terms', { timeout: 15000 });
  await page.getByTestId('onboarding-terms-checkbox').click();
  await page.getByTestId('onboarding-terms-continue').click();
  await page.waitForURL('**/onboarding/age', { timeout: 15000 });
}

test.describe('Authentication', () => {
  const email = `testuser-${Date.now()}@example.com`;
  const password = 'password123';

  test('should allow a user to sign up and see the onboarding page', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await acceptSignupAndOnboardingTerms(page);
    expect(page.url()).toContain('/onboarding/age');
  });

  test('should allow a user to sign out', async ({ page }) => {
    // First, sign up a new user
    await page.goto('/signup');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await acceptSignupAndOnboardingTerms(page);

    // Dev-only sign-out control is on pages that render Header (e.g. Premium).
    await page.goto('/premium');

    // Click the signout button
    await page.click('[data-testid="signout-button"]');
    await page.waitForURL('**/');
    expect(page.url()).not.toContain('/home');
  });

  test('should allow a user to sign in', async ({ page }) => {
    // First, sign up a new user
    await page.goto('/signup');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await acceptSignupAndOnboardingTerms(page);

    // Sign out
    await page.goto('/premium');
    await page.click('[data-testid="signout-button"]');
    await page.waitForURL('**/');

    // Sign in
    await page.goto('/');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/onboarding/terms');
    expect(page.url()).toContain('/onboarding/terms');
  });

  test('should not allow an unauthenticated user to access protected routes', async ({ page }) => {
    await page.goto('/home');
    await page.waitForURL('**/');
    expect(page.url()).not.toContain('/home');
  });
});
