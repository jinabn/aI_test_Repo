import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { NavigationItem } from '../types';

/**
 * CRMDashboardPage covers the top navigation, sitemap navigation,
 * global search, and command bar common to all CRM screens.
 */
export class CRMDashboardPage extends BasePage {
  // ─── Top Navigation ────────────────────────────────────────────────────────
  private readonly topNavBar = this.page.locator('[data-id="navbar-main"]');
  private readonly appSwitcher = this.page.locator('[data-id="appBreadCrumb"], [aria-label="App Launcher"]');
  private readonly globalSearch = this.page.locator('[data-id="global-search-box"] input, [aria-label="Search"]');
  private readonly globalSearchButton = this.page.locator('[data-id="global-search-box"] button[aria-label="Search"]');
  private readonly userMenuButton = this.page.locator('[data-id="navbar-main"] button[aria-label*="User"], .ms-Persona-primaryText');
  private readonly settingsButton = this.page.locator('button[aria-label="Settings"], [data-id="settings-command-bar"]');

  // ─── Site Map / Left Navigation ────────────────────────────────────────────
  private readonly siteMapToggle = this.page.locator('[aria-label="Show Navigation"], [data-id="sitemap-toggle"]');
  private readonly siteMapPanel = this.page.locator('[data-id="sitemap-panel"], .ms-Nav');
  private readonly siteMapAreaSwitcher = this.page.locator('[data-id="sitemap-areaSwitcher"], [aria-label="Area Switcher"]');

  // ─── Command Bar ───────────────────────────────────────────────────────────
  private readonly newButton = this.page.locator('[data-id="new_command"], button:has-text("New")').first();
  private readonly saveButton = this.page.locator('[data-id="save-command"], button[aria-label="Save"]').first();
  private readonly saveCloseButton = this.page.locator('[data-id="saveandclose-command"], button[aria-label="Save & Close"]').first();
  private readonly deleteButton = this.page.locator('[data-id="delete_command"], button[aria-label="Delete"]').first();
  private readonly refreshButton = this.page.locator('[data-id="refresh_command"], button[aria-label="Refresh"]').first();
  private readonly moreCommandsButton = this.page.locator('[data-id="more-commands"], button[aria-label="More commands"]').first();

  // ─── Notifications ─────────────────────────────────────────────────────────
  private readonly successNotification = this.page.locator('[data-id="notify_content"], .ms-MessageBar--success, [role="alert"]:has-text("saved")');
  private readonly errorNotification = this.page.locator('[data-id="notify_error"], .ms-MessageBar--error, [role="alert"]:has-text("error")');
  private readonly infoBar = this.page.locator('[data-id="notificationWrapper"]');

  // ─── Views / Grids ─────────────────────────────────────────────────────────
  private readonly gridView = this.page.locator('[data-id="entity-grid-main-container"], .ms-DetailsList');
  private readonly gridRows = this.page.locator('[data-automationid="DetailsRow"], tr[data-id*="guid"]');
  private readonly gridLoadingSpinner = this.page.locator('[data-id="grid-loading"], .ms-Spinner');
  private readonly viewSelector = this.page.locator('[data-id="view-switcher"], button[aria-label*="View"]').first();
  private readonly columnHeader = (columnName: string): Locator =>
    this.page.locator(`[data-automationid="ColumnsHeader"] [title="${columnName}"], th:has-text("${columnName}")`);

