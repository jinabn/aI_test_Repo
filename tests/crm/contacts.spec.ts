/**
 * contacts.spec.ts
 *
 * Example hand-authored test file for the Contacts entity.
 * Also serves as the template for AI-generated contact tests.
 *
 * AI-generated tests from Azure DevOps user stories will follow
 * the same structure — produced by: npm run sync:azure -- --id <workItemId>
 */

import { test, expect } from '@playwright/test';
import { ContactsPage } from '../../src/pages/crm/ContactsPage';
import { TestDataHelper } from '../../src/utils/testDataHelper';
import { ScreenshotHelper } from '../../src/utils/screenshotHelper';

test.describe('Contacts — Core CRUD', () => {
  // ─── Create ─────────────────────────────────────────────────────────────────

  test('Create a new contact with required fields only', async ({ page }, testInfo) => {
    const contacts = new ContactsPage(page);
    const screenshots = new ScreenshotHelper(page, testInfo);
    const { firstName, lastName } = TestDataHelper.contactName('Smith');

    await contacts.navigateToContacts();
    await contacts.clickNew();

    await contacts.fillContactForm({ firstName, lastName });
    await screenshots.capture('contact-form-filled');

    await contacts.clickSave();
    await contacts.assertSaveSuccess();

    await screenshots.capture('contact-saved');
    await contacts.assertContactDetails({ firstName, lastName });
  });

  test('Create a contact with all fields', async ({ page }) => {
    const contacts = new ContactsPage(page);
    const { firstName, lastName } = TestDataHelper.contactName('Johnson');
    const email = TestDataHelper.email();
    const phone = TestDataHelper.phone();

    await contacts.createContact({
      firstName,
      lastName,
      email,
      phone,
      jobTitle: 'QA Engineer',
      address: {
        street: '123 Test Street',
        city: 'Testville',
        state: 'TX',
        zip: '75001',
        country: 'United States',
      },
    });

    await contacts.assertContactDetails({ firstName, lastName, email, phone });
  });

  // ─── Read / Search ─────────────────────────────────────────────────────────

  test('Search for an existing contact by last name', async ({ page }) => {
    const contacts = new ContactsPage(page);
    const { firstName, lastName } = TestDataHelper.contactName('SearchTest');

    // First create the record
    await contacts.createContact({ firstName, lastName });

    // Then search for it
    await contacts.navigateToContacts();
    await contacts.searchInGrid(lastName);

    const row = page.locator(`[data-automationid="DetailsRow"]:has-text("${lastName}")`).first();
    await expect(row).toBeVisible();
  });

  test('Open a contact record and verify field values', async ({ page }) => {
    const contacts = new ContactsPage(page);
    const { firstName, lastName } = TestDataHelper.contactName('OpenTest');
    const email = TestDataHelper.email();

    await contacts.createContact({ firstName, lastName, email });
    await contacts.openContact(lastName);

    await contacts.assertContactDetails({ firstName, lastName, email });
  });

  // ─── Update ─────────────────────────────────────────────────────────────────

  test('Update an existing contact job title', async ({ page }) => {
    const contacts = new ContactsPage(page);
    const { firstName, lastName } = TestDataHelper.contactName('UpdateTest');

    await contacts.createContact({ firstName, lastName, jobTitle: 'Developer' });
    await contacts.openContact(lastName);

    await contacts.fillContactForm({ lastName, jobTitle: 'Senior Developer' });
    await contacts.clickSave();
    await contacts.assertSaveSuccess();

    await contacts.assertContactDetails({ jobTitle: 'Senior Developer' });
  });

  // ─── Delete ─────────────────────────────────────────────────────────────────

  test('Delete a contact', async ({ page }) => {
    const contacts = new ContactsPage(page);
    const { firstName, lastName } = TestDataHelper.contactName('DeleteTest');

    await contacts.createContact({ firstName, lastName });
    await contacts.openContact(lastName);
    await contacts.clickDelete();

    // After delete, verify the contact no longer appears in grid
    await contacts.assertContactNotExists(lastName);
  });

  // ─── Validation ─────────────────────────────────────────────────────────────

  test('Saving a contact without Last Name shows validation error', async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.assertRequiredFieldsValidation();
  });

  test('Contact grid shows correct columns', async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.navigateToContacts();
    await contacts.waitForGrid();

    // Standard CRM contact grid columns
    await expect(page.locator('th:has-text("Full Name"), [title="Full Name"]').first()).toBeVisible();
    await expect(page.locator('th:has-text("Email"), [title="Email"]').first()).toBeVisible();
  });
});
