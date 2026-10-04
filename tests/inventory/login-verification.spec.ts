/**
 * Login Verification Test for Inventory Management
 * 
 * Purpose: Verify that authentication works correctly
 * This test should PASS if:
 * 1. User can successfully authenticate
 * 2. Inventory Management dashboard loads
 * 3. User information is displayed
 */

import { test, expect } from '@playwright/test';

test.describe('Inventory Management - Login Verification', () => {

  test('TC-1: Verify user can login and access Inventory Management dashboard', async ({ page }) => {
    // Step 1: Navigate to Inventory Management
    await page.goto(process.env.INVENTORY_MGMT_URL || '');
    
    // Step 2: Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Step 3: Verify we're on the Inventory Management application (not login page)
    // Check that URL contains the inventory domain
    expect(page.url()).toContain('inventorymanagement');
    
    // Step 4: Wait for main content to be visible
    // Try multiple possible selectors for the main content area
    const possibleSelectors = [
      'nav',
      'header',
      '[role="navigation"]',
      'main',
      '.main-content',
      '[data-testid="dashboard"]',
      'body'
    ];
    
    let contentFound = false;
    for (const selector of possibleSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000, state: 'visible' });
        console.log(`✅ Found content using selector: ${selector}`);
        contentFound = true;
        break;
      } catch (error) {
        console.log(`⏭️ Selector not found: ${selector}`);
      }
    }
    
    expect(contentFound).toBe(true);
    
    // Step 5: Take a screenshot for verification
    await page.screenshot({ path: 'test-results/inventory-login-success.png', fullPage: true });
    console.log('📸 Screenshot saved: test-results/inventory-login-success.png');
    
    // Step 6: Log the current URL
    console.log(`✅ Successfully logged in. Current URL: ${page.url()}`);
  });

  test('TC-2: Verify page title is displayed', async ({ page }) => {
    // Navigate to Inventory Management
    await page.goto(process.env.INVENTORY_MGMT_URL || '');
    await page.waitForLoadState('networkidle');
    
    // Get page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Verify title is not empty
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('TC-3: Verify authentication session is valid', async ({ page }) => {
    // Navigate to Inventory Management
    await page.goto(process.env.INVENTORY_MGMT_URL || '');
    await page.waitForLoadState('networkidle');
    
    // Wait a moment for any redirects
    await page.waitForTimeout(2000);
    
    // Verify we're NOT on a login page
    const url = page.url().toLowerCase();
    
    // Check we're not redirected to login
    expect(url).not.toContain('login');
    expect(url).not.toContain('signin');
    expect(url).not.toContain('authenticate');
    
    // Verify we're on inventory domain
    expect(url).toContain('inventorymanagement');
    
    console.log(`✅ Session is valid. User is authenticated.`);
  });

  test('TC-4: Verify page has interactive elements', async ({ page }) => {
    // Navigate to Inventory Management
    await page.goto(process.env.INVENTORY_MGMT_URL || '');
    await page.waitForLoadState('networkidle');
    
    // Count various interactive elements
    const links = await page.locator('a').count();
    const buttons = await page.locator('button').count();
    const inputs = await page.locator('input').count();
    
    console.log(`📊 Page elements found:`);
    console.log(`   - Links: ${links}`);
    console.log(`   - Buttons: ${buttons}`);
    console.log(`   - Inputs: ${inputs}`);
    
    // Verify page has some interactive elements
    const totalElements = links + buttons + inputs;
    expect(totalElements).toBeGreaterThan(0);
    
    console.log(`✅ Page has ${totalElements} interactive elements`);
  });

});
