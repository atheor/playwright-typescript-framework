/**
 * Base API Client
 * Core HTTP client with built-in error handling, logging, and retry logic
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
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
}

/**
 * Base API Client with comprehensive features
 */
export class ApiClient {
  protected readonly client: AxiosInstance;
  protected readonly logger: Logger;
  protected readonly clientOptions: Required<ApiClientOptions>;
  private authToken?: string;
  private refreshTokenFn?: () => Promise<string>;

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
    };

    this.client = this.createClient();
    this.setupInterceptors();
  }

  /**
   * Create Axios instance
   */
  private createClient(): AxiosInstance {
    return axios.create({
      baseURL: this.clientOptions.baseUrl,
      timeout: this.clientOptions.timeout,
      headers: this.clientOptions.headers,
      validateStatus: () => true, // Handle all status codes
    });
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add auth token if available
        if (this.authToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Log request
        if (this.clientOptions.enableLogging) {
          this.logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            headers: config.headers,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error', error as Error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.clientOptions.enableLogging) {
          this.logger.debug(`API Response: ${response.status} ${response.config.url}`, {
            data: response.data,
          });
        }
        return response;
      },
      async (error) => {
        // Handle token refresh on 401
        if (error.response?.status === 401 && this.refreshTokenFn) {
          try {
            this.authToken = await this.refreshTokenFn();
            error.config.headers.Authorization = `Bearer ${this.authToken}`;
            return this.client.request(error.config);
          } catch (refreshError) {
            this.logger.error('Token refresh failed', refreshError as Error);
          }
        }

        return Promise.reject(error);
      }
    );
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
    const startTime = Date.now();
    
    const axiosConfig: AxiosRequestConfig = {
      url: config.url,
      method: config.method,
      headers: config.headers,
      params: config.params,
      data: config.data,
      timeout: config.timeout ?? this.clientOptions.timeout,
      responseType: config.responseType ?? 'json',
    };

    // Add auth
    if (config.auth) {
      axiosConfig.auth = config.auth;
    }
    if (config.bearerToken) {
      axiosConfig.headers = {
        ...axiosConfig.headers,
        Authorization: `Bearer ${config.bearerToken}`,
      };
    }

    const retryOptions: Partial<RetryOptions> = {
      maxAttempts: this.clientOptions.retries,
      retryCondition: (error: Error) => {
        // Retry on network errors or 5xx errors
        const axiosError = error as { response?: { status: number } };
        return !axiosError.response || axiosError.response.status >= 500;
      },
      onRetry: (attempt, error) => {
        this.logger.warn(`Retrying API request (attempt ${attempt}): ${error.message}`);
      },
    };

    try {
      const response = await retry(
        () => this.client.request<T>(axiosConfig),
        retryOptions
      );

      const responseTime = Date.now() - startTime;

      // Check for error status codes
      if (response.status >= 400) {
        this.handleErrorResponse(config, response);
      }

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        config,
        responseTime,
      };
    } catch (error) {
      this.handleRequestError(config, error as Error);
      throw error;
    }
  }

  /**
   * Handle error responses
   */
  private handleErrorResponse(config: ApiRequestConfig, response: AxiosResponse): void {
    if (response.status === 401) {
      throw new ApiAuthenticationException(
        config.url,
        'Unauthorized - invalid or expired credentials'
      );
    }

    throw new ApiRequestException(
      config.method,
      config.url,
      response.status,
      response.data
    );
  }

  /**
   * Handle request errors
   */
  private handleRequestError(config: ApiRequestConfig, error: Error): void {
    if (error.message.includes('timeout')) {
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
   * Upload file
   */
  public async uploadFile<T>(
    url: string,
    file: Buffer | Blob,
    fileName: string,
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    // Handle both Buffer and Blob types
    const blob = file instanceof Blob ? file : new Blob([new Uint8Array(file)]);
    formData.append('file', blob, fileName);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.request<T>({
      url,
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Download file
   */
  public async downloadFile(url: string): Promise<Buffer> {
    const response = await this.request<ArrayBuffer>({
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
}

/**
 * Factory function for creating API client
 */
export function createApiClient(options?: ApiClientOptions): ApiClient {
  return new ApiClient(options);
}
