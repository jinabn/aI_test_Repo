import { Page } from '@playwright/test';
import { InventoryBasePage } from './InventoryBasePage';

/**
 * Page Object for Validate Inventory Management navigation for stock transfer workflows
 * Module: INVENTORY
 * Work Item: #5827
 * 
 * This page object handles navigation validation for the following inventory workflows:
 * - Stock Overview
 * - Product Display
 * - Create Transfer
 * - Fulfill Transfer
 * - Issue Resolution
 * - Pick Report
 * - Receive Transfer
 * - Adjust Levels
 */
export class ValidateInventoryManagementPage extends InventoryBasePage {
  // Navigation link locators
  private readonly stockOverviewLink = this.page.locator('a:has-text("Stock Overview"), button:has-text("Stock Overview")');
  private readonly productDisplayLink = this.page.locator('a:has-text("Product Display"), button:has-text("Product Display")');
  private readonly createTransferLink = this.page.locator('a:has-text("Create Transfer"), button:has-text("Create Transfer")');
  private readonly fulfillTransferLink = this.page.locator('a:has-text("Fulfill Transfer"), button:has-text("Fulfill Transfer")');
  private readonly issueResolutionLink = this.page.locator('a:has-text("Issue Resolution"), button:has-text("Issue Resolution")');
  private readonly pickReportLink = this.page.locator('a:has-text("Pick Report"), button:has-text("Pick Report")');
  private readonly receiveTransferLink = this.page.locator('a:has-text("Receive Transfer"), button:has-text("Receive Transfer")');
  private readonly adjustLevelsLink = this.page.locator('a:has-text("Adjust Levels"), button:has-text("Adjust Levels")');
  
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to the Inventory Management dashboard
   */
  async navigate(): Promise<void> {
    await this.navigateToPath('/');
    await this.waitForInventoryLoad();
  }

  /**
   * Verify Stock Overview navigation link is visible
   */
  async verifyStockOverviewLinkVisible(): Promise<void> {
    await this.stockOverviewLink.first().waitFor({ state: 'visible', timeout: 10000 });
    this.logger.info('Stock Overview link is visible');
  }

  /**
   * Click Stock Overview and verify navigation
   */
  async navigateToStockOverview(): Promise<void> {
    await this.stockOverviewLink.first().click();
    await this.waitForInventoryLoad();
    this.logger.info('Navigated to Stock Overview');
  }

  /**
   * Verify Product Display navigation link is visible
   */
  async verifyProductDisplayLinkVisible(): Promise<void> {
    await this.productDisplayLink.first().waitFor({ state: 'visible', timeout: 10000 });
    this.logger.info('Product Display link is visible');
  }

  /**
   * Click Product Display and verify navigation
   */
  async navigateToProductDisplay(): Promise<void> {
    await this.productDisplayLink.first().click();
    await this.waitForInventoryLoad();
    this.logger.info('Navigated to Product Display');
  }

  /**
   * Verify Create Transfer navigation link is visible
   */
  async verifyCreateTransferLinkVisible(): Promise<void> {
    await this.createTransferLink.first().waitFor({ state: 'visible', timeout: 10000 });
    this.logger.info('Create Transfer link is visible');
  }

  /**
   * Click Create Transfer and verify navigation
   */
  async navigateToCreateTransfer(): Promise<void> {
    await this.createTransferLink.first().click();
    await this.waitForInventoryLoad();
    this.logger.info('Navigated to Create Transfer');
  }

  /**
   * Verify Fulfill Transfer navigation link is visible
   */
  async verifyFulfillTransferLinkVisible(): Promise<void> {
    await this.fulfillTransferLink.first().waitFor({ state: 'visible', timeout: 10000 });
    this.logger.info('Fulfill Transfer link is visible');
  }

  /**
   * Click Fulfill Transfer and verify navigation
   */
  async navigateToFulfillTransfer(): Promise<void> {
    await this.fulfillTransferLink.first().click();
    await this.waitForInventoryLoad();
    this.logger.info('Navigated to Fulfill Transfer');
  }

  /**
   * Verify Issue Resolution navigation link is visible
   */
  async verifyIssueResolutionLinkVisible(): Promise<void> {
    await this.issueResolutionLink.first().waitFor({ state: 'visible', timeout: 10000 });
    this.logger.info('Issue Resolution link is visible');
  }

  /**
   * Click Issue Resolution and verify navigation
   */
  async navigateToIssueResolution(): Promise<void> {
    await this.issueResolutionLink.first().click();
    await this.waitForInventoryLoad();
    this.logger.info('Navigated to Issue Resolution');
  }

  /**
   * Verify Pick Report navigation link is visible
   */
  async verifyPickReportLinkVisible(): Promise<void> {
    await this.pickReportLink.first().waitFor({ state: 'visible', timeout: 10000 });
    this.logger.info('Pick Report link is visible');
  }

  /**
   * Click Pick Report and verify navigation
   */
  async navigateToPickReport(): Promise<void> {
    await this.pickReportLink.first().click();
    await this.waitForInventoryLoad();
    this.logger.info('Navigated to Pick Report');
  }

  /**
   * Verify Receive Transfer navigation link is visible
   */
  async verifyReceiveTransferLinkVisible(): Promise<void> {
    await this.receiveTransferLink.first().waitFor({ state: 'visible', timeout: 10000 });
    this.logger.info('Receive Transfer link is visible');
  }

  /**
   * Click Receive Transfer and verify navigation
   */
  async navigateToReceiveTransfer(): Promise<void> {
    await this.receiveTransferLink.first().click();
    await this.waitForInventoryLoad();
    this.logger.info('Navigated to Receive Transfer');
  }

  /**
   * Verify Adjust Levels navigation link is visible
   */
  async verifyAdjustLevelsLinkVisible(): Promise<void> {
    await this.adjustLevelsLink.first().waitFor({ state: 'visible', timeout: 10000 });
    this.logger.info('Adjust Levels link is visible');
  }

  /**
   * Click Adjust Levels and verify navigation
   */
  async navigateToAdjustLevels(): Promise<void> {
    await this.adjustLevelsLink.first().click();
    await this.waitForInventoryLoad();
    this.logger.info('Navigated to Adjust Levels');
  }

  /**
   * Verify all navigation links are visible
   */
  async verifyAllNavigationLinks(): Promise<void> {
    await this.verifyStockOverviewLinkVisible();
    await this.verifyProductDisplayLinkVisible();
    await this.verifyCreateTransferLinkVisible();
    await this.verifyFulfillTransferLinkVisible();
    await this.verifyIssueResolutionLinkVisible();
    await this.verifyPickReportLinkVisible();
    await this.verifyReceiveTransferLinkVisible();
    await this.verifyAdjustLevelsLinkVisible();
    this.logger.info('All navigation links are visible');
  }
}

