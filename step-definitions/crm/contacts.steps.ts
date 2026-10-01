import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CRMWorld } from '../world';
import { ContactsPage } from '../../src/pages/crm/ContactsPage';
import { TestDataHelper } from '../../src/utils/testDataHelper';

// ── Navigation ────────────────────────────────────────────────────────────────

Given('I navigate to the Contacts list', async function (this: CRMWorld) {
  const contacts = new ContactsPage(this.page);
  await contacts.navigateToContacts();
});

// ── Data setup (Background / Given) ───────────────────────────────────────────

Given('a contact with a unique last name exists in CRM', async function (this: CRMWorld) {
  const contacts = new ContactsPage(this.page);
  const { firstName, lastName } = TestDataHelper.contactName('BDD');
  this.set('contactFirstName', firstName);
  this.set('contactLastName', lastName);

  await contacts.createContact({ firstName, lastName });
  this.logger.info(`Pre-condition: created contact ${firstName} ${lastName}`);
});

// ── Form Fill Steps ────────────────────────────────────────────────────────────

When('I fill in the contact last name with a unique test value', async function (this: CRMWorld) {
  const { firstName, lastName } = TestDataHelper.contactName('BDD');
  this.set('contactFirstName', firstName);
  this.set('contactLastName', lastName);

  const lastNameField = this.page.locator('[data-id="lastname"] input');
  await lastNameField.fill(lastName);
});

When('I fill in the contact first name with a unique test value', async function (this: CRMWorld) {
  const firstName = `AUTO-TEST-BDD-${TestDataHelper.uniqueSuffix()}`;
  this.set('contactFirstName', firstName);
  const firstNameField = this.page.locator('[data-id="firstname"] input');
  await firstNameField.fill(firstName);
});

When('I fill in the email with a unique test email', async function (this: CRMWorld) {
  const email = TestDataHelper.email();
  this.set('contactEmail', email);
  const emailField = this.page.locator('[data-id="emailaddress1"] input');
  await emailField.fill(email);
});

When('I fill in the phone with a unique test phone', async function (this: CRMWorld) {
  const phone = TestDataHelper.phone();
  this.set('contactPhone', phone);
  const phoneField = this.page.locator('[data-id="telephone1"] input');
  await phoneField.fill(phone);
});

When('I fill in the job title with {string}', async function (this: CRMWorld, title: string) {
  const jobTitleField = this.page.locator('[data-id="jobtitle"] input');
  await jobTitleField.fill(title);
  this.set('jobTitle', title);
});

// ── Interaction Steps ─────────────────────────────────────────────────────────

When('I search for the contact by last name', async function (this: CRMWorld) {
  const contacts = new ContactsPage(this.page);
  const lastName = this.get('contactLastName');
  await contacts.searchInGrid(lastName);
});

When('I open the contact record', async function (this: CRMWorld) {
  const contacts = new ContactsPage(this.page);
  const lastName = this.get('contactLastName');
  await contacts.navigateToContacts();
  await contacts.clickGridRowByText(lastName);
  await contacts.waitForCRMLoad();
});

When('I update the job title to {string}', async function (this: CRMWorld, newTitle: string) {
  const jobTitleField = this.page.locator('[data-id="jobtitle"] input');
  await jobTitleField.clear();
  await jobTitleField.fill(newTitle);
  this.set('updatedJobTitle', newTitle);
});

// ── Assertions ────────────────────────────────────────────────────────────────

Then('I should see the contact in the Contacts grid', async function (this: CRMWorld) {
  const contacts = new ContactsPage(this.page);
  const lastName = this.get('contactLastName');
  await contacts.navigateToContacts();
  await contacts.searchInGrid(lastName);
  const row = this.page.locator(
    `[data-automationid="DetailsRow"]:has-text("${lastName}"), tr:has-text("${lastName}")`
  ).first();
  await expect(row).toBeVisible({ timeout: 15000 });
});

Then('the contact should appear in the search results', async function (this: CRMWorld) {
  const lastName = this.get('contactLastName');
  const row = this.page.locator(
    `[data-automationid="DetailsRow"]:has-text("${lastName}"), tr:has-text("${lastName}")`
  ).first();
  await expect(row).toBeVisible({ timeout: 15000 });
});

Then('the job title should display {string}', async function (this: CRMWorld, expectedTitle: string) {
  const jobTitleField = this.page.locator('[data-id="jobtitle"] input');
  await expect(jobTitleField).toHaveValue(expectedTitle);
});

Then('the contact should no longer appear in the Contacts grid', async function (this: CRMWorld) {
  const contacts = new ContactsPage(this.page);
  const lastName = this.get('contactLastName');
  await contacts.navigateToContacts();
  await contacts.searchInGrid(lastName);
  const row = this.page.locator(
    `[data-automationid="DetailsRow"]:has-text("${lastName}"), tr:has-text("${lastName}")`
  ).first();
  await expect(row).toBeHidden({ timeout: 10000 });
});

Then('I should see a required field validation error for Last Name', async function (this: CRMWorld) {
  const error = this.page.locator('[data-id="lastname"] .ms-TextField-errorMessage').first();
  await expect(error).toBeVisible({ timeout: 10000 });
});
