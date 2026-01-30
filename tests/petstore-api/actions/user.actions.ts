/**
 * User API Actions
 * Higher-level actions for User endpoints
 */

import { ApiClient } from '../../../src';
import { Logger } from '../../../src/utils/logger';
import { User, ApiResponse } from '../models';

/**
 * User API Actions
 */
export class UserActions {
  private client: ApiClient;
  private logger: Logger;

  constructor(client: ApiClient) {
    this.client = client;
    this.logger = Logger.getInstance();
  }

  /**
   * Create a new user
   */
  async createUser(user: User): Promise<ApiResponse> {
    this.logger.step(1, `Creating user: ${user.username}`);
    const response = await this.client.post<ApiResponse>('/user', user);
    
    return response.data;
  }

  /**
   * Create multiple users
   */
  async createUsersWithList(users: User[]): Promise<ApiResponse> {
    this.logger.step(1, `Creating ${users.length} users`);
    const response = await this.client.post<ApiResponse>('/user/createWithList', users);
    
    return response.data;
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User> {
    this.logger.step(1, `Getting user: ${username}`);
    const response = await this.client.get<User>(`/user/${username}`);
    
    if (response.status === 404) {
      throw new Error(`User not found: ${username}`);
    }
    
    return response.data;
  }

  /**
   * Update user
   */
  async updateUser(username: string, user: User): Promise<ApiResponse> {
    this.logger.step(1, `Updating user: ${username}`);
    const response = await this.client.put<ApiResponse>(`/user/${username}`, user);
    
    return response.data;
  }

  /**
   * Delete user
   */
  async deleteUser(username: string): Promise<void> {
    this.logger.step(1, `Deleting user: ${username}`);
    const response = await this.client.delete<ApiResponse>(`/user/${username}`);
    
    if (response.status !== 200) {
      throw new Error(`Failed to delete user: ${response.status}`);
    }
  }

  /**
   * Login user
   */
  async login(username: string, password: string): Promise<string> {
    this.logger.step(1, `Logging in user: ${username}`);
    const response = await this.client.get<string>('/user/login', { username, password });
    
    return response.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    this.logger.step(1, 'Logging out user');
    await this.client.get('/user/logout');
  }

  /**
   * Check if user exists
   */
  async userExists(username: string): Promise<boolean> {
    try {
      const response = await this.client.get<User>(`/user/${username}`);
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
