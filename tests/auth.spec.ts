import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  const email = `testuser-${Date.now()}@example.com`;
  const password = 'password123';

  test('should allow a user to sign up and see the onboarding page', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/onboarding/age', { timeout: 10000 });
    expect(page.url()).toContain('/onboarding/age');
  });

  test('should allow a user to sign out', async ({ page }) => {
    // First, sign up a new user
    await page.goto('/signup');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/onboarding/age');

    // For the purpose of this test, I will directly navigate to the home page.
    await page.goto('/home');

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
    await page.click('button[type="submit"]');
    await page.waitForURL('**/onboarding/age');

    // Sign out
    await page.goto('/home');
    await page.click('[data-testid="signout-button"]');
    await page.waitForURL('**/');

    // Sign in
    await page.goto('/');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/onboarding/age');
    expect(page.url()).toContain('/onboarding/age');
  });

  test('should not allow an unauthenticated user to access protected routes', async ({ page }) => {
    await page.goto('/home');
    await page.waitForURL('**/');
    expect(page.url()).not.toContain('/home');
  });
});
