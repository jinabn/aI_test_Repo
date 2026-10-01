import { Page, Locator, expect } from '@playwright/test';
import { Logger } from '../utils/logger';

/**
 * BasePage - all Page Objects extend this class.
 * Provides common helpers: navigation, waits, assertions, screenshots.
 */
export abstract class BasePage {
  protected readonly page: Page;
  protected readonly logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger(this.constructor.name);
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  async navigateTo(url: string): Promise<void> {
    this.logger.info(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async reload(): Promise<void> {
    this.logger.info('Reloading page');
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  async goBack(): Promise<void> {
    await this.page.goBack({ waitUntil: 'domcontentloaded' });
  }

  // ─── Waits ─────────────────────────────────────────────────────────────────

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForSelector(selector: string, timeout = 30000): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    return locator;
  }

  async waitForURL(urlPattern: string | RegExp, timeout = 30000): Promise<void> {
    await this.page.waitForURL(urlPattern, { timeout });
  }

  async waitForNetworkIdle(timeout = 15000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Waits for the Dynamics CRM loading spinner to disappear.
   * CRM uses a specific loading indicator class.
   */
  async waitForCRMLoad(timeout = 60000): Promise<void> {
    try {
      // Wait for any visible progress indicators to hide
      await this.page.waitForFunction(
        () => {
          const progressBars = document.querySelectorAll('[id$="progressArea"], .ms-crm-progress, [data-id="processing-spinner"]');
          return Array.from(progressBars).every(el => (el as HTMLElement).style.display === 'none' || !document.body.contains(el));
        },
        { timeout }
      );
    } catch {
      // If spinner not found, page may already be loaded
    }
    await this.page.waitForLoadState('domcontentloaded', { timeout });
  }

  // ─── Interactions ──────────────────────────────────────────────────────────

  async clickElement(locator: Locator | string): Promise<void> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    this.logger.debug(`Clicking: ${typeof locator === 'string' ? locator : 'locator'}`);
    await el.scrollIntoViewIfNeeded();
    await el.click();
  }

  async fillInput(locator: Locator | string, value: string): Promise<void> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    this.logger.debug(`Filling input with value: ${value}`);
    await el.scrollIntoViewIfNeeded();
    await el.clear();
    await el.fill(value);
  }

  async selectDropdown(locator: Locator | string, value: string): Promise<void> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    this.logger.debug(`Selecting dropdown value: ${value}`);
    await el.selectOption({ label: value });
  }

  async typeText(locator: Locator | string, text: string, delay = 50): Promise<void> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await el.pressSequentially(text, { delay });
  }

  async clearAndFill(locator: Locator | string, value: string): Promise<void> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await el.clear();
    await el.fill(value);
  }

  async hoverElement(locator: Locator | string): Promise<void> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await el.hover();
  }

  // ─── CRM-specific: pick from lookup field ──────────────────────────────────

  async fillLookupField(fieldDataId: string, searchValue: string): Promise<void> {
    this.logger.debug(`Filling lookup field [${fieldDataId}] with: ${searchValue}`);
    const input = this.page.locator(`[data-id="${fieldDataId}"] input`).first();
    await input.fill(searchValue);
    await this.page.waitForTimeout(1000);
    const suggestion = this.page.locator('.pac-item, [id*="lookup"] li, .ms-crm-Lookup-Result').first();
    await suggestion.waitFor({ state: 'visible', timeout: 10000 });
    await suggestion.click();
  }

  async fillDateField(fieldDataId: string, dateValue: string): Promise<void> {
    const input = this.page.locator(`[data-id="${fieldDataId}"] input`).first();
    await input.fill(dateValue);
    await this.page.keyboard.press('Tab');
  }

  // ─── Assertions ────────────────────────────────────────────────────────────

  async assertVisible(locator: Locator | string, message?: string): Promise<void> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await expect(el, message).toBeVisible();
  }

  async assertHidden(locator: Locator | string): Promise<void> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await expect(el).toBeHidden();
  }

  async assertText(locator: Locator | string, expectedText: string): Promise<void> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await expect(el).toHaveText(expectedText);
  }

  async assertContainsText(locator: Locator | string, text: string): Promise<void> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await expect(el).toContainText(text);
  }

  async assertURL(expectedUrl: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(expectedUrl);
  }

  async assertTitle(expectedTitle: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  async assertInputValue(locator: Locator | string, expectedValue: string): Promise<void> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await expect(el).toHaveValue(expectedValue);
  }

  // ─── Screenshots ──────────────────────────────────────────────────────────

  async takeScreenshot(name: string): Promise<string> {
    const screenshotDir = process.env.BASE_SCREENSHOT_DIR || 'test-results/screenshots';
    const filePath = `${screenshotDir}/${name}-${Date.now()}.png`;
    await this.page.screenshot({ path: filePath, fullPage: true });
    this.logger.info(`Screenshot saved: ${filePath}`);
    return filePath;
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────

  async getText(locator: Locator | string): Promise<string> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return (await el.textContent()) ?? '';
  }

  async getInputValue(locator: Locator | string): Promise<string> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await el.inputValue();
  }

  async isVisible(locator: Locator | string): Promise<boolean> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await el.isVisible();
  }

  async isEnabled(locator: Locator | string): Promise<boolean> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await el.isEnabled();
  }

  async getCount(locator: Locator | string): Promise<number> {
    const el = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await el.count();
  }

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }
}
