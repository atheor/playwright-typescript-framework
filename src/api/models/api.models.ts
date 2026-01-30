/**
 * API Request/Response Models
 * Type-safe models for API interactions
 */

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Request configuration
 */
export interface ApiRequestConfig {
  /** Request URL (can be relative to base URL) */
  url: string;
  /** HTTP method */
  method: HttpMethod;
  /** Request headers */
  headers?: Record<string, string>;
  /** Query parameters */
  params?: Record<string, string | number | boolean>;
  /** Request body */
  data?: unknown;
  /** Request timeout in ms */
  timeout?: number;
  /** Whether to validate SSL certificates */
  validateStatus?: (status: number) => boolean;
  /** Response type */
  responseType?: 'json' | 'text' | 'arraybuffer';
  /** Basic auth credentials */
  auth?: {
    username: string;
    password: string;
  };
  /** Bearer token */
  bearerToken?: string;
  /** Whether to throw an exception on 4xx/5xx responses (default: false) */
  throwOnError?: boolean;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  /** Response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Original request config */
  config: ApiRequestConfig;
  /** Response time in ms */
  responseTime: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * API Error response
 */
export interface ApiErrorResponse {
  message: string;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp?: string;
  path?: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

/**
 * Common CRUD response
 */
export interface CrudResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Batch operation request
 */
export interface BatchRequest<T> {
  operations: Array<{
    method: HttpMethod;
    path: string;
    body?: T;
  }>;
}

/**
 * Batch operation response
 */
export interface BatchResponse<T> {
  results: Array<{
    status: number;
    data?: T;
    error?: string;
  }>;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  version?: string;
  uptime?: number;
  services?: Record<string, {
    status: 'up' | 'down';
    latency?: number;
  }>;
}
