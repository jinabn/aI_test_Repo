import { Browser, BrowserContext, chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger';
import config from '../config';

const logger = new Logger('AuthHelper');

/**
 * AuthHelper manages browser session storage state for both CRM and Inventory apps.
 *
 * Playwright's storageState captures cookies + localStorage after login so subsequent
 * tests can skip the login flow entirely — critical for CRM's slow AAD login.
 *
 * Auth state files are stored in /auth-state/ (gitignored).
 */
export class AuthHelper {
  private static readonly AUTH_DIR = path.resolve(process.cwd(), 'auth-state');

  static readonly CRM_STORAGE_STATE = path.join(AuthHelper.AUTH_DIR, 'crm.storageState.json');
  static readonly INVENTORY_STORAGE_STATE = path.join(
    AuthHelper.AUTH_DIR,
    'inventory.storageState.json'
  );

  // ─── Setup ─────────────────────────────────────────────────────────────────

  static ensureAuthDir(): void {
    if (!fs.existsSync(AuthHelper.AUTH_DIR)) {
      fs.mkdirSync(AuthHelper.AUTH_DIR, { recursive: true });
    }
  }

  /**
   * Check if a valid storage state file exists and hasn't expired.
   * CRM sessions typically last 24h; we re-auth if file is older than 12h.
   */
  static isStorageStateValid(filePath: string, maxAgeHours = 12): boolean {
    if (!fs.existsSync(filePath)) return false;
    const stats = fs.statSync(filePath);
    const ageMs = Date.now() - stats.mtimeMs;
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    return ageMs < maxAgeMs;
  }

  // ─── CRM Auth ──────────────────────────────────────────────────────────────

  /**
   * Perform a full CRM login and save the session to disk.
   * Called from the auth.setup.ts file during the setup project.
   */
  static async saveCRMSession(
    username = config.crm.userName,
    password = config.crm.password
  ): Promise<void> {
    AuthHelper.ensureAuthDir();

    if (AuthHelper.isStorageStateValid(AuthHelper.CRM_STORAGE_STATE)) {
      logger.info('CRM storage state is fresh — skipping re-authentication');
      return;
    }

    logger.info(`Authenticating CRM user: ${username}`);
    const browser = await chromium.launch({ headless: true });

    try {
      const context = await browser.newContext({
        viewport: { width: 1600, height: 900 },
        locale: 'en-US',
      });
      const page = await context.newPage();

      // Navigate to CRM org URL — triggers AAD redirect
      await page.goto(config.crm.orgUrl, { waitUntil: 'domcontentloaded' });

      // Enter email
      await page.waitForSelector('[name="loginfmt"], input[type="email"]', { timeout: 30000 });
      await page.fill('[name="loginfmt"], input[type="email"]', username);
      
      // Wait for Next button to be enabled before clicking
      await page.waitForSelector('[id="idSIButton9"]:not([disabled])', { timeout: 15000 });
      await page.click('[id="idSIButton9"]');

      // Enter password
      await page.waitForSelector('[name="passwd"], input[type="password"]', { timeout: 30000 });
      await page.fill('[name="passwd"], input[type="password"]', password);
      
      // Wait for Sign in button to be enabled before clicking
      await page.waitForSelector('[id="idSIButton9"]:not([disabled])', { timeout: 15000 });
      await page.click('[id="idSIButton9"]');

      // "Stay signed in?" — click No
      try {
        await page.waitForSelector('[id="idBtn_Back"]', { timeout: 10000 });
        await page.click('[id="idBtn_Back"]');
      } catch {
        // Prompt may not appear
      }

      // Wait for CRM shell - support both standard Dynamics and custom apps like OASIS
      await page.waitForURL(/crm\.dynamics\.com/, { timeout: 60000 });
      
      // Wait for any of these common CRM/OASIS elements
      const appLoadedSelectors = [
        '[data-id="navbar-main"]',           // Standard Dynamics navbar
        '.ms-crm-appchrome',                 // Standard Dynamics chrome
        '[class*="appHeader"]',              // OASIS app header
        'nav',                               // Generic navigation
        '[role="navigation"]',               // ARIA navigation
        '[data-id="app-content"]',           // App content area
        '.content-main',                     // Main content
      ];
      
      // Wait for any selector to appear
      await Promise.race(
        appLoadedSelectors.map(selector => 
          page.waitForSelector(selector, { timeout: 60000 }).catch(() => null)
        )
      );
      
      // Give it a moment to fully stabilize
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      // Save session
      await context.storageState({ path: AuthHelper.CRM_STORAGE_STATE });
      logger.info(`CRM session saved: ${AuthHelper.CRM_STORAGE_STATE}`);

      await context.close();
    } finally {
      await browser.close();
    }
  }

  /**
   * Save a session for the test plan user (used in specific test scenarios).
   */
  static async saveCRMTestUserSession(): Promise<void> {
    const testStatePath = path.join(AuthHelper.AUTH_DIR, 'crm-testuser.storageState.json');
    AuthHelper.ensureAuthDir();

    if (AuthHelper.isStorageStateValid(testStatePath)) {
      logger.info('CRM test user storage state is fresh — skipping re-authentication');
      return;
    }

    logger.info(`Authenticating CRM test user: ${config.crm.testUserName}`);
    await AuthHelper.loginAndSave(
      config.crm.orgUrl,
      config.crm.testUserName,
      config.crm.testPassword,
      testStatePath,
      /crm\.dynamics\.com/,
      '[data-id="navbar-main"]'
    );
  }

  // ─── Inventory Auth ────────────────────────────────────────────────────────

  static async saveInventorySession(): Promise<void> {
    AuthHelper.ensureAuthDir();

    if (AuthHelper.isStorageStateValid(AuthHelper.INVENTORY_STORAGE_STATE)) {
      logger.info('Inventory storage state is fresh — skipping re-authentication');
      return;
    }

    logger.info(`Authenticating Inventory user: ${config.inventory.userName}`);
    await AuthHelper.loginAndSave(
      config.inventory.url,
      config.inventory.userName,
      config.inventory.password,
      AuthHelper.INVENTORY_STORAGE_STATE,
      new RegExp(config.inventory.url.replace('https://', '')),
      'nav, header, [role="navigation"]'
    );
  }

  // ─── Generic Login Helper ──────────────────────────────────────────────────

  private static async loginAndSave(
    startUrl: string,
    username: string,
    password: string,
    outputPath: string,
    waitForUrl: RegExp,
    waitForSelector: string
  ): Promise<void> {
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
      const page = await context.newPage();

      await page.goto(startUrl, { waitUntil: 'domcontentloaded' });

      // Microsoft login flow
      try {
        await page.waitForSelector('[name="loginfmt"], input[type="email"]', { timeout: 15000 });
        await page.fill('[name="loginfmt"], input[type="email"]', username);
        
        // Wait for Next button to be enabled
        await page.waitForSelector('[id="idSIButton9"]:not([disabled])', { timeout: 10000 });
        await page.click('[id="idSIButton9"]');
        
        await page.waitForSelector('[name="passwd"], input[type="password"]', { timeout: 15000 });
        await page.fill('[name="passwd"], input[type="password"]', password);
        
        // Wait for Sign in button to be enabled
        await page.waitForSelector('[id="idSIButton9"]:not([disabled])', { timeout: 10000 });
        await page.click('[id="idSIButton9"]');
        
        try {
          await page.waitForSelector('[id="idBtn_Back"]', { timeout: 8000 });
          await page.click('[id="idBtn_Back"]');
        } catch { /* no stay-signed-in prompt */ }
      } catch {
        // May already be on the app (SSO / different login form)
        logger.warn('Microsoft login form not detected — assuming direct app login');
      }

      await page.waitForURL(waitForUrl, { timeout: 60000 });
      await page.waitForSelector(waitForSelector, { timeout: 60000 });

      await context.storageState({ path: outputPath });
      logger.info(`Session saved: ${outputPath}`);
      await context.close();
    } finally {
      await browser.close();
    }
  }

  // ─── Cleanup ───────────────────────────────────────────────────────────────

  static clearAllSessions(): void {
    [AuthHelper.CRM_STORAGE_STATE, AuthHelper.INVENTORY_STORAGE_STATE].forEach(f => {
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
        logger.info(`Cleared session: ${f}`);
      }
    });
  }
}
