import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Should be on login page
    await expect(page).toHaveURL(/.*login/);
    
    // Fill in login form
    await page.fill('input[type="text"]', 'super');
    await page.fill('input[type="password"]', '123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Should see welcome message or user info
    await expect(page.locator('body')).toContainText('super', { timeout: 5000 });
  });

  test('should fail login with invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill in wrong credentials
    await page.fill('input[type="text"]', 'wronguser');
    await page.fill('input[type="password"]', 'wrongpass');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('body')).toContainText(/invalid|error|failed/i, { timeout: 5000 });
    
    // Should still be on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/');
    
    // Login first
    await page.fill('input[type="text"]', 'super');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Wait a moment for page to fully load
    await page.waitForTimeout(1000);
    
    // Try to find and open user dropdown menu first
    const dropdownToggle = page.locator('button.dropdown-toggle, [data-bs-toggle="dropdown"], .nav-link.dropdown-toggle').first();
    if (await dropdownToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dropdownToggle.click();
      await page.waitForTimeout(500);
    }
    
    // Now find and click logout button (should be visible after dropdown opens)
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), [class*="logout"]').first();
    await logoutButton.click({ timeout: 5000 });
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });
});
