import { v4 as uuidv4 } from 'uuid';

/**
 * TestDataHelper generates unique, reproducible test data to avoid collisions
 * when tests run concurrently or on shared CRM environments.
 *
 * All generated names include a short unique suffix so records can be cleaned up
 * after tests by searching for the prefix/suffix pattern.
 */
export class TestDataHelper {
  private static readonly TEST_PREFIX = 'AUTO-TEST';

  // ─── Name Generators ───────────────────────────────────────────────────────

  static uniqueSuffix(): string {
    return uuidv4().split('-')[0].toUpperCase(); // e.g. "A1B2C3D4"
  }

  static contactName(base = 'Test Contact'): { firstName: string; lastName: string } {
    const suffix = TestDataHelper.uniqueSuffix();
    return {
      firstName: `${TestDataHelper.TEST_PREFIX}`,
      lastName: `${base}-${suffix}`,
    };
  }

  static accountName(base = 'Test Account'): string {
    return `${TestDataHelper.TEST_PREFIX} ${base} ${TestDataHelper.uniqueSuffix()}`;
  }

  static leadName(base = 'Test Lead'): { firstName: string; lastName: string; companyName: string } {
    const suffix = TestDataHelper.uniqueSuffix();
    return {
      firstName: TestDataHelper.TEST_PREFIX,
      lastName: `${base}-${suffix}`,
      companyName: `${TestDataHelper.TEST_PREFIX} Company ${suffix}`,
    };
  }

  static email(domain = 'autotest.invalid'): string {
    return `autotest-${TestDataHelper.uniqueSuffix().toLowerCase()}@${domain}`;
  }

  static phone(): string {
    const digits = Math.floor(Math.random() * 9000000000) + 1000000000;
    return `+1${digits}`;
  }

  static url(base = 'https://autotest'): string {
    return `${base}-${TestDataHelper.uniqueSuffix().toLowerCase()}.invalid`;
  }

  static description(entity = 'record'): string {
    return `Auto-generated test ${entity} — created by Playwright framework at ${new Date().toISOString()}`;
  }

  // ─── Date Helpers ──────────────────────────────────────────────────────────

  /**
   * Returns a date string in MM/DD/YYYY format (CRM date field format).
   */
  static futureDate(daysFromNow = 7): string {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  }

  static pastDate(daysAgo = 7): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  }

  static today(): string {
    return TestDataHelper.futureDate(0);
  }

  // ─── Numeric Helpers ───────────────────────────────────────────────────────

  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static currency(min = 1000, max = 999999): string {
    return TestDataHelper.randomInt(min, max).toString();
  }

  // ─── Cleanup Helpers ───────────────────────────────────────────────────────

  /**
   * Returns the prefix pattern used in all auto-generated records.
   * Use this to search and bulk-delete test data after a test run.
   */
  static getTestPrefix(): string {
    return TestDataHelper.TEST_PREFIX;
  }
}
