import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CRMWorld } from '../world';
import { CRMDashboardPage } from '../../src/pages/CRMDashboardPage';
import config from '../../src/config';

/**
 * Common CRM steps shared across all entity step files.
 * Entity-specific steps live in crm/<entity>.steps.ts
 */

// ── Background ───────────────────────────────────────────────────────────────

Given('I am logged into CRM', async function (this: CRMWorld) {
  // Session is loaded via storageState in hooks.ts — just verify CRM is accessible
  await this.page.goto(config.crm.orgUrl, { waitUntil: 'domcontentloaded' });
  const dashboard = new CRMDashboardPage(this.page);
  await dashboard.waitForCRMLoad(60000);
  this.logger.info('CRM session verified');
});

// ── Command Bar ───────────────────────────────────────────────────────────────

When('I click New', async function (this: CRMWorld) {
  const dashboard = new CRMDashboardPage(this.page);
  await dashboard.clickNew();
});

When('I click Save', async function (this: CRMWorld) {
  const dashboard = new CRMDashboardPage(this.page);
  await dashboard.clickSave();
});

When('I click Save without filling any fields', async function (this: CRMWorld) {
  const dashboard = new CRMDashboardPage(this.page);
  // Click save directly without filling anything
  const saveBtn = this.page.locator('[data-id="save-command"], button[aria-label="Save"]').first();
  await saveBtn.click();
  await this.page.waitForTimeout(1000); // brief wait for validation to appear
});

When('I click Delete and confirm', async function (this: CRMWorld) {
  const dashboard = new CRMDashboardPage(this.page);
  await dashboard.clickDelete();
});

// ── Shared Assertions ────────────────────────────────────────────────────────

Then('the {word} should be saved successfully', async function (this: CRMWorld, entityName: string) {
  const dashboard = new CRMDashboardPage(this.page);
  await dashboard.waitForSuccessNotification();
  const notification = this.page.locator(
    '[data-id="notify_content"], .ms-MessageBar--success, [role="alert"]'
  ).first();
  await expect(notification).toBeVisible({ timeout: 15000 });
  this.logger.info(`${entityName} saved successfully`);
});

Then('I should see a required field validation error for {word}', async function (this: CRMWorld, fieldLabel: string) {
  // CRM shows inline error messages for required fields
  const errorLocator = this.page.locator(
    `.ms-TextField-errorMessage, [aria-label*="required"], [id*="Error"]`
  ).first();
  await expect(errorLocator).toBeVisible({ timeout: 10000 });
  this.logger.info(`Validation error visible for: ${fieldLabel}`);
});
