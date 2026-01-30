/**
 * Base API Client
 * Core HTTP client using Playwright's APIRequestContext with built-in error handling, logging, and retry logic
 */

import { APIRequestContext, APIResponse, request } from '@playwright/test';
import { FrameworkConfig } from '../../core/config';
import {
  ApiRequestException,
  ApiTimeoutException,
  ApiAuthenticationException,
} from '../../core/exceptions';
import { Logger } from '../../utils/logger';
import { retry, RetryOptions } from '../../utils/retry.utils';
import { ApiRequestConfig, ApiResponse } from '../models/api.models';

/**
 * API Client Options
 */
export interface ApiClientOptions {
  /** Base URL for API requests */
  baseUrl?: string;
  /** Default request timeout */
  timeout?: number;
  /** Default headers */
  headers?: Record<string, string>;
  /** Enable request/response logging */
  enableLogging?: boolean;
  /** Number of retries for failed requests */
  retries?: number;
  /** Validate SSL certificates */
  validateSsl?: boolean;
  /** HTTP credentials for basic auth */
  httpCredentials?: {
    username: string;
    password: string;
  };
  /** Extra HTTP headers */
  extraHTTPHeaders?: Record<string, string>;
}

/**
 * Base API Client using Playwright's APIRequestContext
 */
export class ApiClient {
  protected context: APIRequestContext | null = null;
  protected readonly logger: Logger;
  protected readonly clientOptions: Required<Omit<ApiClientOptions, 'httpCredentials' | 'extraHTTPHeaders'>> & 
    Pick<ApiClientOptions, 'httpCredentials' | 'extraHTTPHeaders'>;
  private authToken?: string;
  private refreshTokenFn?: () => Promise<string>;
  private initialized: boolean = false;

  constructor(options: ApiClientOptions = {}) {
    this.logger = Logger.getInstance();
    
    const apiConfig = FrameworkConfig.getApi();
    const timeouts = FrameworkConfig.getTimeouts();
    const retries = FrameworkConfig.getRetries();

    this.clientOptions = {
      baseUrl: options.baseUrl ?? apiConfig.baseUrl,
      timeout: options.timeout ?? timeouts.api,
      headers: { ...apiConfig.defaultHeaders, ...options.headers },
      enableLogging: options.enableLogging ?? apiConfig.enableLogging,
      retries: options.retries ?? retries.apiRequest,
      validateSsl: options.validateSsl ?? apiConfig.validateSsl,
      httpCredentials: options.httpCredentials,
      extraHTTPHeaders: options.extraHTTPHeaders,
    };
  }

  /**
   * Initialize the Playwright API context
   * This must be called before making requests if not using a pre-existing context
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    const headers = { ...this.clientOptions.headers };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Ensure baseURL ends with a trailing slash for proper URL resolution
    let baseUrl = this.clientOptions.baseUrl;
    if (baseUrl && !baseUrl.endsWith('/')) {
      baseUrl += '/';
    }

    this.context = await request.newContext({
      baseURL: baseUrl,
      extraHTTPHeaders: { ...headers, ...this.clientOptions.extraHTTPHeaders },
      ignoreHTTPSErrors: !this.clientOptions.validateSsl,
      timeout: this.clientOptions.timeout,
      httpCredentials: this.clientOptions.httpCredentials,
    });

    this.initialized = true;
  }

  /**
   * Set an existing Playwright APIRequestContext
   */
  public setContext(context: APIRequestContext): this {
    this.context = context;
    this.initialized = true;
    return this;
  }

  /**
   * Get the underlying Playwright APIRequestContext
   */
  public getContext(): APIRequestContext | null {
    return this.context;
  }

  /**
   * Ensure context is initialized
   */
  private async ensureContext(): Promise<APIRequestContext> {
    if (!this.context) {
      await this.initialize();
    }
    return this.context!;
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string): this {
    this.authToken = token;
    return this;
  }

