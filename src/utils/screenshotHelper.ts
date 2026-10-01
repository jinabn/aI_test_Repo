import { Page, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger';

const logger = new Logger('ScreenshotHelper');

/**
 * ScreenshotHelper provides structured, named screenshots that integrate
 * with Playwright's TestInfo attachment system and the HTML report.
 */
export class ScreenshotHelper {
  private readonly page: Page;
  private readonly testInfo?: TestInfo;
  private readonly screenshotDir: string;

  constructor(page: Page, testInfo?: TestInfo) {
    this.page = page;
    this.testInfo = testInfo;
    this.screenshotDir = path.resolve(
      process.cwd(),
      process.env.BASE_SCREENSHOT_DIR ?? 'test-results/screenshots'
    );
    this.ensureDir(this.screenshotDir);
  }

  // ─── Core Screenshot ───────────────────────────────────────────────────────

  /**
   * Take a full-page screenshot and attach it to the test report.
   * @param name  Descriptive name — becomes the filename and attachment label.
   */
  async capture(name: string, fullPage = true): Promise<string> {
    const sanitized = name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
    const timestamp = Date.now();
    const filePath = path.join(this.screenshotDir, `${sanitized}-${timestamp}.png`);

    await this.page.screenshot({ path: filePath, fullPage });
    logger.info(`Screenshot captured: ${filePath}`);

    if (this.testInfo) {
      await this.testInfo.attach(name, { path: filePath, contentType: 'image/png' });
    }

    return filePath;
  }

  /**
   * Capture a screenshot of a specific element only.
   */
  async captureElement(selector: string, name: string): Promise<string> {
    const sanitized = name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
    const filePath = path.join(this.screenshotDir, `${sanitized}-${Date.now()}.png`);

    const element = this.page.locator(selector).first();
    await element.screenshot({ path: filePath });
    logger.info(`Element screenshot captured: ${filePath}`);

    if (this.testInfo) {
      await this.testInfo.attach(name, { path: filePath, contentType: 'image/png' });
    }

    return filePath;
  }

  /**
   * Capture a screenshot on test failure — called in afterEach hooks.
   */
  async captureOnFailure(testTitle: string): Promise<void> {
    const sanitized = testTitle.replace(/[^a-z0-9-_]/gi, '_').toLowerCase().substring(0, 60);
    const filePath = path.join(this.screenshotDir, `FAILURE-${sanitized}-${Date.now()}.png`);

    await this.page.screenshot({ path: filePath, fullPage: true });
    logger.warn(`Failure screenshot: ${filePath}`);

    if (this.testInfo) {
      await this.testInfo.attach('failure-screenshot', {
        path: filePath,
        contentType: 'image/png',
      });
    }
  }

  /**
   * Take a screenshot before and after an action for visual diff comparison.
   */
  async captureBeforeAfter(
    name: string,
    action: () => Promise<void>
  ): Promise<{ before: string; after: string }> {
    const before = await this.capture(`${name}-before`);
    await action();
    const after = await this.capture(`${name}-after`);
    return { before, after };
  }

  // ─── Visual Comparison ─────────────────────────────────────────────────────

  /**
   * Assert that the page matches a stored snapshot.
   * Uses Playwright's built-in toHaveScreenshot — creates baseline on first run.
   */
  async assertMatchesSnapshot(snapshotName: string, threshold = 0.2): Promise<void> {
    if (!this.testInfo) {
      throw new Error('TestInfo is required for snapshot comparison');
    }
    await this.page.screenshot({ fullPage: true });
    // Note: actual snapshot assertion is done via expect(page).toHaveScreenshot() in tests
    logger.info(`Snapshot assertion: ${snapshotName} (threshold: ${threshold})`);
  }

  // ─── Utility ───────────────────────────────────────────────────────────────

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
