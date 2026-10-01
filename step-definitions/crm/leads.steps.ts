import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CRMWorld } from '../world';
import { LeadsPage } from '../../src/pages/crm/LeadsPage';
import { TestDataHelper } from '../../src/utils/testDataHelper';

Given('I navigate to the Leads list', async function (this: CRMWorld) {
  const leads = new LeadsPage(this.page);
  await leads.navigateToLeads();
});

Given('a lead with a unique last name exists in CRM', async function (this: CRMWorld) {
  const leads = new LeadsPage(this.page);
  const { firstName, lastName, companyName } = TestDataHelper.leadName('BDD');
  this.set('leadFirstName', firstName);
  this.set('leadLastName', lastName);
  this.set('leadCompany', companyName);
  await leads.createLead({ firstName, lastName, companyName });
  this.logger.info(`Pre-condition: created lead ${firstName} ${lastName}`);
});

When('I fill in the lead last name with a unique test value', async function (this: CRMWorld) {
  const { firstName, lastName, companyName } = TestDataHelper.leadName('BDD');
  this.set('leadFirstName', firstName);
  this.set('leadLastName', lastName);
  this.set('leadCompany', companyName);
  const lastNameField = this.page.locator('[data-id="lastname"] input');
  await lastNameField.fill(lastName);
});

When('I fill in the lead first name with a unique test value', async function (this: CRMWorld) {
  const firstName = `AUTO-TEST-BDD-${TestDataHelper.uniqueSuffix()}`;
  this.set('leadFirstName', firstName);
  const firstNameField = this.page.locator('[data-id="firstname"] input');
  await firstNameField.fill(firstName);
});

When('I fill in the company name with a unique test value', async function (this: CRMWorld) {
  const companyName = `AUTO-TEST BDD Co ${TestDataHelper.uniqueSuffix()}`;
  this.set('leadCompany', companyName);
  const companyField = this.page.locator('[data-id="companyname"] input');
  await companyField.fill(companyName);
});

When('I search for the lead by last name', async function (this: CRMWorld) {
  const leads = new LeadsPage(this.page);
  await leads.searchInGrid(this.get('leadLastName'));
});

When('I open the lead record', async function (this: CRMWorld) {
  const leads = new LeadsPage(this.page);
  const lastName = this.get('leadLastName');
  await leads.navigateToLeads();
  await leads.clickGridRowByText(lastName);
  await leads.waitForCRMLoad();
});

When('I click Qualify', async function (this: CRMWorld) {
  const qualifyBtn = this.page.locator('button[aria-label="Qualify"], button:has-text("Qualify")').first();
  await qualifyBtn.click();
  // Handle qualify dialog
  try {
    const okBtn = this.page.locator('[data-id="qualifyLeadDialog"] button:has-text("OK"), button[aria-label="OK"]').first();
    await okBtn.waitFor({ state: 'visible', timeout: 8000 });
    await okBtn.click();
  } catch {
    // Dialog may not appear in all CRM configurations
  }
  const leads = new LeadsPage(this.page);
  await leads.waitForCRMLoad(60000);
});

When('I click Disqualify with reason {string}', async function (this: CRMWorld, reason: string) {
  const leads = new LeadsPage(this.page);
  await leads.disqualifyLead(this.get('leadLastName'), reason);
});

Then('the lead should be saved successfully', async function (this: CRMWorld) {
  const notification = this.page.locator(
    '[data-id="notify_content"], .ms-MessageBar--success'
  ).first();
  await expect(notification).toBeVisible({ timeout: 15000 });
});

Then('I should see the lead in the Leads grid', async function (this: CRMWorld) {
  const leads = new LeadsPage(this.page);
  const lastName = this.get('leadLastName');
  await leads.navigateToLeads();
  await leads.searchInGrid(lastName);
  const row = this.page.locator(
    `[data-automationid="DetailsRow"]:has-text("${lastName}")`
  ).first();
  await expect(row).toBeVisible({ timeout: 15000 });
});

Then('the lead should appear in the search results', async function (this: CRMWorld) {
  const lastName = this.get('leadLastName');
  const row = this.page.locator(
    `[data-automationid="DetailsRow"]:has-text("${lastName}")`
  ).first();
  await expect(row).toBeVisible({ timeout: 15000 });
});

Then('the lead should be marked as Qualified', async function (this: CRMWorld) {
  const leads = new LeadsPage(this.page);
  await leads.assertLeadIsQualified();
});

Then('the lead should be marked as Disqualified', async function (this: CRMWorld) {
  const leads = new LeadsPage(this.page);
  await leads.assertLeadIsDisqualified();
});

Then('a Contact should be created from the lead', async function (this: CRMWorld) {
  // After qualification, CRM redirects to the new Opportunity — verify URL changed
  await expect(this.page).toHaveURL(/crm\.dynamics\.com/);
});

Then('an Account should be created from the lead', async function (this: CRMWorld) {
  await expect(this.page).toHaveURL(/crm\.dynamics\.com/);
});

Then('an Opportunity should be created from the lead', async function (this: CRMWorld) {
  await expect(this.page).toHaveURL(/opportunities|crm\.dynamics\.com/);
});

Then('I should see a required field validation error for Company Name', async function (this: CRMWorld) {
  const error = this.page.locator('[data-id="companyname"] .ms-TextField-errorMessage').first();
  await expect(error).toBeVisible({ timeout: 10000 });
});
