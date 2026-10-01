import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CRMWorld } from '../world';
import { AccountsPage } from '../../src/pages/crm/AccountsPage';
import { TestDataHelper } from '../../src/utils/testDataHelper';

Given('I navigate to the Accounts list', async function (this: CRMWorld) {
  const accounts = new AccountsPage(this.page);
  await accounts.navigateToAccounts();
});

Given('an account with a unique name exists in CRM', async function (this: CRMWorld) {
  const accounts = new AccountsPage(this.page);
  const name = TestDataHelper.accountName('BDD');
  this.set('accountName', name);
  await accounts.createAccount({ name });
  this.logger.info(`Pre-condition: created account ${name}`);
});

When('I fill in the account name with a unique test value', async function (this: CRMWorld) {
  const name = TestDataHelper.accountName('BDD');
  this.set('accountName', name);
  const nameField = this.page.locator('[data-id="name"] input');
  await nameField.fill(name);
});

When('I fill in the website with a unique test URL', async function (this: CRMWorld) {
  const url = TestDataHelper.url();
  this.set('accountWebsite', url);
  const websiteField = this.page.locator('[data-id="websiteurl"] input');
  await websiteField.fill(url);
});

When('I search for the account by name', async function (this: CRMWorld) {
  const accounts = new AccountsPage(this.page);
  await accounts.searchInGrid(this.get('accountName'));
});

When('I open the account record', async function (this: CRMWorld) {
  const accounts = new AccountsPage(this.page);
  const name = this.get('accountName');
  await accounts.navigateToAccounts();
  await accounts.clickGridRowByText(name);
  await accounts.waitForCRMLoad();
});

Then('the account should be saved successfully', async function (this: CRMWorld) {
  const notification = this.page.locator(
    '[data-id="notify_content"], .ms-MessageBar--success'
  ).first();
  await expect(notification).toBeVisible({ timeout: 15000 });
});

Then('I should see the account in the Accounts grid', async function (this: CRMWorld) {
  const accounts = new AccountsPage(this.page);
  const name = this.get('accountName');
  await accounts.navigateToAccounts();
  await accounts.searchInGrid(name);
  const row = this.page.locator(
    `[data-automationid="DetailsRow"]:has-text("${name}")`
  ).first();
  await expect(row).toBeVisible({ timeout: 15000 });
});

Then('the account should appear in the search results', async function (this: CRMWorld) {
  const name = this.get('accountName');
  const row = this.page.locator(
    `[data-automationid="DetailsRow"]:has-text("${name}")`
  ).first();
  await expect(row).toBeVisible({ timeout: 15000 });
});

Then('the account should no longer appear in the Accounts grid', async function (this: CRMWorld) {
  const accounts = new AccountsPage(this.page);
  const name = this.get('accountName');
  await accounts.navigateToAccounts();
  await accounts.searchInGrid(name);
  const row = this.page.locator(
    `[data-automationid="DetailsRow"]:has-text("${name}")`
  ).first();
  await expect(row).toBeHidden({ timeout: 10000 });
});

Then('I should see a required field validation error for Account Name', async function (this: CRMWorld) {
  const error = this.page.locator('[data-id="name"] .ms-TextField-errorMessage').first();
  await expect(error).toBeVisible({ timeout: 10000 });
});
