import { Page } from '@playwright/test';
import { CRMDashboardPage } from '../CRMDashboardPage';

export interface LeadData {
  firstName?: string;
  lastName: string;
  companyName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  leadSource?: string;
  leadStatus?: string;
  rating?: string;
  industry?: string;
  website?: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

export interface QualifyLeadOptions {
  createContact?: boolean;
  createAccount?: boolean;
  createOpportunity?: boolean;
}

/**
 * LeadsPage — all interactions with the Leads entity in Dynamics CRM.
 */
export class LeadsPage extends CRMDashboardPage {
  // ─── Locators ──────────────────────────────────────────────────────────────
  private readonly firstNameField = this.page.locator('[data-id="firstname"] input');
  private readonly lastNameField = this.page.locator('[data-id="lastname"] input');
  private readonly companyNameField = this.page.locator('[data-id="companyname"] input');
  private readonly emailField = this.page.locator('[data-id="emailaddress1"] input');
  private readonly phoneField = this.page.locator('[data-id="telephone1"] input');
  private readonly jobTitleField = this.page.locator('[data-id="jobtitle"] input');
  private readonly websiteField = this.page.locator('[data-id="websiteurl"] input');
  private readonly descriptionField = this.page.locator('[data-id="description"] textarea');
  private readonly streetField = this.page.locator('[data-id="address1_line1"] input');
  private readonly cityField = this.page.locator('[data-id="address1_city"] input');
  private readonly stateField = this.page.locator('[data-id="address1_stateorprovince"] input');
  private readonly zipField = this.page.locator('[data-id="address1_postalcode"] input');
  private readonly countryField = this.page.locator('[data-id="address1_country"] input');

  // Qualify Lead dialog
  private readonly qualifyButton = this.page.locator('button[aria-label="Qualify"], button:has-text("Qualify")').first();
  private readonly qualifyDialog = this.page.locator('[aria-label="Qualify Lead"], [data-id="qualifyLeadDialog"]').first();
  private readonly createContactCheckbox = this.page.locator('[data-id="createContact"] input[type="checkbox"], label:has-text("Contact") input').first();
  private readonly createAccountCheckbox = this.page.locator('[data-id="createAccount"] input[type="checkbox"], label:has-text("Account") input').first();
  private readonly createOpportunityCheckbox = this.page.locator('[data-id="createOpportunity"] input[type="checkbox"], label:has-text("Opportunity") input').first();
  private readonly qualifyOkButton = this.page.locator('[data-id="qualifyLeadDialog"] button:has-text("OK"), button[aria-label="OK"]').first();

  // Disqualify
  private readonly disqualifyButton = this.page.locator('button[aria-label="Disqualify"], button:has-text("Disqualify")').first();
  private readonly disqualifyReasonField = this.page.locator('[data-id="statuscode"] select, [data-id="statuscode"]').first();
  private readonly disqualifyOkButton = this.page.locator('button:has-text("OK"), [data-id="ok_id"]').first();

  // Status indicator
  private readonly leadStatusBadge = this.page.locator('[data-id="header_statuscontrol"], .ms-crm-statusbar').first();

