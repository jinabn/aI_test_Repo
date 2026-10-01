import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

const isCI = !!process.env.CI;
const headless = process.env.HEADLESS !== 'false';
const slowMo = parseInt(process.env.SLOW_MO || '0', 10);
const defaultTimeout = parseInt(process.env.DEFAULT_TIMEOUT || '30000', 10);

export default defineConfig({
  // Root directory for tests
  testDir: './tests',

  // Match all spec files
  testMatch: '**/*.spec.ts',

  // Run tests in parallel (disable for CRM to avoid session conflicts)
  fullyParallel: false,
  workers: isCI ? 1 : 2,

  // Fail the build if any test.only is accidentally left in source
  forbidOnly: isCI,

  // Retry failing tests twice on CI, once locally
  retries: isCI ? 2 : 1,

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: true,
      environmentInfo: {
        app: 'Dynamics 365 CRM',
        org: process.env.DYN365_TEST_ORG_URL ?? '',
        node_version: process.version,
        playwright_version: '1.45.3',
      },
    }],
  ],

  // Global timeout per test
  timeout: defaultTimeout,

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.DYN365_BaseURL,

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on first retry
    video: 'on-first-retry',

    // Browser options
    headless,
    launchOptions: { slowMo },

    // Viewport for CRM
    viewport: { width: 1600, height: 900 },

    // Navigation timeout
    navigationTimeout: 60000,

    // Action timeout
    actionTimeout: 15000,

    // Ignore HTTPS errors (for dev environments)
    ignoreHTTPSErrors: true,

    // Locale
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },

  // Output directory for test artifacts
  outputDir: 'test-results/',

  projects: [
    // ─── Setup project: authenticate and save session ───────────────────────
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },

    // ─── CRM Tests (Chromium) ────────────────────────────────────────────────
    {
      name: 'crm-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'auth-state/crm.storageState.json',
      },
      dependencies: ['setup'],
      testIgnore: '**/inventory/**',
    },

    // ─── Inventory Management Tests ──────────────────────────────────────────
    {
      name: 'inventory-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'auth-state/inventory.storageState.json',
        baseURL: process.env.INVENTORY_MGMT_URL,
      },
      dependencies: ['setup'],
      testMatch: '**/inventory/**/*.spec.ts',
    },
  ],
});
