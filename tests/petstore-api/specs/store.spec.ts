/**
 * Store API Tests
 */

import { test, expect } from '../fixtures';
import { Order } from '../models';

test.describe('Store API', () => {
  const testOrderId = Math.floor(Math.random() * 1000) + 1;

  const testOrder: Order = {
    id: testOrderId,
    petId: 1,
    quantity: 1,
    shipDate: new Date().toISOString(),
    status: 'placed',
    complete: false,
  };

  test.describe('Inventory', () => {
    test('should get store inventory', async ({ storeActions }) => {
      const inventory = await storeActions.getInventory();
      
      expect(typeof inventory).toBe('object');
      // Inventory should have status counts
      expect(inventory).toBeDefined();
    });

    test('should return inventory with numeric values', async ({ storeActions }) => {
      const inventory = await storeActions.getInventory();
      
      Object.values(inventory).forEach((value) => {
        expect(typeof value).toBe('number');
      });
    });
  });

  test.describe('Place Order', () => {
    test('should place a new order', async ({ storeActions }) => {
      const placedOrder = await storeActions.placeOrder(testOrder);
      
      expect(placedOrder.id).toBe(testOrder.id);
      expect(placedOrder.petId).toBe(testOrder.petId);
      expect(placedOrder.status).toBe('placed');
    });

    test('should place order with different quantities', async ({ storeActions }) => {
      const orderWithQuantity: Order = {
        ...testOrder,
        id: testOrderId + 1,
        quantity: 5,
      };
      
      const placedOrder = await storeActions.placeOrder(orderWithQuantity);
      
      expect(placedOrder.quantity).toBe(5);
    });
  });

  test.describe('Get Order', () => {
    test.beforeEach(async ({ storeActions }) => {
      await storeActions.placeOrder(testOrder);
    });

    test('should get order by ID', async ({ storeActions }) => {
      const order = await storeActions.getOrderById(testOrderId);
      
      expect(order.id).toBe(testOrderId);
      expect(order.petId).toBe(testOrder.petId);
    });

    test('should throw error for non-existent order', async ({ storeActions }) => {
      await expect(storeActions.getOrderById(999999)).rejects.toThrow('Order not found');
    });

    test('should throw error for invalid order ID', async ({ storeActions }) => {
      // Order IDs > 10 typically don't exist in Petstore
      await expect(storeActions.getOrderById(0)).rejects.toThrow();
    });
  });

  test.describe('Delete Order', () => {
    test('should delete an order', async ({ storeActions }) => {
      // Create order to delete
      const orderToDelete: Order = {
        ...testOrder,
        id: testOrderId + 50,
      };
      await storeActions.placeOrder(orderToDelete);
      
      // Delete the order
      await storeActions.deleteOrder(orderToDelete.id!);
      
      // Verify order is deleted
      const exists = await storeActions.orderExists(orderToDelete.id!);
      expect(exists).toBe(false);
    });
  });

  test.describe('Order Lifecycle', () => {
    test('should complete full order lifecycle', async ({ storeActions }) => {
      const lifecycleOrderId = testOrderId + 100;
      const lifecycleOrder: Order = {
        id: lifecycleOrderId,
        petId: 1,
        quantity: 2,
        shipDate: new Date().toISOString(),
        status: 'placed',
        complete: false,
      };

      // Place order
      const placed = await storeActions.placeOrder(lifecycleOrder);
      expect(placed.id).toBe(lifecycleOrderId);
      expect(placed.status).toBe('placed');

      // Get order
      const fetched = await storeActions.getOrderById(lifecycleOrderId);
      expect(fetched.quantity).toBe(2);

      // Delete order
      await storeActions.deleteOrder(lifecycleOrderId);
      const exists = await storeActions.orderExists(lifecycleOrderId);
      expect(exists).toBe(false);
    });
  });

  test.describe('Order Status', () => {
    test('should place order with approved status', async ({ storeActions }) => {
      const approvedOrder: Order = {
        ...testOrder,
        id: testOrderId + 200,
        status: 'approved',
      };
      
      const placed = await storeActions.placeOrder(approvedOrder);
      expect(placed.status).toBe('approved');
    });

    test('should place order with delivered status', async ({ storeActions }) => {
      const deliveredOrder: Order = {
        ...testOrder,
        id: testOrderId + 201,
        status: 'delivered',
        complete: true,
      };
      
      const placed = await storeActions.placeOrder(deliveredOrder);
      expect(placed.status).toBe('delivered');
      expect(placed.complete).toBe(true);
    });
  });
});
