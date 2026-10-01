import { Before, After, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { CRMWorld } from './world';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Cucumber default step timeout — CRM can be slow
setDefaultTimeout(60 * 1000);

let browser: Browser;

BeforeAll(async function () {
  browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
  });
});

AfterAll(async function () {
  await browser?.close();
});

Before(async function (this: CRMWorld) {
  const storageStatePath = path.resolve(process.cwd(), 'auth-state/crm.storageState.json');

  this.context = await browser.newContext({
    storageState: storageStatePath,
    viewport: { width: 1600, height: 900 },
    locale: 'en-US',
    ignoreHTTPSErrors: true,
  });

  this.page = await this.context.newPage();
  this.page.setDefaultTimeout(30000);
  this.page.setDefaultNavigationTimeout(60000);
});

After(async function (this: CRMWorld, scenario) {
  // Capture screenshot on failure
  if (scenario.result?.status === 'FAILED' && this.page) {
    const screenshotDir = path.resolve(process.cwd(), 'test-results/screenshots');
    const name = scenario.pickle.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    try {
      const screenshot = await this.page.screenshot({ fullPage: true });
      await this.attach(screenshot, 'image/png');
      this.logger.warn(`BDD failure screenshot captured for: ${scenario.pickle.name}`);
    } catch {
      // Screenshot may fail if page is already closed
    }
  }

  await this.page?.close();
  await this.context?.close();
});