  /**
   * Clear authentication token
   */
  public clearAuthToken(): this {
    this.authToken = undefined;
    return this;
  }

  /**
   * Set token refresh function
   */
  public setTokenRefreshFn(fn: () => Promise<string>): this {
    this.refreshTokenFn = fn;
    return this;
  }

  /**
   * Execute HTTP request with retry logic
   */
  public async request<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const context = await this.ensureContext();
    const startTime = Date.now();
    
    const headers: Record<string, string> = {
      ...this.clientOptions.headers,
      ...config.headers,
    };

    // Add auth token
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    if (config.bearerToken) {
      headers['Authorization'] = `Bearer ${config.bearerToken}`;
    }

    // Build URL with query params
    // Strip leading slash from relative URLs for proper baseURL resolution
    let url = config.url.startsWith('/') ? config.url.slice(1) : config.url;
    if (config.params) {
      const searchParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const retryOptions: Partial<RetryOptions> = {
      maxAttempts: this.clientOptions.retries,
      retryCondition: (error: Error) => {
        // Retry on network errors or 5xx errors
        const statusMatch = error.message.match(/status (\d+)/);
        if (statusMatch) {
          const status = parseInt(statusMatch[1], 10);
          return status >= 500;
        }
        return true; // Retry on network errors
      },
      onRetry: (attempt, error) => {
        this.logger.warn(`Retrying API request (attempt ${attempt}): ${error.message}`);
      },
    };

    // Log request
    if (this.clientOptions.enableLogging) {
      this.logger.debug(`API Request: ${config.method} ${url}`, {
        headers,
        data: config.data,
      });
    }

    try {
      const response = await retry(
        () => this.executeRequest(context, config.method, url, headers, config),
        retryOptions
      );

      const responseTime = Date.now() - startTime;

      // Parse response body
      let data: T;
      const contentType = response.headers()['content-type'] || '';
      
      if (config.responseType === 'arraybuffer') {
        data = (await response.body()) as unknown as T;
      } else if (config.responseType === 'text' || !contentType.includes('application/json')) {
        data = (await response.text()) as unknown as T;
      } else {
        try {
          data = await response.json();
        } catch {
          data = (await response.text()) as unknown as T;
        }
      }

      // Log response
      if (this.clientOptions.enableLogging) {
        this.logger.debug(`API Response: ${response.status()} ${url}`, {
          data,
        });
      }

      // Only throw on error status codes if throwOnError is explicitly true
      if (config.throwOnError && response.status() >= 400) {
        await this.handleErrorResponse(config, response, data);
      }

      return {
        data,
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers() as Record<string, string>,
        config,
        responseTime,
      };
    } catch (error) {
      // Re-throw our custom exceptions as-is
      if (error instanceof ApiRequestException || 
          error instanceof ApiAuthenticationException ||
          error instanceof ApiTimeoutException) {
        throw error;
      }

      // Handle token refresh on 401
      if ((error as Error).message.includes('401') && this.refreshTokenFn) {
        try {
          this.authToken = await this.refreshTokenFn();
          return this.request<T>(config);
        } catch (refreshError) {
          this.logger.error('Token refresh failed', refreshError as Error);
        }
      }

      this.handleRequestError(config, error as Error);
      throw error;
    }
  }

  /**
   * Execute the actual request using Playwright's API
   */
  private async executeRequest(
    context: APIRequestContext,
    method: string,
    url: string,
    headers: Record<string, string>,
    config: ApiRequestConfig
  ): Promise<APIResponse> {
    const requestOptions: Parameters<APIRequestContext['fetch']>[1] = {
      headers,
      timeout: config.timeout ?? this.clientOptions.timeout,
      failOnStatusCode: false, // We handle status codes ourselves
    };

    // Add body for methods that support it
    if (config.data !== undefined && ['POST', 'PUT', 'PATCH'].includes(method)) {
      if (config.headers?.['Content-Type']?.includes('multipart/form-data')) {
        // For multipart, data should be properly formatted
        requestOptions.multipart = config.data as { [key: string]: string | number | boolean | { name: string; mimeType: string; buffer: Buffer } };
      } else {
        requestOptions.data = config.data;
      }
    }

    // Add basic auth if provided
    if (config.auth) {
      const basicAuth = Buffer.from(`${config.auth.username}:${config.auth.password}`).toString('base64');
      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': `Basic ${basicAuth}`,
      };
    }

