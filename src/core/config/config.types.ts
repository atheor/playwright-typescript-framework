/**
 * Framework Configuration Types
 * Defines all configurable options for the test automation framework
 */

export type WaitStrategy = 'visible' | 'attached' | 'hidden' | 'detached' | 'stable';
export type Environment = 'local' | 'dev' | 'staging' | 'prod';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface TimeoutConfig {
  /** Default timeout for all operations in milliseconds */
  default: number;
  /** Timeout for navigation operations */
  navigation: number;
  /** Timeout for element interactions */
  element: number;
  /** Timeout for API requests */
  api: number;
  /** Timeout for FTP operations */
  ftp: number;
  /** Timeout for assertions */
  assertion: number;
}

export interface RetryConfig {
  /** Number of retries for element actions */
  elementAction: number;
  /** Number of retries for API requests */
  apiRequest: number;
  /** Number of retries for FTP operations */
  ftpOperation: number;
  /** Delay between retries in milliseconds */
  retryDelay: number;
}

export interface BrowserConfig {
  /** Browser type to use */
  browserType: 'chromium' | 'firefox' | 'webkit';
  /** Run browser in headless mode */
  headless: boolean;
  /** Slow down operations by this amount (ms) */
  slowMo: number;
  /** Viewport width */
  viewportWidth: number;
  /** Viewport height */
  viewportHeight: number;
  /** Record video on failure */
  recordVideo: boolean;
  /** Capture screenshot on failure */
  screenshotOnFailure: boolean;
  /** Capture trace on failure */
  traceOnFailure: boolean;
}

export interface ApiConfig {
  /** Base URL for API requests */
  baseUrl: string;
  /** Default headers for all requests */
  defaultHeaders: Record<string, string>;
  /** Enable request/response logging */
  enableLogging: boolean;
  /** Validate SSL certificates */
  validateSsl: boolean;
}

export interface FtpConfig {
  /** FTP server host */
  host: string;
  /** FTP server port */
  port: number;
  /** FTP username */
  username: string;
  /** FTP password */
  password: string;
  /** Use secure FTP (FTPS) */
  secure: boolean;
}

export interface LoggingConfig {
  /** Log level */
  level: LogLevel;
  /** Enable console logging */
  console: boolean;
  /** Enable file logging */
  file: boolean;
  /** Log file path */
  filePath: string;
  /** Include timestamps in logs */
  timestamps: boolean;
  /** Include stack traces for errors */
  stackTraces: boolean;
}

export interface FrameworkConfigOptions {
  /** Current environment */
  environment: Environment;
  /** Base URL for UI tests */
  baseUrl: string;
  /** Timeout configurations */
  timeouts: TimeoutConfig;
  /** Retry configurations */
  retries: RetryConfig;
  /** Browser configurations */
  browser: BrowserConfig;
  /** API configurations */
  api: ApiConfig;
  /** FTP configurations */
  ftp: FtpConfig;
  /** Logging configurations */
  logging: LoggingConfig;
  /** Element wait strategy */
  elementWaitStrategy: WaitStrategy;
  /** Enable action logging */
  actionLogging: boolean;
  /** Screenshots directory */
  screenshotsDir: string;
  /** Videos directory */
  videosDir: string;
  /** Reports directory */
  reportsDir: string;
}
