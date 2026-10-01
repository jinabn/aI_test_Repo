import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { LoginCredentials } from '../types';
import config from '../config';

/**
 * LoginPage handles Microsoft Online / Azure AD login for both
 * Dynamics CRM and the Inventory Management app.
 */
export class LoginPage extends BasePage {
  // ─── Locators ──────────────────────────────────────────────────────────────
  private readonly emailInput = this.page.locator('[name="loginfmt"], input[type="email"]');
  private readonly nextButton = this.page.locator('[id="idSIButton9"], input[value="Next"]');
  private readonly passwordInput = this.page.locator('[name="passwd"], input[type="password"]');
  private readonly signInButton = this.page.locator('[id="idSIButton9"], input[value="Sign in"]');
  private readonly staySignedInNoButton = this.page.locator('[id="idBtn_Back"]');
  private readonly staySignedInYesButton = this.page.locator('[id="idSIButton9"]');
  private readonly errorMessage = this.page.locator('[id="usernameError"], [id="passwordError"], .alert-error, #idTD_Error');
  private readonly mfaContainer = this.page.locator('[id="idDiv_SAOTCC_Title"], .tile-img');
  private readonly userAvatar = this.page.locator('[data-id="navbar-main"] [id*="avatar"], .fui-Avatar');

  constructor(page: Page) {
    super(page);
  }

  // ─── CRM Login ─────────────────────────────────────────────────────────────

  /**
   * Full login flow for Dynamics CRM.
   * Navigates to the CRM org URL, completes Microsoft login,
   * and waits for the CRM shell to be ready.
   */
  async loginToCRM(credentials?: LoginCredentials): Promise<void> {
    const user = credentials?.username ?? config.crm.userName;
    const pass = credentials?.password ?? config.crm.password;

    this.logger.info(`Logging into CRM as: ${user}`);
    await this.navigateTo(config.crm.orgUrl);
    await this.completeMicrosoftLogin(user, pass);
    await this.waitForCRMShell();
    this.logger.info('CRM login successful');
  }

  /**
   * Login with the test plan user account.
   */
  async loginToCRMAsTestUser(): Promise<void> {
    await this.loginToCRM({
      username: config.crm.testUserName,
      password: config.crm.testPassword,
    });
  }

  // ─── Inventory Management Login ────────────────────────────────────────────

  async loginToInventory(credentials?: LoginCredentials): Promise<void> {
    const user = credentials?.username ?? config.inventory.userName;
    const pass = credentials?.password ?? config.inventory.password;

    this.logger.info(`Logging into Inventory Management as: ${user}`);
    await this.navigateTo(config.inventory.url);

    // Inventory app may redirect to Microsoft login or have its own form
    const currentUrl = this.page.url();
    if (currentUrl.includes('login.microsoftonline.com') || currentUrl.includes('microsoft')) {
      await this.completeMicrosoftLogin(user, pass);
    } else {
      await this.completeAppLogin(user, pass);
    }

    await this.waitForPageLoad();
    this.logger.info('Inventory Management login successful');
  }

  // ─── Microsoft Login Core Flow ─────────────────────────────────────────────

  /**
   * Completes the standard Microsoft Online (AAD) login flow.
   * Handles: email entry → password entry → "Stay signed in?" prompt.
   */
  async completeMicrosoftLogin(username: string, password: string): Promise<void> {
    // Wait for redirect to login page
    await this.page.waitForURL(/login\.microsoftonline\.com|microsoftonline/, { timeout: 30000 }).catch(() => {});

    // Step 1: Enter email
    await this.emailInput.waitFor({ state: 'visible', timeout: 30000 });
    await this.fillInput(this.emailInput, username);
    await this.clickElement(this.nextButton);

    // Step 2: Enter password (may show after animation)
    await this.passwordInput.waitFor({ state: 'visible', timeout: 30000 });
    await this.fillInput(this.passwordInput, password);
    await this.clickElement(this.signInButton);

    // Step 3: Handle "Stay signed in?" prompt (click No to avoid persistent session)
    try {
      await this.staySignedInNoButton.waitFor({ state: 'visible', timeout: 10000 });
      await this.clickElement(this.staySignedInNoButton);
    } catch {
      // Prompt may not appear – safe to continue
    }

    // Step 4: Handle any MFA prompts (best effort – CI environments should use app passwords)
    await this.handleMFAIfPresent();
  }

  /**
   * Completes login for a non-Microsoft form (username/password fields).
   */
  async completeAppLogin(username: string, password: string): Promise<void> {
    await this.fillInput('input[name="username"], input[name="email"], #username', username);
    await this.fillInput('input[name="password"], #password', password);
    await this.clickElement('button[type="submit"], input[type="submit"]');
  }

  // ─── MFA Handler ──────────────────────────────────────────────────────────

  /**
   * Detects and attempts to bypass MFA if present.
   * For automated tests, the accounts should use app passwords or
   * have conditional access policies that skip MFA from known IPs.
   */
  private async handleMFAIfPresent(): Promise<void> {
    try {
      const mfaVisible = await this.mfaContainer.isVisible();
      if (mfaVisible) {
        this.logger.warn('MFA prompt detected. Ensure test accounts bypass MFA via Conditional Access.');
        // Look for "Use a different verification option" or "I can't use my Microsoft Authenticator"
        const skipLink = this.page.locator('a:has-text("different"), a:has-text("can\'t use")').first();
        if (await skipLink.isVisible()) {
          await skipLink.click();
        }
      }
    } catch {
      // MFA not present
    }
  }

  // ─── Post-Login Waits ──────────────────────────────────────────────────────

  /**
   * Waits for the Dynamics CRM shell to fully load after login.
   */
  async waitForCRMShell(timeout = 60000): Promise<void> {
    this.logger.info('Waiting for CRM shell to load...');
    // Wait for CRM URL
    await this.page.waitForURL(/crm\.dynamics\.com/, { timeout });
    // Wait for the top navigation bar
    await this.page.locator('[data-id="navbar-main"], .ms-crm-appchrome, #navbar').waitFor({
      state: 'visible',
      timeout,
    });
    await this.waitForCRMLoad(timeout);
    this.logger.info('CRM shell loaded');
  }

  // ─── Assertions ───────────────────────────────────────────────────────────

  async assertLoginError(expectedMessage?: string): Promise<void> {
    await this.assertVisible(this.errorMessage);
    if (expectedMessage) {
      await this.assertContainsText(this.errorMessage, expectedMessage);
    }
  }

  async assertLoggedIn(): Promise<void> {
    await this.waitForCRMShell();
  }
}
