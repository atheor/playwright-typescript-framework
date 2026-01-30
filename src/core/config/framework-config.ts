/**
 * Framework Configuration Manager
 * Centralized configuration management with environment support
 * Changes to timeout/retry behavior only need modification here
 */

import * as dotenv from 'dotenv';
import {
  FrameworkConfigOptions,
  TimeoutConfig,
  RetryConfig,
  BrowserConfig,
  ApiConfig,
  FtpConfig,
  LoggingConfig,
  WaitStrategy,
  Environment,
  LogLevel,
} from './config.types';
import { DEFAULT_CONFIG } from './defaults';
import { deepMerge } from '../../utils/object.utils';

// Load environment variables
dotenv.config();

/**
 * Singleton configuration manager for the framework
 * Provides centralized access to all configuration options
 */
class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: FrameworkConfigOptions;
  private initialized = false;

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Initialize configuration with custom options
   * @param options Partial configuration options to override defaults
   */
  public initialize(options: Partial<FrameworkConfigOptions> = {}): void {
    this.config = deepMerge(DEFAULT_CONFIG, options);
    this.loadEnvironmentVariables();
    this.initialized = true;
  }

  /**
   * Load configuration from environment variables
   */
  private loadEnvironmentVariables(): void {
    const env = process.env;

    if (env.FRAMEWORK_ENV) {
      this.config.environment = env.FRAMEWORK_ENV as Environment;
    }
    if (env.BASE_URL) {
      this.config.baseUrl = env.BASE_URL;
    }
    if (env.API_BASE_URL) {
      this.config.api.baseUrl = env.API_BASE_URL;
    }
    if (env.DEFAULT_TIMEOUT) {
      this.config.timeouts.default = parseInt(env.DEFAULT_TIMEOUT, 10);
    }
    if (env.HEADLESS) {
      this.config.browser.headless = env.HEADLESS === 'true';
    }
    if (env.LOG_LEVEL) {
      this.config.logging.level = env.LOG_LEVEL as LogLevel;
    }
    if (env.FTP_HOST) {
      this.config.ftp.host = env.FTP_HOST;
    }
    if (env.FTP_PORT) {
      this.config.ftp.port = parseInt(env.FTP_PORT, 10);
    }
    if (env.FTP_USERNAME) {
      this.config.ftp.username = env.FTP_USERNAME;
    }
    if (env.FTP_PASSWORD) {
      this.config.ftp.password = env.FTP_PASSWORD;
    }
  }

  /**
   * Get the full configuration object
   */
  public getConfig(): Readonly<FrameworkConfigOptions> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Get timeout configuration
   */
  public getTimeouts(): Readonly<TimeoutConfig> {
    return Object.freeze({ ...this.config.timeouts });
  }

  /**
   * Get retry configuration
   */
  public getRetries(): Readonly<RetryConfig> {
    return Object.freeze({ ...this.config.retries });
  }

  /**
   * Get browser configuration
   */
  public getBrowser(): Readonly<BrowserConfig> {
    return Object.freeze({ ...this.config.browser });
  }

  /**
   * Get API configuration
   */
  public getApi(): Readonly<ApiConfig> {
    return Object.freeze({ ...this.config.api });
  }

  /**
   * Get FTP configuration
   */
  public getFtp(): Readonly<FtpConfig> {
    return Object.freeze({ ...this.config.ftp });
  }

  /**
   * Get logging configuration
   */
  public getLogging(): Readonly<LoggingConfig> {
    return Object.freeze({ ...this.config.logging });
  }

  // ============================================
  // Fluent setters for runtime configuration
  // ============================================

  /**
   * Set the default timeout for all operations
   */
  public setDefaultTimeout(timeout: number): this {
    this.config.timeouts.default = timeout;
    return this;
  }

  /**
   * Set element interaction timeout
   */
  public setElementTimeout(timeout: number): this {
    this.config.timeouts.element = timeout;
    return this;
  }

  /**
   * Set navigation timeout
   */
  public setNavigationTimeout(timeout: number): this {
    this.config.timeouts.navigation = timeout;
    return this;
  }

  /**
   * Set API request timeout
   */
  public setApiTimeout(timeout: number): this {
    this.config.timeouts.api = timeout;
    return this;
  }

  /**
   * Set number of retries for element actions
   */
  public setActionRetries(retries: number): this {
    this.config.retries.elementAction = retries;
    return this;
  }

  /**
   * Set number of retries for API requests
   */
  public setApiRetries(retries: number): this {
    this.config.retries.apiRequest = retries;
    return this;
  }

  /**
   * Set element wait strategy
   */
  public setElementWaitStrategy(strategy: WaitStrategy): this {
    this.config.elementWaitStrategy = strategy;
    return this;
  }

  /**
   * Set base URL for UI tests
   */
  public setBaseUrl(url: string): this {
    this.config.baseUrl = url;
    return this;
  }

  /**
   * Set API base URL
   */
  public setApiBaseUrl(url: string): this {
    this.config.api.baseUrl = url;
    return this;
  }

  /**
   * Enable/disable headless mode
   */
  public setHeadless(headless: boolean): this {
    this.config.browser.headless = headless;
    return this;
  }

  /**
   * Set slow motion delay
   */
  public setSlowMo(slowMo: number): this {
    this.config.browser.slowMo = slowMo;
    return this;
  }

  /**
   * Enable/disable action logging
   */
  public setActionLogging(enabled: boolean): this {
    this.config.actionLogging = enabled;
    return this;
  }

  /**
   * Set current environment
   */
  public setEnvironment(env: Environment): this {
    this.config.environment = env;
    return this;
  }

  /**
   * Set viewport dimensions
   */
  public setViewport(width: number, height: number): this {
    this.config.browser.viewportWidth = width;
    this.config.browser.viewportHeight = height;
    return this;
  }

  /**
   * Configure screenshot on failure
   */
  public setScreenshotOnFailure(enabled: boolean): this {
    this.config.browser.screenshotOnFailure = enabled;
    return this;
  }

  /**
   * Configure trace on failure
   */
  public setTraceOnFailure(enabled: boolean): this {
    this.config.browser.traceOnFailure = enabled;
    return this;
  }

  /**
   * Reset configuration to defaults
   */
  public reset(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.initialized = false;
  }

  /**
   * Check if configuration has been initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const FrameworkConfig = ConfigurationManager.getInstance();

// Export class for testing purposes
export { ConfigurationManager };
