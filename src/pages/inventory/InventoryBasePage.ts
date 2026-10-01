import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Base class for all Inventory Management pages.
 * Extends BasePage and adds inventory-specific helpers.
 */
export class InventoryBasePage extends BasePage {
  protected readonly inventoryUrl: string;

  constructor(page: Page) {
    super(page);
    this.inventoryUrl = process.env.INVENTORY_MGMT_URL ?? '';
    
    if (!this.inventoryUrl) {
      throw new Error('INVENTORY_MGMT_URL is not set in .env');
    }
  }

  /**
   * Navigate to a specific inventory page
   */
  async navigateToPath(path: string): Promise<void> {
    const url = path.startsWith('/') ? `${this.inventoryUrl}${path}` : `${this.inventoryUrl}/${path}`;
    this.logger.info(`Navigating to: ${url}`);
    await this.page.goto(url);
    await this.waitForInventoryLoad();
  }

  /**
   * Wait for inventory page to load
   */
  async waitForInventoryLoad(): Promise<void> {
    // Wait for network idle
    await this.page.waitForLoadState('networkidle');
    
    // Wait for common inventory elements (customize based on actual app)
    try {
      await this.page.waitForSelector('[data-testid="inventory-container"], .main-content, main', {
        timeout: 10000,
        state: 'visible'
      });
    } catch (error) {
      this.logger.warn('Standard inventory container not found, proceeding anyway');
    }
  }

  /**
   * Click a navigation menu item
   */
  async clickNavItem(itemText: string): Promise<void> {
    this.logger.info(`Clicking navigation item: ${itemText}`);
    
    // Try multiple selectors for navigation items
    const selectors = [
      `nav >> text="${itemText}"`,
      `[role="navigation"] >> text="${itemText}"`,
      `.nav-item >> text="${itemText}"`,
      `.menu-item >> text="${itemText}"`,
      `a:has-text("${itemText}")`,
      `button:has-text("${itemText}")`
    ];

    for (const selector of selectors) {
      try {
        await this.page.locator(selector).first().click({ timeout: 5000 });
        await this.waitForInventoryLoad();
        return;
      } catch (error) {
        // Try next selector
        continue;
      }
    }

    throw new Error(`Could not find navigation item: ${itemText}`);
  }

  /**
   * Verify page title or heading
   */
  async verifyPageHeading(expectedHeading: string): Promise<void> {
    this.logger.info(`Verifying page heading: ${expectedHeading}`);
    
    // Check for heading in multiple places
    const headingLocator = this.page.locator(`h1:has-text("${expectedHeading}"), h2:has-text("${expectedHeading}"), [data-testid="page-title"]:has-text("${expectedHeading}")`);
    
    await headingLocator.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Wait for a data grid/table to load
   */
  async waitForDataGrid(): Promise<void> {
    const gridSelectors = [
      '[data-testid="data-grid"]',
      'table',
      '.ag-grid',
      '.data-grid',
      '[role="grid"]'
    ];

    for (const selector of gridSelectors) {
      const grid = this.page.locator(selector).first();
      if (await grid.isVisible({ timeout: 2000 }).catch(() => false)) {
        await this.page.waitForLoadState('networkidle');
        return;
      }
    }

    this.logger.warn('No data grid found, continuing anyway');
  }

  /**
   * Click a button by text
   */
  async clickButton(buttonText: string): Promise<void> {
    this.logger.info(`Clicking button: ${buttonText}`);
    await this.page.getByRole('button', { name: buttonText }).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill a form field
   */
  async fillField(label: string, value: string): Promise<void> {
    this.logger.info(`Filling field "${label}" with value: ${value}`);
    
    // Try to find input by label
    const input = this.page.locator(`label:has-text("${label}") + input, input[placeholder*="${label}"], input[name*="${label.toLowerCase().replace(/\s+/g, '')}"]`).first();
    await input.fill(value);
  }

  /**
   * Select from dropdown
   */
  async selectDropdown(label: string, option: string): Promise<void> {
    this.logger.info(`Selecting "${option}" from dropdown "${label}"`);
    
    const select = this.page.locator(`label:has-text("${label}") + select, select[name*="${label.toLowerCase().replace(/\s+/g, '')}"]`).first();
    await select.selectOption({ label: option });
  }
}
