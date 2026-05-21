import { test, expect } from '@playwright/test';

test('visitor can open the login page from the landing page', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByRole('link', { name: 'Sign In' }).first()).toBeVisible();

  await page.getByRole('link', { name: 'Sign In' }).first().click();

  await expect(page).toHaveURL(/#\/login/);
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  await expect(page.getByPlaceholder('you@university.edu')).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});
