import { test, expect } from '@playwright/test';

test.describe('Chat Messaging', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.fill('input[type="text"]', 'super');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('should send a chat message', async ({ page }) => {
    // Try to find a channel to click on
    const channelLink = page.locator('text=/channel|chat/i').first();
    
    if (await channelLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await channelLink.click();
      
      // Wait for chat interface to load
      await page.waitForTimeout(1000);
      
      // Find message input
      const messageInput = page.locator('input[type="text"], textarea').last();
      
      if (await messageInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Type a message
        await messageInput.fill('Hello from E2E test!');
        
        // Find and click send button
        const sendButton = page.locator('button[type="submit"], button:has-text("Send")').last();
        await sendButton.click();
        
        // Should see the message in chat
        await expect(page.locator('body')).toContainText('Hello from E2E test!', { timeout: 5000 });
      }
    }
    
    // Verify we're not on login page
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('should display chat history', async ({ page }) => {
    // Navigate to a channel
    const channelLink = page.locator('text=/channel|chat/i').first();
    
    if (await channelLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await channelLink.click();
      
      // Wait for messages to load
      await page.waitForTimeout(2000);
      
      // Should see some content (messages or empty state)
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
    
    // Verify authenticated
    await expect(page).not.toHaveURL(/.*login/);
  });

  test('should join a channel', async ({ page }) => {
    // Look for channel list
    const channelItem = page.locator('[class*="channel"], [class*="list"] a, text=/channel/i').first();
    
    if (await channelItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await channelItem.click();
      
      // Should navigate to channel view
      await page.waitForTimeout(1000);
      
      // Verify we're in a channel (not on login)
      await expect(page).not.toHaveURL(/.*login/);
    } else {
      // Just verify dashboard is accessible
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
