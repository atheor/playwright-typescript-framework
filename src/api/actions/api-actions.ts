/**
 * API Actions
 * Higher-level API action handlers
 */

import { ApiClient } from '../clients/api-client';
import { ApiResponse, AuthResponse, PaginatedResponse, PaginationParams } from '../models/api.models';
import { Logger } from '../../utils/logger';

/**
 * Authentication Actions
 */
export class AuthActions {
  private client: ApiClient;
  private logger: Logger;

  constructor(client: ApiClient) {
    this.client = client;
    this.logger = Logger.getInstance();
  }

  /**
   * Login with username and password
   */
  public async login(
    username: string,
    password: string,
    endpoint: string = '/auth/login'
  ): Promise<AuthResponse> {
    this.logger.info(`Logging in user: ${username}`);
    
    const response = await this.client.post<AuthResponse>(endpoint, {
      username,
      password,
    });

    if (response.data.accessToken) {
      this.client.setAuthToken(response.data.accessToken);
    }

    return response.data;
  }

  /**
   * Logout
   */
  public async logout(endpoint: string = '/auth/logout'): Promise<void> {
    this.logger.info('Logging out');
    await this.client.post(endpoint);
    this.client.clearAuthToken();
  }

  /**
   * Refresh token
   */
  public async refreshToken(
    refreshToken: string,
    endpoint: string = '/auth/refresh'
  ): Promise<AuthResponse> {
    this.logger.info('Refreshing token');
    
    const response = await this.client.post<AuthResponse>(endpoint, {
      refreshToken,
    });

    if (response.data.accessToken) {
      this.client.setAuthToken(response.data.accessToken);
    }

    return response.data;
  }

  /**
   * Register new user
   */
  public async register(
    userData: Record<string, unknown>,
    endpoint: string = '/auth/register'
  ): Promise<ApiResponse<unknown>> {
    this.logger.info('Registering new user');
    return await this.client.post(endpoint, userData);
  }

  /**
   * Request password reset
   */
  public async requestPasswordReset(
    email: string,
    endpoint: string = '/auth/forgot-password'
  ): Promise<void> {
    this.logger.info(`Requesting password reset for: ${email}`);
    await this.client.post(endpoint, { email });
  }
}

/**
 * CRUD Actions for REST resources
 */
export class CrudActions<T> {
  private client: ApiClient;
  private logger: Logger;
  private basePath: string;

  constructor(client: ApiClient, basePath: string) {
    this.client = client;
    this.logger = Logger.getInstance();
    this.basePath = basePath;
  }

  /**
   * Create resource
   */
  public async create(data: Partial<T>): Promise<T> {
    this.logger.info(`Creating resource at ${this.basePath}`);
    const response = await this.client.post<T>(this.basePath, data);
    return response.data;
  }

  /**
   * Get resource by ID
   */
  public async getById(id: string | number): Promise<T> {
    this.logger.info(`Getting resource ${this.basePath}/${id}`);
    const response = await this.client.get<T>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Get all resources
   */
  public async getAll(
    params?: Record<string, string | number | boolean>
  ): Promise<T[]> {
    this.logger.info(`Getting all resources from ${this.basePath}`);
    const response = await this.client.get<T[]>(this.basePath, params);
    return response.data;
  }

  /**
   * Get paginated resources
   */
  public async getPaginated(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<T>> {
    this.logger.info(`Getting paginated resources from ${this.basePath}`);
    const response = await this.client.get<PaginatedResponse<T>>(
      this.basePath,
      pagination as Record<string, string | number | boolean>
    );
    return response.data;
  }

  /**
   * Update resource
   */
  public async update(id: string | number, data: Partial<T>): Promise<T> {
    this.logger.info(`Updating resource ${this.basePath}/${id}`);
    const response = await this.client.put<T>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  /**
   * Partial update resource
   */
  public async patch(id: string | number, data: Partial<T>): Promise<T> {
    this.logger.info(`Patching resource ${this.basePath}/${id}`);
    const response = await this.client.patch<T>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  /**
   * Delete resource
   */
  public async delete(id: string | number): Promise<void> {
    this.logger.info(`Deleting resource ${this.basePath}/${id}`);
    await this.client.delete(`${this.basePath}/${id}`);
  }

  /**
   * Search resources
   */
  public async search(
    query: string,
    params?: Record<string, string | number | boolean>
  ): Promise<T[]> {
    this.logger.info(`Searching resources at ${this.basePath}`);
    const response = await this.client.get<T[]>(`${this.basePath}/search`, {
      q: query,
      ...params,
    });
    return response.data;
  }

  /**
   * Check if resource exists
   */
  public async exists(id: string | number): Promise<boolean> {
    try {
      await this.client.head(`${this.basePath}/${id}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Count resources
   */
  public async count(
    filters?: Record<string, string | number | boolean>
  ): Promise<number> {
    const response = await this.client.get<{ count: number }>(
      `${this.basePath}/count`,
      filters
    );
    return response.data.count;
  }
}

/**
 * Batch Actions for bulk operations
 */
export class BatchActions<T> {
  private client: ApiClient;
  private logger: Logger;
  private basePath: string;

  constructor(client: ApiClient, basePath: string) {
    this.client = client;
    this.logger = Logger.getInstance();
    this.basePath = basePath;
  }

  /**
   * Create multiple resources
   */
  public async createMany(items: Partial<T>[]): Promise<T[]> {
    this.logger.info(`Creating ${items.length} resources at ${this.basePath}`);
    const response = await this.client.post<T[]>(`${this.basePath}/batch`, {
      items,
    });
    return response.data;
  }

  /**
   * Update multiple resources
   */
  public async updateMany(
    updates: Array<{ id: string | number; data: Partial<T> }>
  ): Promise<T[]> {
    this.logger.info(`Updating ${updates.length} resources at ${this.basePath}`);
    const response = await this.client.patch<T[]>(`${this.basePath}/batch`, {
      updates,
    });
    return response.data;
  }

  /**
   * Delete multiple resources
   */
  public async deleteMany(ids: (string | number)[]): Promise<void> {
    this.logger.info(`Deleting ${ids.length} resources from ${this.basePath}`);
    await this.client.delete(`${this.basePath}/batch`);
  }
}

/**
 * Factory functions
 */
export function createAuthActions(client: ApiClient): AuthActions {
  return new AuthActions(client);
}

export function createCrudActions<T>(client: ApiClient, basePath: string): CrudActions<T> {
  return new CrudActions<T>(client, basePath);
}

export function createBatchActions<T>(client: ApiClient, basePath: string): BatchActions<T> {
  return new BatchActions<T>(client, basePath);
}
