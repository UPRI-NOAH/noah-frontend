import { test as base, expect, Page } from '@playwright/test';
import { NetworkMock } from './network';

export interface PageIssues {
  /** Uncaught exceptions thrown in the page (window.onerror / unhandled). */
  pageErrors: Error[];
  /** console.error() output, including Angular's ErrorHandler. */
  consoleErrors: string[];
}

interface NoahFixtures {
  /** Hermetic network layer – see tests/support/network.ts */
  api: NetworkMock;
  /** Errors collected from the page during the test. */
  issues: PageIssues;
  /**
   * Uncaught exceptions matching one of these patterns don't fail the test.
   * Use only for known, ticketed defects (see `knownIssue` in helpers.ts).
   */
  allowedPageErrors: RegExp[];
}

/**
 * Project-wide `test` object. Every spec imports `test`/`expect` from here so
 * that each test automatically:
 *   1. runs against the hermetic network mock, and
 *   2. fails if the page throws an uncaught exception.
 */
export const test = base.extend<NoahFixtures>({
  allowedPageErrors: [[], { option: true }],

  api: [
    async ({ context, baseURL }, use, testInfo) => {
      const api = new NetworkMock(context, new URL(baseURL!).origin);
      await api.install();
      await use(api);
      if (api.unmocked.length) {
        await testInfo.attach('unmocked-requests.txt', {
          body: [...new Set(api.unmocked)].join('\n'),
          contentType: 'text/plain',
        });
      }
    },
    { auto: true },
  ],

  issues: [
    async ({ page, allowedPageErrors }, use, testInfo) => {
      const issues: PageIssues = { pageErrors: [], consoleErrors: [] };
      page.on('pageerror', (error) => issues.pageErrors.push(error));
      page.on('console', (message) => {
        if (message.type() === 'error')
          issues.consoleErrors.push(message.text());
      });

      await use(issues);

      if (issues.consoleErrors.length) {
        await testInfo.attach('console-errors.txt', {
          body: issues.consoleErrors.join('\n---\n'),
          contentType: 'text/plain',
        });
      }
      const unexpected = issues.pageErrors
        .map((error) => `${error.name}: ${error.message}`)
        .filter((text) => !allowedPageErrors.some((re) => re.test(text)));
      expect(unexpected, 'uncaught exceptions thrown by the page').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
export type { Page };