  constructor(page: Page) {
    super(page);
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  /**
   * Navigate via the CRM sitemap to a specific area and entity.
   * e.g. navigateToEntity({ groupName: 'Sales', itemName: 'Contacts' })
   */
  async navigateToEntity(item: NavigationItem): Promise<void> {
    this.logger.info(`Navigating to: ${item.groupName} > ${item.itemName}`);

    // Ensure site map is open
    if (!(await this.siteMapPanel.isVisible())) {
      await this.clickElement(this.siteMapToggle);
      await this.siteMapPanel.waitFor({ state: 'visible' });
    }

    // Switch area if needed (e.g. Sales, Service, Marketing)
    const currentArea = await this.siteMapAreaSwitcher.textContent();
    if (currentArea && !currentArea.includes(item.groupName)) {
      await this.clickElement(this.siteMapAreaSwitcher);
      const areaOption = this.page.locator(`[data-id="sitemap-area-${item.groupName}"], li:has-text("${item.groupName}")`);
      await this.clickElement(areaOption);
    }

    // Click the entity item
    const entityLink = this.page.locator(`[data-id="sitemap-entity-${item.itemName}"], [title="${item.itemName}"], nav a:has-text("${item.itemName}")`).first();
    await entityLink.waitFor({ state: 'visible', timeout: 15000 });
    await this.clickElement(entityLink);
    await this.waitForCRMLoad();
  }

  /**
   * Navigate directly using the app URL with entity logical name.
   */
  async navigateToEntityList(entityPluralName: string): Promise<void> {
    const baseOrgUrl = process.env.DYN365_TEST_ORG_URL ?? '';
    // Strip query string and append entity navigation
    const orgBase = baseOrgUrl.split('?')[0];
    await this.navigateTo(`${orgBase}?pagetype=entitylist&etn=${entityPluralName}`);
    await this.waitForCRMLoad();
  }

  // ─── Global Search ─────────────────────────────────────────────────────────

  async globalSearchFor(searchTerm: string): Promise<void> {
    this.logger.info(`Global search: ${searchTerm}`);
    await this.clickElement(this.globalSearch);
    await this.fillInput(this.globalSearch, searchTerm);
    await this.clickElement(this.globalSearchButton);
    await this.waitForCRMLoad();
  }

  // ─── Command Bar Actions ───────────────────────────────────────────────────

  async clickNew(): Promise<void> {
    this.logger.info('Clicking New');
    await this.clickElement(this.newButton);
    await this.waitForCRMLoad();
  }

  async clickSave(): Promise<void> {
    this.logger.info('Clicking Save');
    await this.clickElement(this.saveButton);
    await this.waitForCRMLoad();
    await this.waitForSuccessNotification();
  }

  async clickSaveAndClose(): Promise<void> {
    this.logger.info('Clicking Save & Close');
    await this.clickElement(this.saveCloseButton);
    await this.waitForCRMLoad();
  }

  async clickDelete(): Promise<void> {
    this.logger.info('Clicking Delete');
    await this.clickElement(this.deleteButton);
    // Handle confirmation dialog
    const confirmButton = this.page.locator('button:has-text("Delete"), [data-id="ok_id"]').first();
    await confirmButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.clickElement(confirmButton);
    await this.waitForCRMLoad();
  }

  async clickRefresh(): Promise<void> {
    await this.clickElement(this.refreshButton);
    await this.waitForCRMLoad();
  }

  async clickMoreCommands(): Promise<void> {
    await this.clickElement(this.moreCommandsButton);
  }

  async clickCommandBarButton(buttonLabel: string): Promise<void> {
    const button = this.page.locator(`button[aria-label="${buttonLabel}"], button:has-text("${buttonLabel}")`).first();
    await this.clickElement(button);
    await this.waitForCRMLoad();
  }

  // ─── Grid / View Helpers ───────────────────────────────────────────────────

  async waitForGrid(): Promise<void> {
    await this.gridLoadingSpinner.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await this.gridView.waitFor({ state: 'visible', timeout: 30000 });
  }

  async getGridRowCount(): Promise<number> {
    await this.waitForGrid();
    return await this.gridRows.count();
  }

  async clickGridRow(rowIndex: number): Promise<void> {
    await this.waitForGrid();
    const row = this.gridRows.nth(rowIndex);
    await this.clickElement(row);
    await this.waitForCRMLoad();
  }

  async clickGridRowByText(text: string): Promise<void> {
    await this.waitForGrid();
    const row = this.page.locator(`[data-automationid="DetailsRow"]:has-text("${text}"), tr:has-text("${text}")`).first();
    await this.clickElement(row);
    await this.waitForCRMLoad();
  }

  async searchInGrid(searchTerm: string): Promise<void> {
    const searchInput = this.page.locator('[placeholder="Filter by keyword"], [aria-label*="Search this view"]').first();
    await this.fillInput(searchInput, searchTerm);
    await this.page.keyboard.press('Enter');
    await this.waitForGrid();
  }

  async switchView(viewName: string): Promise<void> {
    await this.clickElement(this.viewSelector);
    const viewOption = this.page.locator(`[title="${viewName}"], li:has-text("${viewName}")`).first();
    await this.clickElement(viewOption);
    await this.waitForGrid();
  }

  async sortGridByColumn(columnName: string): Promise<void> {
    await this.clickElement(this.columnHeader(columnName));
    await this.waitForGrid();
  }

  // ─── Notifications ─────────────────────────────────────────────────────────

  async waitForSuccessNotification(timeout = 15000): Promise<void> {
    await this.successNotification.waitFor({ state: 'visible', timeout }).catch(() => {});
  }

  async waitForErrorNotification(timeout = 10000): Promise<void> {
    await this.errorNotification.waitFor({ state: 'visible', timeout });
  }

  async assertSaveSuccess(): Promise<void> {
    await this.waitForSuccessNotification();
    await this.assertVisible(this.successNotification);
  }

  async assertSaveError(): Promise<void> {
    await this.waitForErrorNotification();
    await this.assertVisible(this.errorNotification);
  }

  // ─── Form Field Helpers (CRM-specific) ────────────────────────────────────

  /**
   * Fill a standard CRM form field by its data-id attribute.
   */
  async fillFormField(fieldDataId: string, value: string): Promise<void> {
    const input = this.page.locator(`[data-id="${fieldDataId}"] input, [data-id="${fieldDataId}"] textarea`).first();
    await this.fillInput(input, value);
  }

  /**
   * Get the value of a CRM form field.
   */
  async getFormFieldValue(fieldDataId: string): Promise<string> {
    const input = this.page.locator(`[data-id="${fieldDataId}"] input, [data-id="${fieldDataId}"] textarea`).first();
    return await this.getInputValue(input);
  }

  /**
   * Select a value from a CRM OptionSet (dropdown) field.
   */
  async selectOptionSetField(fieldDataId: string, optionText: string): Promise<void> {
    const select = this.page.locator(`[data-id="${fieldDataId}"] select, [data-id="${fieldDataId}"][role="combobox"]`).first();
    if (await select.evaluate(el => el.tagName.toLowerCase() === 'select')) {
      await this.selectDropdown(select, optionText);
    } else {
      await this.clickElement(select);
      const option = this.page.locator(`[role="option"]:has-text("${optionText}")`).first();
      await this.clickElement(option);
    }
  }

  /**
   * Get the page title (entity record name).
   */
  async getRecordTitle(): Promise<string> {
    const titleEl = this.page.locator('[data-id="header_title"] h1, .ms-crm-form-header-title, [aria-label="Title"]').first();
    return await this.getText(titleEl);
  }

  /**
   * Assert the form is in unsaved state (dirty).
   */
  async assertFormIsDirty(): Promise<void> {
    const dirtyIndicator = this.page.locator('[data-id="header_title"][title*="unsaved"], .ms-crm-form-dirty-indicator');
    await this.assertVisible(dirtyIndicator);
  }
}