  constructor(page: Page) {
    super(page);
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  async navigateToLeads(): Promise<void> {
    this.logger.info('Navigating to Leads list');
    await this.navigateToEntityList('leads');
    await this.waitForGrid();
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * Create a new lead and save it.
   */
  async createLead(data: LeadData): Promise<void> {
    this.logger.info(`Creating lead: ${data.firstName ?? ''} ${data.lastName} @ ${data.companyName}`);
    await this.navigateToLeads();
    await this.clickNew();
    await this.fillLeadForm(data);
    await this.clickSave();
    await this.assertSaveSuccess();
    this.logger.info(`Lead created: ${data.lastName}`);
  }

  /**
   * Fill lead form fields.
   */
  async fillLeadForm(data: LeadData): Promise<void> {
    if (data.firstName !== undefined) {
      await this.fillInput(this.firstNameField, data.firstName);
    }
    await this.fillInput(this.lastNameField, data.lastName);
    await this.fillInput(this.companyNameField, data.companyName);

    if (data.email) await this.fillInput(this.emailField, data.email);
    if (data.phone) await this.fillInput(this.phoneField, data.phone);
    if (data.jobTitle) await this.fillInput(this.jobTitleField, data.jobTitle);
    if (data.website) await this.fillInput(this.websiteField, data.website);
    if (data.description) await this.fillInput(this.descriptionField, data.description);

    if (data.leadSource) {
      await this.selectOptionSetField('leadsourcecode', data.leadSource);
    }
    if (data.rating) {
      await this.selectOptionSetField('rating', data.rating);
    }
    if (data.industry) {
      await this.selectOptionSetField('industrycode', data.industry);
    }

    if (data.address) {
      const addr = data.address;
      if (addr.street) await this.fillInput(this.streetField, addr.street);
      if (addr.city) await this.fillInput(this.cityField, addr.city);
      if (addr.state) await this.fillInput(this.stateField, addr.state);
      if (addr.zip) await this.fillInput(this.zipField, addr.zip);
      if (addr.country) await this.fillInput(this.countryField, addr.country);
    }
  }

  /**
   * Search for a lead by name.
   */
  async searchLead(name: string): Promise<void> {
    this.logger.info(`Searching for lead: ${name}`);
    await this.navigateToLeads();
    await this.searchInGrid(name);
  }

  /**
   * Open a lead record by name.
   */
  async openLead(name: string): Promise<void> {
    this.logger.info(`Opening lead: ${name}`);
    await this.navigateToLeads();
    await this.clickGridRowByText(name);
    await this.waitForCRMLoad();
  }

  /**
   * Update an existing lead.
   */
  async updateLead(name: string, updates: Partial<LeadData>): Promise<void> {
    this.logger.info(`Updating lead: ${name}`);
    await this.openLead(name);
    await this.fillLeadForm({ lastName: name, companyName: '', ...updates });
    await this.clickSave();
    await this.assertSaveSuccess();
  }

  /**
   * Delete a lead by name.
   */
  async deleteLead(name: string): Promise<void> {
    this.logger.info(`Deleting lead: ${name}`);
    await this.openLead(name);
    await this.clickDelete();
  }

  // ─── Qualify / Disqualify ──────────────────────────────────────────────────

  /**
   * Qualify a lead — optionally specifying what to create from it.
   * By default creates Contact, Account, and Opportunity.
   */
  async qualifyLead(
    leadName: string,
    options: QualifyLeadOptions = { createContact: true, createAccount: true, createOpportunity: true }
  ): Promise<void> {
    this.logger.info(`Qualifying lead: ${leadName}`);
    await this.openLead(leadName);
    await this.clickElement(this.qualifyButton);

    // Handle the qualify dialog if it appears
    try {
      await this.qualifyDialog.waitFor({ state: 'visible', timeout: 10000 });

      if (options.createContact !== undefined) {
        await this.setCheckbox(this.createContactCheckbox, options.createContact);
      }
      if (options.createAccount !== undefined) {
        await this.setCheckbox(this.createAccountCheckbox, options.createAccount);
      }
      if (options.createOpportunity !== undefined) {
        await this.setCheckbox(this.createOpportunityCheckbox, options.createOpportunity);
      }

      await this.clickElement(this.qualifyOkButton);
    } catch {
      // Dialog may not appear in all CRM configurations
      this.logger.info('Qualify dialog not present — proceeding');
    }

    await this.waitForCRMLoad(60000);
    this.logger.info(`Lead "${leadName}" qualified`);
  }

  /**
   * Disqualify a lead with a reason.
   */
  async disqualifyLead(leadName: string, reason: string): Promise<void> {
    this.logger.info(`Disqualifying lead: ${leadName}, reason: ${reason}`);
    await this.openLead(leadName);
    await this.clickElement(this.disqualifyButton);

    // Select reason from dropdown
    try {
      await this.disqualifyReasonField.waitFor({ state: 'visible', timeout: 10000 });
      await this.selectOptionSetField('statuscode', reason);
      await this.clickElement(this.disqualifyOkButton);
    } catch {
      this.logger.warn('Disqualify dialog not detected');
    }

    await this.waitForCRMLoad();
    this.logger.info(`Lead "${leadName}" disqualified`);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async setCheckbox(locator: import('@playwright/test').Locator, checked: boolean): Promise<void> {
    const isChecked = await locator.isChecked();
    if (isChecked !== checked) {
      await locator.click();
    }
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

  async getLeadStatus(): Promise<string> {
    return await this.getText(this.leadStatusBadge);
  }

  async getLastName(): Promise<string> {
    return await this.getInputValue(this.lastNameField);
  }

  async getCompanyName(): Promise<string> {
    return await this.getInputValue(this.companyNameField);
  }

  // ─── Assertions ────────────────────────────────────────────────────────────

  async assertLeadExists(name: string): Promise<void> {
    await this.navigateToLeads();
    await this.searchInGrid(name);
    const row = this.page.locator(`[data-automationid="DetailsRow"]:has-text("${name}"), tr:has-text("${name}")`).first();
    await this.assertVisible(row, `Lead "${name}" should exist in the grid`);
  }

  async assertLeadNotExists(name: string): Promise<void> {
    await this.navigateToLeads();
    await this.searchInGrid(name);
    const row = this.page.locator(`[data-automationid="DetailsRow"]:has-text("${name}"), tr:has-text("${name}")`).first();
    await this.assertHidden(row);
  }

  async assertLeadDetails(expected: Partial<LeadData>): Promise<void> {
    if (expected.firstName) {
      await this.assertInputValue(this.firstNameField, expected.firstName);
    }
    if (expected.lastName) {
      await this.assertInputValue(this.lastNameField, expected.lastName);
    }
    if (expected.companyName) {
      await this.assertInputValue(this.companyNameField, expected.companyName);
    }
    if (expected.email) {
      await this.assertInputValue(this.emailField, expected.email);
    }
  }

  async assertLeadIsQualified(): Promise<void> {
    const status = await this.getLeadStatus();
    const isQualified = status.toLowerCase().includes('qualified') && !status.toLowerCase().includes('disqualified');
    if (!isQualified) {
      throw new Error(`Expected lead to be Qualified but status was: "${status}"`);
    }
  }

  async assertLeadIsDisqualified(): Promise<void> {
    const status = await this.getLeadStatus();
    if (!status.toLowerCase().includes('disqualified')) {
      throw new Error(`Expected lead to be Disqualified but status was: "${status}"`);
    }
  }

  async assertRequiredFieldsValidation(): Promise<void> {
    await this.navigateToLeads();
    await this.clickNew();
    await this.clickSave();
    const lastNameError = this.page.locator('[data-id="lastname"] .ms-TextField-errorMessage').first();
    const companyError = this.page.locator('[data-id="companyname"] .ms-TextField-errorMessage').first();
    await this.assertVisible(lastNameError);
    await this.assertVisible(companyError);
  }
}