    return context.fetch(url, {
      method,
      ...requestOptions,
    });
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(
    config: ApiRequestConfig,
    response: APIResponse,
    data: unknown
  ): Promise<void> {
    if (response.status() === 401) {
      throw new ApiAuthenticationException(
        config.url,
        'Unauthorized - invalid or expired credentials'
      );
    }

    throw new ApiRequestException(
      config.method,
      config.url,
      response.status(),
      data
    );
  }

  /**
   * Handle request errors
   */
  private handleRequestError(config: ApiRequestConfig, error: Error): void {
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      throw new ApiTimeoutException(
        config.method,
        config.url,
        config.timeout ?? this.clientOptions.timeout
      );
    }

    throw new ApiRequestException(config.method, config.url, 0, error.message);
  }

  /**
   * GET request
   */
  public async get<T>(
    url: string,
    params?: Record<string, string | number | boolean>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'GET', params, headers });
  }

  /**
   * POST request
   */
  public async post<T>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'POST', data, headers });
  }

  /**
   * PUT request
   */
  public async put<T>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PUT', data, headers });
  }

  /**
   * PATCH request
   */
  public async patch<T>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PATCH', data, headers });
  }

  /**
   * DELETE request
   */
  public async delete<T>(
    url: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'DELETE', headers });
  }

  /**
   * HEAD request
   */
  public async head(
    url: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<void>> {
    return this.request<void>({ url, method: 'HEAD', headers });
  }

  /**
   * OPTIONS request
   */
  public async options(
    url: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<void>> {
    return this.request<void>({ url, method: 'OPTIONS', headers });
  }

  /**
   * Upload file using Playwright's multipart support
   */
  public async uploadFile<T>(
    url: string,
    file: Buffer | Blob,
    fileName: string,
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const context = await this.ensureContext();
    const startTime = Date.now();

    const headers: Record<string, string> = {
      ...this.clientOptions.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Remove Content-Type to let Playwright set it for multipart
    delete headers['Content-Type'];

    const multipart: { [key: string]: string | number | boolean | { name: string; mimeType: string; buffer: Buffer } } = {
      file: {
        name: fileName,
        mimeType: 'application/octet-stream',
        buffer: file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file,
      },
    };

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        multipart[key] = value;
      });
    }

    const response = await context.fetch(url, {
      method: 'POST',
      headers,
      multipart,
      failOnStatusCode: false,
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json() as T;

    return {
      data,
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers() as Record<string, string>,
      config: { url, method: 'POST' },
      responseTime,
    };
  }

  /**
   * Download file
   */
  public async downloadFile(url: string): Promise<Buffer> {
    const response = await this.request<Buffer>({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  }

  /**
   * Health check endpoint
   */
  public async healthCheck(
    endpoint: string = '/health'
  ): Promise<{ healthy: boolean; responseTime: number }> {
    try {
      const response = await this.get(endpoint);
      return {
        healthy: response.status === 200,
        responseTime: response.responseTime,
      };
    } catch {
      return { healthy: false, responseTime: -1 };
    }
  }

  /**
   * Dispose the API context
   */
  public async dispose(): Promise<void> {
    if (this.context) {
      await this.context.dispose();
      this.context = null;
      this.initialized = false;
    }
  }
}

/**
 * Factory function for creating API client
 */
export function createApiClient(options?: ApiClientOptions): ApiClient {
  return new ApiClient(options);
}
