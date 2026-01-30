/**
 * Browser Driver
 * Manages browser instances and provides utilities for browser operations
 */

import {
  Browser,
  BrowserContext,
  Page,
  chromium,
  firefox,
  webkit,
  BrowserType,
} from '@playwright/test';
import { FrameworkConfig } from '../config';
import { Logger } from '../../utils/logger';

export interface BrowserDriverOptions {
  browserType?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  slowMo?: number;
  viewport?: { width: number; height: number };
  recordVideo?: boolean;
  baseUrl?: string;
}

/**
 * Browser driver for managing browser instances
 */
export class BrowserDriver {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private logger: Logger;

  constructor(private options: BrowserDriverOptions = {}) {
    this.logger = Logger.getInstance();
    this.applyDefaultOptions();
  }

  /**
   * Apply default options from framework config
   */
  private applyDefaultOptions(): void {
    const browserConfig = FrameworkConfig.getBrowser();
    const config = FrameworkConfig.getConfig();

    this.options = {
      browserType: this.options.browserType ?? browserConfig.browserType,
      headless: this.options.headless ?? browserConfig.headless,
      slowMo: this.options.slowMo ?? browserConfig.slowMo,
      viewport: this.options.viewport ?? {
        width: browserConfig.viewportWidth,
        height: browserConfig.viewportHeight,
      },
      recordVideo: this.options.recordVideo ?? browserConfig.recordVideo,
      baseUrl: this.options.baseUrl ?? config.baseUrl,
    };
  }

  /**
   * Get the browser type instance
   */
  private getBrowserType(): BrowserType {
    switch (this.options.browserType) {
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
      default:
        return chromium;
    }
  }

  /**
   * Launch a new browser instance
   */
  public async launch(): Promise<Browser> {
    this.logger.info(`Launching ${this.options.browserType} browser`);
    
    this.browser = await this.getBrowserType().launch({
      headless: this.options.headless,
      slowMo: this.options.slowMo,
    });

    return this.browser;
  }

  /**
   * Create a new browser context
   */
  public async createContext(): Promise<BrowserContext> {
    if (!this.browser) {
      await this.launch();
    }

    const contextOptions: Parameters<Browser['newContext']>[0] = {
      viewport: this.options.viewport,
      baseURL: this.options.baseUrl,
    };

    if (this.options.recordVideo) {
      contextOptions.recordVideo = {
        dir: FrameworkConfig.getConfig().videosDir,
      };
    }

    this.context = await this.browser!.newContext(contextOptions);
    this.logger.debug('Browser context created');

    return this.context;
  }

  /**
   * Create a new page
   */
  public async newPage(): Promise<Page> {
    if (!this.context) {
      await this.createContext();
    }

    this.page = await this.context!.newPage();
    this.logger.debug('New page created');

    return this.page;
  }

  /**
   * Get current page
   */
  public getPage(): Page | null {
    return this.page;
  }

  /**
   * Get current context
   */
  public getContext(): BrowserContext | null {
    return this.context;
  }

  /**
   * Get browser instance
   */
  public getBrowser(): Browser | null {
    return this.browser;
  }

  /**
   * Close current page
   */
  public async closePage(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
      this.logger.debug('Page closed');
    }
  }

  /**
   * Close current context
   */
  public async closeContext(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
      this.page = null;
      this.logger.debug('Context closed');
    }
  }

  /**
   * Close browser
   */
  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
      this.logger.info('Browser closed');
    }
  }

  /**
   * Take a screenshot
   */
  public async takeScreenshot(name: string): Promise<string> {
    if (!this.page) {
      throw new Error('No page available for screenshot');
    }

    const screenshotsDir = FrameworkConfig.getConfig().screenshotsDir;
    const path = `${screenshotsDir}/${name}-${Date.now()}.png`;
    
    await this.page.screenshot({ path, fullPage: true });
    this.logger.info(`Screenshot saved: ${path}`);

    return path;
  }
}
