/**
 * Store API Actions
 * Higher-level actions for Store endpoints
 */

import { ApiClient } from '../../../src';
import { Logger } from '../../../src/utils/logger';
import { Order, ApiResponse } from '../models';

/**
 * Store API Actions
 */
export class StoreActions {
  private client: ApiClient;
  private logger: Logger;

  constructor(client: ApiClient) {
    this.client = client;
    this.logger = Logger.getInstance();
  }

  /**
   * Place an order for a pet
   */
  async placeOrder(order: Order): Promise<Order> {
    this.logger.step(1, `Placing order for pet: ${order.petId}`);
    const response = await this.client.post<Order>('/store/order', order);
    
    if (response.status !== 200) {
      throw new Error(`Failed to place order: ${response.status}`);
    }
    
    return response.data;
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: number): Promise<Order> {
    this.logger.step(1, `Getting order by ID: ${orderId}`);
    const response = await this.client.get<Order>(`/store/order/${orderId}`);
    
    if (response.status === 404) {
      throw new Error(`Order not found: ${orderId}`);
    }
    
    return response.data;
  }

  /**
   * Delete an order
   */
  async deleteOrder(orderId: number): Promise<void> {
    this.logger.step(1, `Deleting order: ${orderId}`);
    const response = await this.client.delete<ApiResponse>(`/store/order/${orderId}`);
    
    if (response.status !== 200) {
      throw new Error(`Failed to delete order: ${response.status}`);
    }
  }

  /**
   * Get store inventory
   */
  async getInventory(): Promise<Record<string, number>> {
    this.logger.step(1, 'Getting store inventory');
    const response = await this.client.get<Record<string, number>>('/store/inventory');
    
    return response.data;
  }

  /**
   * Check if order exists
   */
  async orderExists(orderId: number): Promise<boolean> {
    try {
      const response = await this.client.get<Order>(`/store/order/${orderId}`);
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
