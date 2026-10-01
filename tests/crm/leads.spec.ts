/**
 * leads.spec.ts
 *
 * Example tests for the Leads entity.
 * Covers: create, qualify, disqualify, and validation.
 */

import { test, expect } from '@playwright/test';
import { LeadsPage } from '../../src/pages/crm/LeadsPage';
import { TestDataHelper } from '../../src/utils/testDataHelper';

test.describe('Leads — Core Workflow', () => {

  test('Create a new lead with required fields', async ({ page }) => {
    const leads = new LeadsPage(page);
    const { firstName, lastName, companyName } = TestDataHelper.leadName();

    await leads.createLead({ firstName, lastName, companyName });
    await leads.assertLeadDetails({ firstName, lastName, companyName });
  });

  test('Create a lead with all fields', async ({ page }) => {
    const leads = new LeadsPage(page);
    const { firstName, lastName, companyName } = TestDataHelper.leadName('FullLead');
    const email = TestDataHelper.email();

    await leads.createLead({
      firstName,
      lastName,
      companyName,
      email,
      phone: TestDataHelper.phone(),
      jobTitle: 'Director',
      website: TestDataHelper.url(),
      description: TestDataHelper.description('lead'),
    });

    await leads.assertLeadDetails({ firstName, lastName, companyName, email });
  });

  test('Qualify a lead — creates Contact, Account, and Opportunity', async ({ page }) => {
    const leads = new LeadsPage(page);
    const { firstName, lastName, companyName } = TestDataHelper.leadName('Qualify');

    await leads.createLead({ firstName, lastName, companyName });
    await leads.qualifyLead(lastName, {
      createContact: true,
      createAccount: true,
      createOpportunity: true,
    });

    await leads.assertLeadIsQualified();
  });

  test('Disqualify a lead with a reason', async ({ page }) => {
    const leads = new LeadsPage(page);
    const { firstName, lastName, companyName } = TestDataHelper.leadName('Disqualify');

    await leads.createLead({ firstName, lastName, companyName });
    await leads.disqualifyLead(lastName, 'Cannot Contact');

    await leads.assertLeadIsDisqualified();
  });

  test('Lead validation — Last Name and Company Name are required', async ({ page }) => {
    const leads = new LeadsPage(page);
    await leads.assertRequiredFieldsValidation();
  });

  test('Search for a lead by last name', async ({ page }) => {
    const leads = new LeadsPage(page);
    const { firstName, lastName, companyName } = TestDataHelper.leadName('SearchLead');

    await leads.createLead({ firstName, lastName, companyName });
    await leads.navigateToLeads();
    await leads.searchInGrid(lastName);

    const row = page.locator(`[data-automationid="DetailsRow"]:has-text("${lastName}")`).first();
    await expect(row).toBeVisible();
  });
});
