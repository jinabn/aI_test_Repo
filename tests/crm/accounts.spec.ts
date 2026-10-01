/**
 * accounts.spec.ts
 *
 * Example tests for the Accounts entity.
 */

import { test, expect } from '@playwright/test';
import { AccountsPage } from '../../src/pages/crm/AccountsPage';
import { TestDataHelper } from '../../src/utils/testDataHelper';

test.describe('Accounts — Core CRUD', () => {

  test('Create a new account with required fields', async ({ page }) => {
    const accounts = new AccountsPage(page);
    const name = TestDataHelper.accountName();

    await accounts.createAccount({ name });
    await accounts.assertAccountDetails({ name });
  });

  test('Create an account with full details', async ({ page }) => {
    const accounts = new AccountsPage(page);
    const name = TestDataHelper.accountName('FullAccount');
    const phone = TestDataHelper.phone();
    const website = TestDataHelper.url();

    await accounts.createAccount({
      name,
      phone,
      website,
      numberOfEmployees: '250',
      description: TestDataHelper.description('account'),
      address: {
        street: '456 Corporate Blvd',
        city: 'Dallas',
        state: 'TX',
        zip: '75201',
        country: 'United States',
      },
    });

    await accounts.assertAccountDetails({ name, phone, website });
  });

  test('Update an existing account phone number', async ({ page }) => {
    const accounts = new AccountsPage(page);
    const name = TestDataHelper.accountName('UpdateAccount');
    const newPhone = TestDataHelper.phone();

    await accounts.createAccount({ name, phone: TestDataHelper.phone() });
    await accounts.openAccount(name);
    await accounts.fillAccountForm({ name, phone: newPhone });
    await accounts.clickSave();
    await accounts.assertSaveSuccess();

    await accounts.assertAccountDetails({ phone: newPhone });
  });

  test('Delete an account', async ({ page }) => {
    const accounts = new AccountsPage(page);
    const name = TestDataHelper.accountName('DeleteAccount');

    await accounts.createAccount({ name });
    await accounts.openAccount(name);
    await accounts.clickDelete();
    await accounts.assertAccountNotExists(name);
  });

  test('Account name is required', async ({ page }) => {
    const accounts = new AccountsPage(page);
    await accounts.assertNameRequired();
  });

  test('Search for an account by name', async ({ page }) => {
    const accounts = new AccountsPage(page);
    const name = TestDataHelper.accountName('SearchAccount');

    await accounts.createAccount({ name });
    await accounts.navigateToAccounts();
    await accounts.searchInGrid(name);

    const row = page.locator(`[data-automationid="DetailsRow"]:has-text("${name}")`).first();
    await expect(row).toBeVisible();
  });
});
