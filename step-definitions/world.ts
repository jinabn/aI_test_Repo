import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { BrowserContext, Page } from '@playwright/test';
import { Logger } from '../src/utils/logger';

/**
 * CRMWorld — shared state injected into every step definition.
 * Holds the Playwright page, browser context, test data, and logger.
 */
export class CRMWorld extends World {
  page!: Page;
  context!: BrowserContext;
  logger: Logger;

  // Shared test data set during scenario steps (e.g. "Given a contact exists")
  testData: Record<string, string> = {};

  constructor(options: IWorldOptions) {
    super(options);
    this.logger = new Logger('CRMWorld');
  }

  /** Store a named test value for use later in the same scenario. */
  set(key: string, value: string): void {
    this.testData[key] = value;
  }

  /** Retrieve a stored test value. Throws if not set. */
  get(key: string): string {
    const val = this.testData[key];
    if (val === undefined) {
      throw new Error(`Test data key "${key}" has not been set in this scenario.`);
    }
    return val;
  }
}

setWorldConstructor(CRMWorld);
