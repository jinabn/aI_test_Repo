import { Page } from '@playwright/test';
import { CRMDashboardPage } from '../CRMDashboardPage';

export interface AccountData {
  name: string;
  phone?: string;
  website?: string;
  industry?: string;
  accountType?: string;
  numberOfEmployees?: string;
  annualRevenue?: string;
  description?: string;
  parentAccount?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

/**
 * AccountsPage — all interactions with the Accounts entity in Dynamics CRM.
 */
export class AccountsPage extends CRMDashboardPage {
  // ─── Locators ──────────────────────────────────────────────────────────────
  private readonly accountNameField = this.page.locator('[data-id="name"] input');
  private readonly phoneField = this.page.locator('[data-id="telephone1"] input');
  private readonly websiteField = this.page.locator('[data-id="websiteurl"] input');
  private readonly industryField = this.page.locator('[data-id="industrycode"] select, [data-id="industrycode"]').first();
  private readonly accountTypeField = this.page.locator('[data-id="customertypecode"] select, [data-id="customertypecode"]').first();
  private readonly employeesField = this.page.locator('[data-id="numberofemployees"] input');
  private readonly revenueField = this.page.locator('[data-id="revenue"] input');
  private readonly descriptionField = this.page.locator('[data-id="description"] textarea');
  private readonly parentAccountField = this.page.locator('[data-id="parentaccountid"] input');
  private readonly streetField = this.page.locator('[data-id="address1_line1"] input');
  private readonly cityField = this.page.locator('[data-id="address1_city"] input');
  private readonly stateField = this.page.locator('[data-id="address1_stateorprovince"] input');
  private readonly zipField = this.page.locator('[data-id="address1_postalcode"] input');
  private readonly countryField = this.page.locator('[data-id="address1_country"] input');

  // Related sub-grids
  private readonly contactsSubgrid = this.page.locator('[data-id="Contacts"] [data-id="entity-sub-grid"]');
  private readonly opportunitiesSubgrid = this.page.locator('[data-id="Opportunities"] [data-id="entity-sub-grid"]');

  constructor(page: Page) {
    super(page);
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  async navigateToAccounts(): Promise<void> {
    this.logger.info('Navigating to Accounts list');
    await this.navigateToEntityList('accounts');
    await this.waitForGrid();
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * Create a new account.
   */
  async createAccount(data: AccountData): Promise<void> {
    this.logger.info(`Creating account: ${data.name}`);
    await this.navigateToAccounts();
    await this.clickNew();
    await this.fillAccountForm(data);
    await this.clickSave();
    await this.assertSaveSuccess();
    this.logger.info(`Account created: ${data.name}`);
  }

  /**
   * Fill account form fields with provided data.
   */
  async fillAccountForm(data: AccountData): Promise<void> {
    await this.fillInput(this.accountNameField, data.name);

    if (data.phone) await this.fillInput(this.phoneField, data.phone);
    if (data.website) await this.fillInput(this.websiteField, data.website);
    if (data.numberOfEmployees) await this.fillInput(this.employeesField, data.numberOfEmployees);
    if (data.annualRevenue) await this.fillInput(this.revenueField, data.annualRevenue);
    if (data.description) await this.fillInput(this.descriptionField, data.description);

    if (data.industry) {
      await this.selectOptionSetField('industrycode', data.industry);
    }
    if (data.accountType) {
      await this.selectOptionSetField('customertypecode', data.accountType);
    }
    if (data.parentAccount) {
      await this.fillLookupField('parentaccountid', data.parentAccount);
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
   * Search for an account by name.
   */
  async searchAccount(name: string): Promise<void> {
    this.logger.info(`Searching for account: ${name}`);
    await this.navigateToAccounts();
    await this.searchInGrid(name);
  }

  /**
   * Open an account record by name.
   */
  async openAccount(name: string): Promise<void> {
    this.logger.info(`Opening account: ${name}`);
    await this.navigateToAccounts();
    await this.clickGridRowByText(name);
    await this.waitForCRMLoad();
  }

  /**
   * Update an existing account.
   */
  async updateAccount(name: string, updates: Partial<AccountData>): Promise<void> {
    this.logger.info(`Updating account: ${name}`);
    await this.openAccount(name);
    await this.fillAccountForm({ name, ...updates });
    await this.clickSave();
    await this.assertSaveSuccess();
  }

  /**
   * Delete an account by name.
   */
  async deleteAccount(name: string): Promise<void> {
    this.logger.info(`Deleting account: ${name}`);
    await this.openAccount(name);
    await this.clickDelete();
  }

  // ─── Related Entities ──────────────────────────────────────────────────────

  /**
   * Get the number of contacts in the Contacts sub-grid on the Account form.
   */
  async getRelatedContactsCount(): Promise<number> {
    await this.contactsSubgrid.waitFor({ state: 'visible', timeout: 15000 });
    const rows = this.contactsSubgrid.locator('[data-automationid="DetailsRow"]');
    return await rows.count();
  }

  /**
   * Get the number of opportunities in the Opportunities sub-grid.
   */
  async getRelatedOpportunitiesCount(): Promise<number> {
    await this.opportunitiesSubgrid.waitFor({ state: 'visible', timeout: 15000 });
    const rows = this.opportunitiesSubgrid.locator('[data-automationid="DetailsRow"]');
    return await rows.count();
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

  async getAccountName(): Promise<string> {
    return await this.getInputValue(this.accountNameField);
  }

  async getWebsite(): Promise<string> {
    return await this.getInputValue(this.websiteField);
  }

  // ─── Assertions ────────────────────────────────────────────────────────────

  async assertAccountExists(name: string): Promise<void> {
    await this.navigateToAccounts();
    await this.searchInGrid(name);
    const row = this.page.locator(`[data-automationid="DetailsRow"]:has-text("${name}"), tr:has-text("${name}")`).first();
    await this.assertVisible(row, `Account "${name}" should exist in the grid`);
  }

  async assertAccountNotExists(name: string): Promise<void> {
    await this.navigateToAccounts();
    await this.searchInGrid(name);
    const row = this.page.locator(`[data-automationid="DetailsRow"]:has-text("${name}"), tr:has-text("${name}")`).first();
    await this.assertHidden(row);
  }

  async assertAccountDetails(expected: Partial<AccountData>): Promise<void> {
    if (expected.name) {
      await this.assertInputValue(this.accountNameField, expected.name);
    }
    if (expected.phone) {
      await this.assertInputValue(this.phoneField, expected.phone);
    }
    if (expected.website) {
      await this.assertInputValue(this.websiteField, expected.website);
    }
  }

  async assertNameRequired(): Promise<void> {
    await this.navigateToAccounts();
    await this.clickNew();
    await this.clickSave();
    const errorIndicator = this.page.locator('[data-id="name"] .ms-TextField-errorMessage').first();
    await this.assertVisible(errorIndicator);
  }
}
