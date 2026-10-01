import { Page } from '@playwright/test';
import { CRMDashboardPage } from '../CRMDashboardPage';

export interface ContactData {
  firstName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  accountName?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

/**
 * ContactsPage — all interactions with the Contacts entity in Dynamics CRM.
 */
export class ContactsPage extends CRMDashboardPage {
  // ─── Locators ──────────────────────────────────────────────────────────────
  private readonly firstNameField = this.page.locator('[data-id="firstname"] input');
  private readonly lastNameField = this.page.locator('[data-id="lastname"] input');
  private readonly emailField = this.page.locator('[data-id="emailaddress1"] input');
  private readonly phoneField = this.page.locator('[data-id="telephone1"] input');
  private readonly jobTitleField = this.page.locator('[data-id="jobtitle"] input');
  private readonly accountNameField = this.page.locator('[data-id="parentcustomerid"] input');
  private readonly streetField = this.page.locator('[data-id="address1_line1"] input');
  private readonly cityField = this.page.locator('[data-id="address1_city"] input');
  private readonly stateField = this.page.locator('[data-id="address1_stateorprovince"] input');
  private readonly zipField = this.page.locator('[data-id="address1_postalcode"] input');
  private readonly countryField = this.page.locator('[data-id="address1_country"] input');

  // Header / summary fields (read-only display)
  private readonly contactFullNameHeader = this.page.locator('[data-id="header_title"] h1, .contact-header-name').first();
  private readonly emailDisplay = this.page.locator('[data-id="emailaddress1"] [title]').first();

  constructor(page: Page) {
    super(page);
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  async navigateToContacts(): Promise<void> {
    this.logger.info('Navigating to Contacts list');
    await this.navigateToEntityList('contacts');
    await this.waitForGrid();
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * Create a new contact by filling the New Contact form and saving.
   */
  async createContact(data: ContactData): Promise<void> {
    this.logger.info(`Creating contact: ${data.firstName ?? ''} ${data.lastName}`);

    await this.navigateToContacts();
    await this.clickNew();

    await this.fillContactForm(data);
    await this.clickSave();
    await this.assertSaveSuccess();

    this.logger.info(`Contact created: ${data.firstName ?? ''} ${data.lastName}`);
  }

  /**
   * Fill all provided fields on the Contact form.
   */
  async fillContactForm(data: ContactData): Promise<void> {
    if (data.firstName !== undefined) {
      await this.fillInput(this.firstNameField, data.firstName);
    }
    await this.fillInput(this.lastNameField, data.lastName);

    if (data.email) await this.fillInput(this.emailField, data.email);
    if (data.phone) await this.fillInput(this.phoneField, data.phone);
    if (data.jobTitle) await this.fillInput(this.jobTitleField, data.jobTitle);

    if (data.accountName) {
      await this.fillLookupField('parentcustomerid', data.accountName);
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
   * Search for a contact by name using the grid search.
   */
  async searchContact(name: string): Promise<void> {
    this.logger.info(`Searching for contact: ${name}`);
    await this.navigateToContacts();
    await this.searchInGrid(name);
  }

  /**
   * Open a contact record by clicking its name in the grid.
   */
  async openContact(name: string): Promise<void> {
    this.logger.info(`Opening contact: ${name}`);
    await this.navigateToContacts();
    await this.clickGridRowByText(name);
    await this.waitForCRMLoad();
  }

  /**
   * Update an existing contact — opens it, changes fields, saves.
   */
  async updateContact(name: string, updates: Partial<ContactData>): Promise<void> {
    this.logger.info(`Updating contact: ${name}`);
    await this.openContact(name);
    await this.fillContactForm(updates as ContactData);
    await this.clickSave();
    await this.assertSaveSuccess();
  }

  /**
   * Delete a contact by name.
   */
  async deleteContact(name: string): Promise<void> {
    this.logger.info(`Deleting contact: ${name}`);
    await this.openContact(name);
    await this.clickDelete();
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

  async getFirstName(): Promise<string> {
    return await this.getInputValue(this.firstNameField);
  }

  async getLastName(): Promise<string> {
    return await this.getInputValue(this.lastNameField);
  }

  async getEmail(): Promise<string> {
    return await this.getInputValue(this.emailField);
  }

  async getPhone(): Promise<string> {
    return await this.getInputValue(this.phoneField);
  }

  // ─── Assertions ────────────────────────────────────────────────────────────

  async assertContactExists(name: string): Promise<void> {
    await this.navigateToContacts();
    await this.searchInGrid(name);
    const row = this.page.locator(`[data-automationid="DetailsRow"]:has-text("${name}"), tr:has-text("${name}")`).first();
    await this.assertVisible(row, `Contact "${name}" should exist in the grid`);
  }

  async assertContactNotExists(name: string): Promise<void> {
    await this.navigateToContacts();
    await this.searchInGrid(name);
    const row = this.page.locator(`[data-automationid="DetailsRow"]:has-text("${name}"), tr:has-text("${name}")`).first();
    await this.assertHidden(row);
  }

  async assertContactDetails(expected: Partial<ContactData>): Promise<void> {
    if (expected.firstName) {
      await this.assertInputValue(this.firstNameField, expected.firstName);
    }
    if (expected.lastName) {
      await this.assertInputValue(this.lastNameField, expected.lastName);
    }
    if (expected.email) {
      await this.assertInputValue(this.emailField, expected.email);
    }
    if (expected.phone) {
      await this.assertInputValue(this.phoneField, expected.phone);
    }
    if (expected.jobTitle) {
      await this.assertInputValue(this.jobTitleField, expected.jobTitle);
    }
  }

  async assertRequiredFieldsValidation(): Promise<void> {
    // Submit without required fields — Last Name is required in CRM
    await this.navigateToContacts();
    await this.clickNew();
    await this.clickSave();
    // CRM shows inline validation error for required fields
    const errorIndicator = this.page.locator('[data-id="lastname"] .ms-TextField-errorMessage, [aria-label*="required"]').first();
    await this.assertVisible(errorIndicator);
  }
}
